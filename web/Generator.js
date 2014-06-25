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
    this.stmt = {};
  }).methods({
    parse: function(node, start) {
      var self = this;
      if(start) {
        self.jsdc.ignore(node.leaf(1), 'gen1');
        var token = node.leaf(2).first().token();
        //有可能被scope前置过
        var hasPre = token.ignore;
        self.jsdc.ignore(token, 'gen2');
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
        self.jsdc.ignore(node.first(), 'gen3');
        self.jsdc.ignore(node.leaf(1), 'gen4');
        if(node.leaf(2).name() == JsNode.BINDID) {
          self.jsdc.ignore(node.leaf(2), 'gen5');
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
        self.jsdc.ignore(node.first(), 'gen6');
        var state = self.jsdc.uid();
        var temp = self.jsdc.uid();
        var param = node.leaf(4).first();
        var res = self.count(node.last().prev(), node);
        var count = res.count;
        var ret = res.return;
        if(res.pre) {
          self.pre(node.last().prev(), node.nid(), node.last().prev().nid());
        }
        if(!param) {
          if(count) {
            param = self.jsdc.uid();
            eventbus.on(node.leaf(4).nid(), function(node, start) {
              start && self.jsdc.append(param);
            });
          }
          else {
            param = '';
          }
        }
        else if(param.name() == JsNode.SINGLENAME) {
          param = param.first().first().token().content();
        }
        else if(param.name() == JsNode.BINDREST) {
          param = param.last().first().token().content() + '[0]';
        }
        var o = self.hash[node.nid()] = {
          state: state,
          index: 0,
          index2: 0,
          count: count,
          return: ret,
          if: 0,
          temp: temp,
          param: param,
          last: null,
          yield: [],
          pre: res.pre
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
        self.jsdc.ignore(node.first(), 'gen7');
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
        o.index++;
        self.jsdc.append(o.state + '=' + ++o.index2 + ';');
        //yield *
        if(node.size() > 2
          && node.leaf(1).name() == JsNode.TOKEN
          && node.leaf(1).token().content() == '*') {
          self.jsdc.ignore(node.leaf(1), 'gen8');
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
          self.jsdc.appendBefore(',done:' + (o.index == o.count) + '}');
          o.yield.push({
            i: self.jsdc.i
          });
        }
        self.ignoreNext(node, ';');
        if(o.index < o.count) {
          self.jsdc.appendBefore(';case ' + o.index2 + ':');
        }
        else {
          self.jsdc.appendBefore(';case ' + o.index2 + ':');
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
        else if(!o.return) {
          if(o.count) {
            this.jsdc.appendBefore(';' + o.state + '=-1');
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
        this.jsdc.ignore(varstmt.first(), 'gen9');
        this.jsdc.insert('var ' + varstmt.leaf(1).first().first().token().content() + ';', this.hash[top.nid()].pos);
      }
    },
    count: function(node, top, res) {
      res = res || { count: 0, return: false, pre: false };
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
                self.jsdc.ignore(parent.prev(), 'gen10');
                self.jsdc.ignore(node.prev(), 'gen11');
                break;
              case JsNode.ASSIGNEXPR:
                self.jsdc.ignore(parent.first(), 'gen12');
                self.jsdc.ignore(node.prev(), 'gen13');
                break;
            }
            var belong = self.belong(node);
            belong.forEach(function(f) {
              self.stmt[f.nid()] = true;
              res.pre = true;
            });
            break;
          case JsNode.RETSTMT:
            res.return = node;
            eventbus.on(node.nid(), function(node, start) {
              if(start) {
                var o = self.hash[top.nid()];
                self.jsdc.appendBefore(';' + o.state + '=-1;default:');
              }
            });
            eventbus.on(node.leaf(1).nid(), function(node, start) {
              if(start) {
                self.jsdc.append('{value:');
              }
              else {
                self.jsdc.appendBefore(',done:true}');
              }
            });
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
          self.count(leaf, top, res);
        });
      }
      return res;
    },
    pre: function(node, nid, bid, res) {
      res = res || { index: 0 };
      var self = this;
      var isToken = node.name() == JsNode.TOKEN;
      if(!isToken) {
        switch(node.name()) {
          case JsNode.IFSTMT:
            if(self.stmt.hasOwnProperty(node.nid())) {
              res.index++;
              var block = node.leaf(4);
              //改写if语句
              self.jsdc.ignore(node.first(), 'gen14');
              self.jsdc.ignore(node.leaf(1), 'gen15');
              self.jsdc.ignore(node.leaf(2), 'gen16');
              self.jsdc.ignore(node.leaf(3), 'gen17');
              if(block.name() == JsNode.BLOCKSTMT) {
                self.jsdc.ignore(block.first().first(), 'gen18');
                self.jsdc.ignore(block.first().last(), 'gen19');
              }
              var temp;
              var ifEndTemp;
              var top;
              var ifstmt = node;
              //if结束后的状态
              eventbus.on(node.nid(), function(node, start) {
                if(!start) {
                  self.jsdc.append('case ' + ifEndTemp + ':');
                }
              });
              //根据表达式true/false分2个state
              eventbus.on(block.nid(), function(node, start) {
                if(start) {
                  top = self.hash[nid];
                  index = top.index2;
                  self.jsdc.append(top.state + '=');
                  self.jsdc.append(join(ifstmt.leaf(2)));
                  self.jsdc.append('?');
                  self.jsdc.append(++top.index2 + ':' + ++top.index2 + ';break;');
                  self.jsdc.append('case ' + (top.index2 - 1) + ':');
                  temp = top.index2;
                  ifEndTemp = ++top.index2;
                }
                else {
                  self.jsdc.appendBefore(top.state + '=');
                  self.jsdc.appendBefore(ifEndTemp);
                  self.jsdc.appendBefore(';break;');
                }
              });
              //else语句忽略{}
              var elset = block.next();
              if(elset && elset.name() == JsNode.TOKEN) {
                self.jsdc.ignore(elset, 'gen20');
                block = elset.next();
                if(block.name() == JsNode.BLOCKSTMT) {
                  self.jsdc.ignore(block.first().first(), 'gen21');
                  self.jsdc.ignore(block.first().last(), 'gen22');
                }
                eventbus.on(block.nid(), function(node, start) {
                  if(start) {
                    self.jsdc.append('case ' + temp + ':');
                  }
                  else {
                    self.jsdc.appendBefore(top.state + '=');
                    self.jsdc.appendBefore(ifEndTemp);
                    self.jsdc.appendBefore('break;');
                  }
                });
              }
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
          self.pre(leaf, nid, bid, res);
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
            this.jsdc.ignore(token, 'gen23');
            return;
          }
          else {
            return;
          }
        }
      }
    },
    belong: function(node) {
      var res = [];
      while(node = node.parent()) {
        switch(node.name()) {
          case JsNode.IFSTMT:
          case JsNode.ITERSTMT:
            res.push(node);
          case JsNode.GENDECL:
          case JsNode.GENEXPR:
            break;
        }
      }
      return res;
    }
  });
  
  module.exports = Generator;
});