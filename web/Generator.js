define(function(require, exports, module) {
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
    this.block = {};
  }).methods({
    parse: function(node, start) {
      if(start) {
        this.jsdc.ignore(node.leaf(1));
        var token = node.leaf(2).first().token();
        //有可能被scope前置过
        var hasPre = token.ignore;
        //忽略本身
        this.jsdc.ignore(node.first());
        this.jsdc.ignore(token);
        if(!hasPre) {
          this.jsdc.append('var ');
          this.jsdc.append(node.leaf(2).first().token().content());
          this.jsdc.append('=');
        }
        var state = this.jsdc.uid();
        var temp = this.jsdc.uid();
        var param = node.leaf(4).first();
        var count = this.count(node.last().prev());
        if(!param) {
          if(count) {
            param = this.jsdc.uid();
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
        var o = this.hash[node.nid()] = {
          state: state,
          index: 0,
          count: count,
          temp: temp,
          param: param,
          last: null,
          yield: []
        };
        this.jsdc.append('function(' + param + '){');
        this.jsdc.append('var ' + state + '=0;');
        this.jsdc.append('return ');
        this.jsdc.append('function(){return{next:' + temp + '}};');
        o.pos = this.jsdc.res.length;
        this.jsdc.append('function ' + temp);
      }
      else {
        this.jsdc.appendBefore('}();');
      }
    },
    expr: function(node, start) {
      if(start) {
        this.jsdc.ignore(node.first());
        this.jsdc.ignore(node.leaf(1));
        if(node.leaf(2).name() == JsNode.BINDID) {
          this.jsdc.ignore(node.leaf(2));
        }
        var state = this.jsdc.uid();
        var temp = this.jsdc.uid();
        var count = this.count(node.last().prev());
        var param = node.leaf(4).first();
        if(!param) {
          if(count) {
            param = this.jsdc.uid();
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
        var o = this.hash[node.nid()] = {
          state: state,
          index: 0,
          count: count,
          temp: temp,
          param: param,
          last: null,
          yield: []
        };
        this.jsdc.append('function(' + param + '){');
        this.jsdc.append('var ' + state + '=0;');
        this.jsdc.append('return function(){return{next:' + temp + '}};');
        o.pos = this.jsdc.res.length;
        this.jsdc.append('function ' + temp);
      }
      else {
        this.jsdc.appendBefore('}()');
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
        if([JsNode.INITLZ, JsNode.ASSIGNEXPR].indexOf(parent.name()) > -1) {
          self.jsdc.append('void 0;');
          if(parent.name() == JsNode.INITLZ) {
            o.last = join(parent.prev());
          }
          else {
            o.last = join(parent.first());
          }
        }
        else {
          o.last = null;
          //省略{}的ifstmt/iteratorstmt等要加上
          var parent = node.parent();
          if(parent.name() == JsNode.EXPRSTMT) {
            var grand = parent.parent();
            if(grand.name() == JsNode.IFSTMT && !parent.next()) {
              self.jsdc.append('{');
              eventbus.on(grand.nid(), function(node, start) {
                if(!start) {
                  self.jsdc.appendBefore('}');
                }
              });
            }
          }
        }
        //加上状态变更
        self.jsdc.append(o.state + '++;');
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
        if(self.star.hasOwnProperty(node.nid())) {
          var temp = self.star[node.nid()];
          self.jsdc.appendBefore('();if(!' + temp + '.done)' + o.state + '--;return ' + temp + ';');
          o.yield.push({
            i: self.jsdc.i,
            star: temp
          });
        }
        else {
          self.jsdc.appendBefore(',done:' + (o.index == o.count - 1) + '};');
          o.yield.push({
            i: self.jsdc.i
          });
        }
        if(o.index++ < o.count - 1) {
          self.jsdc.appendBefore('case ' + o.index + ':');
        }
        else {
          self.jsdc.appendBefore('default:');
        }
        self.ignoreNext(node, ';');
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
          this.jsdc.append('switch(' + o.state + '){case 0:');
        }
        else {
          var last = this.getLast(node);
          if(last) {
            if([';', '}'].indexOf(last.token().content()) == -1) {
              this.jsdc.appendBefore(';');
            }
          }
          this.jsdc.appendBefore('return{done:true}}');
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
        if(node.name() == JsNode.YIELDEXPR) {
          res.count++;
        }
        node.leaves().forEach(function(leaf) {
          self.count(leaf, res);
        });
      }
      return res.count;
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
    }
  });
  
  module.exports = Generator;
  
});