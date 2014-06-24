var homunculus = require('homunculus');
var JsNode = homunculus.getClass('Node', 'es6');
var Token = homunculus.getClass('token');

var Class = require('./util/Class');
var join = require('./join');
var eventbus = require('./eventbus');

var Generator = Class(function(jsdc) {
  this.jsdc = jsdc;
  this.hash = {};
  this.star = {};
  this.stmt = {};
}).methods({
  parse: function(node, start) {
    var self = this;
    if(start) {
      self.jsdc.ignore(node.leaf(1));
      var token = node.leaf(2).first().token();
      self.jsdc.ignore(token);
      //有可能被scope前置过
      var hasPre = token.ignore;
      if(!hasPre) {
        self.jsdc.append('var ');
        self.jsdc.append(node.leaf(2).first().token().content());
        self.jsdc.append('=');
      }
      self.gen(node, start);
    }
    else {
      self.gen(node, start);
      self.jsdc.appendBefore('}();');
    }

  },
  expr: function(node, start) {
    var self = this;
    if(start) {
      self.jsdc.ignore(node.first());
      self.jsdc.ignore(node.leaf(1));
      if(node.leaf(2).name() == JsNode.BINDID) {
        self.jsdc.ignore(node.leaf(2));
      }
      self.gen(node, start);
    }
    else {
      self.gen(node, start);
      self.jsdc.appendBefore('}()');
    }
  },
  gen: function(node, start) {
    var self = this;
    if(start) {
      self.jsdc.ignore(node.first());
      var state = self.jsdc.uid();
      var temp = self.jsdc.uid();
      var param = node.leaf(4).first();
      var count = self.count(node.last().prev());
      self.pre(node.last().prev(), node.nid(), count);
      if(!param) {
        if(count) {
          param = self.jsdc.uid();
        }
        else {
          param = '';
        }
      }
      else if(param.name() == JsNode.SINGLENAME) {
        param = param.first().first().token().content();
      }
      else if(param.name() == JsNode.BINDREST) {
        param = param.last().first().token().content();
      }
      eventbus.on(node.leaf(4).nid(), function(node, start) {
        start && self.jsdc.append(param);
      });
      var o = self.hash[node.nid()] = {
        state: state,
        index: 0,
        count: count,
        if: 0,
        temp: temp,
        param: param,
        last: null,
        yield: []
      };
      self.jsdc.append('function(){');
      self.jsdc.append('var ' + state + '=0;');
      self.jsdc.append('return function(){return{next:' + temp + '}};');
      o.pos = self.jsdc.res.length;
      self.jsdc.append('function ' + temp);
    }
  },
  yield: function(node, start) {
    var self = this;
    var top = self.closest(node);
    var o = self.hash[top.nid()];
    if(start) {
      self.jsdc.ignore(node.first());
      var parent = node.parent();
      //赋值语句需要添加上参数，先默认undefined，并记录在变量中为下次添加做标记
      var parent = node.parent();
      switch(parent.name()) {
        case JsNode.INITLZ:
          o.last = join(parent.prev());
          break;
        case JsNode.ASSIGNEXPR:
          o.last = join(parent.first());
          break;
        default:
          o.last = null;
      }
      //加上状态变更
      var index = ++o.index;
      self.jsdc.append(o.state + '=' + index + ';');
      //yield *
      if(node.size() > 2
        && node.leaf(1).name() == JsNode.TOKEN
        && node.leaf(1).token().content() == '*') {
        self.jsdc.ignore(node.leaf(1));
        var temp = this.star[node.nid()] = self.jsdc.uid();
        self.jsdc.append('var ' + temp + '=');
      }
      else {
        self.jsdc.append('return{value:');
      }
    }
    else {
      //yield *
      if(self.star.hasOwnProperty(node.nid())) {
        var temp = self.star[node.nid()];
        self.jsdc.appendBefore('.next();return{done:(!' + temp + '.done&&' + o.state + '--),value:' + temp + '}');
        o.yield.push({
          i: self.jsdc.i,
          star: temp
        });
      }
      else {
        self.jsdc.appendBefore(',done:' + (o.index == o.count - 1) + '}');
        o.yield.push({
          i: self.jsdc.i
        });
      }
      self.ignoreNext(node, ';');
      if(o.index < o.count) {
        self.jsdc.appendBefore(';case ' + o.index + ':');
      }
      //有赋值需要先赋值
      if(o.last) {
        self.jsdc.appendBefore(o.last + '=' + o.param + ';');
      }
      o.last = null;
    }
  },
  body: function(node, start) {
    var top = node.parent();
    if(top.name() == JsNode.GENDECL) {
      var o = this.hash[top.nid()];
      if(start) {
        if(o.count) {
          this.jsdc.append('while(1){switch(' + o.state + '){case 0:');
        }
      }
      else {
        if(o.count) {
          this.jsdc.appendBefore(';default:return{done:true}}}');
        }
        else {
          this.jsdc.appendBefore('return{done:true}');
        }
      }
    }
  },
  closest: function(node) {
    var parent = node;
    while(parent = parent.parent()) {
      if(parent.name() == JsNode.GENDECL
        || parent.name() == JsNode.GENEXPR) {
        return parent;
      }
    }
  },
  prevar: function(varstmt) {
    var top = varstmt.gen;
    if(top) {
      this.jsdc.ignore(varstmt.first());
      this.jsdc.insert('var ' + varstmt.leaf(1).first().first().token().content() + ';', this.hash[top.nid()].pos);
    }
  },
  count: function(node, res) {
    res = res || { count: 0 };
    var self = this;
    var isToken = node.name() == JsNode.TOKEN;
    if(!isToken) {
      switch(node.name()) {
        case JsNode.YIELDEXPR:
          res.count++;
          //赋值语句忽略
          var parent = node.parent();
          switch(parent.name()) {
            case JsNode.INITLZ:
              self.jsdc.ignore(parent.prev());
              self.jsdc.ignore(node.prev());
              break;
            case JsNode.ASSIGNEXPR:
              self.jsdc.ignore(parent.first());
              self.jsdc.ignore(node.prev());
              break;
          }
          var belong = self.belong(node);
          if(belong) {
            self.stmt[belong.nid()] = true;
          }
          break;
        //忽略这些节点中的yield语句
        case JsNode.CLASSDECL:
        case JsNode.CLASSEXPR:
        case JsNode.FNDECL:
        case JsNode.FNEXPR:
        case JsNode.GENDECL:
        case JsNode.GENEXPR:
        case JsNode.METHOD:
          return;
      }
      node.leaves().forEach(function(leaf) {
        self.count(leaf, res);
      });
    }
    return res.count;
  },
  pre: function(node, nid, count) {
    var self = this;
    var isToken = node.name() == JsNode.TOKEN;
    if(!isToken) {
      switch(node.name()) {
        case JsNode.IFSTMT:
          if(self.stmt.hasOwnProperty(node.nid())) {
            count++;
            var last = node.last();
            //改写if语句
            self.jsdc.ignore(node.first());
            self.jsdc.ignore(node.leaf(1));
            self.jsdc.ignore(node.leaf(2));
            self.jsdc.ignore(node.leaf(3));
            if(last.name() == JsNode.BLOCKSTMT) {
              self.jsdc.ignore(node.leaf(4));
              self.jsdc.ignore(last);
            }
            eventbus.on(node.nid(), function(node, start) {
              var top = self.hash[nid];
              if(start) {
                self.jsdc.append('if(');
                self.jsdc.append(join(node.leaf(2)));
                self.jsdc.append('){');
                self.jsdc.append(top.state + '=' + res.index);
                self.jsdc.append(';break}');
              }
            });
          }
          break;
        //忽略这些节点中的所有逻辑
        case JsNode.CLASSDECL:
        case JsNode.CLASSEXPR:
        case JsNode.FNDECL:
        case JsNode.FNEXPR:
        case JsNode.GENDECL:
        case JsNode.GENEXPR:
        case JsNode.METHOD:
          return;
      }
      node.leaves().forEach(function(leaf) {
        self.pre(leaf, nid, count);
      });
    }
  },
  getLast: function(node) {
    while(node = node.last()) {
      if(node.name() == JsNode.TOKEN) {
        return node;
      }
    }
  },
  ignoreNext: function(node, value) {
    node = this.getLast(node);
    if(node) {
      var token = node.token();
      while(token = token.next()) {
        if(token.type() == Token.COMMENT
          || token.type() == Token.BLANK
          || token.type() == Token.LINE) {
          continue;
        }
        if(token.content() == value) {
          this.jsdc.ignore(token);
          return;
        }
        else {
          return;
        }
      }
    }
  },
  belong: function(node) {
    while(node = node.parent()) {
      switch(node.name()) {
        case JsNode.IFSTMT:
        case JsNode.ITERSTMT:
          return node;
        case JsNode.GENDECL:
        case JsNode.GENEXPR:
          return;
      }
    }
  }
});

module.exports = Generator;