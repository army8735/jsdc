var homunculus = require('homunculus');
var JsNode = homunculus.getClass('Node', 'es6');
var Token = homunculus.getClass('Token');

var Class = require('./util/Class');
var join = require('./join');
var eventbus = require('./eventbus');

var Rest = Class(function(jsdc) {
  this.jsdc = jsdc;
  this.hash = {};
  this.hash2 = {};
  this.hash3 = {};
}).methods({
  param: function(fmparams) {
    if(fmparams.name() == JsNode.FMPARAMS && fmparams.size()) {
      var last = fmparams.last();
      var fnbody = fmparams.next().next().next();
      if(last.name() == JsNode.BINDREST) {
        var rest = last.first();
        this.jsdc.ignore(rest, 'rest1');
        this.hash[fnbody.nid()] = {
          index: fmparams.size() - 1,
          token: last.last().first().token()
        };
      }
    }
  },
  enter: function(fnbody) {
    if(this.hash.hasOwnProperty(fnbody.nid())) {
      var o = this.hash[fnbody.nid()];
      var index = o.index;
      var id = o.token.content();
      this.jsdc.append(id + '=[].slice.call(arguments, ' + index + ');');
    }
  },
  expr: function(node) {
    var args = node.last();
    var arglist = args.leaf(1);
    var self = this;
    if(arglist.size() > 1) {
      var last = arglist.last();
      var spread = last.prev();
      if(spread.name() == JsNode.TOKEN && spread.token().content() == '...') {
        var first = node.first();
        var needTemp = self.needTemp(first).ret;console.log(needTemp)
        var temp = needTemp ? self.jsdc.uid() : '';
        self.hash2[node.nid()] = {
          node: first,
          needTemp: needTemp,
          temp: temp
        };
        //主表达式中含有生成的对象，不是直接引用，需创建一个临时变量保存引用
        if(needTemp) {
          self.jsdc.append('function(){var ' + temp + '=');
          var first = node.first();
          eventbus.on(first.nid(), function(node2, start) {
            if(!start) {
              self.jsdc.append(';' + temp);
            }
          });

        }
        self.jsdc.ignore(arglist, 'rest2');
      }
    }
  },
  needTemp: function(node, res) {
    res = res || { ret: false };
    var self = this;
    if(res.ret) {
      return res;
    }
    var isToken = node.name() == JsNode.TOKEN;
    if(!isToken) {
      node.leaves().forEach(function(leaf) {
        if([JsNode.CALLEXPR, JsNode.NEWEXPR].indexOf(leaf.name()) > -1) {
          res.ret = true;
        }
        //忽略一些节点
        else if([JsNode.FNEXPR, JsNode.CLASSEXPR, JsNode.METHOD].indexOf(leaf.name()) == -1) {
          self.needTemp(leaf, res);
        }
      });
    }
    return res;
  },
  args: function(node) {
    var parent = node.parent();
    if(parent.name() == JsNode.CALLEXPR && this.hash2.hasOwnProperty(parent.nid())) {
      this.jsdc.append('.apply');
    }
  },
  arglist: function(node) {
    var parent = node.parent().parent();
    if(parent.name() == JsNode.CALLEXPR && this.hash2.hasOwnProperty(parent.nid())) {
      var o = this.hash2[parent.nid()];
      if(o.needTemp) {
        //主表达式中含有生成的对象，不是直接引用，使用临时变量引用
        this.jsdc.append(o.temp);
      }
      else {
        //主表达式无需设置apply的context，成员需设
        var mmb = this.hash2[parent.nid()].node;
        this.jsdc.append(mmb.name() == JsNode.MMBEXPR ? join(mmb.first()) : 'this');
      }
      this.jsdc.append(', [');
      var leaves = node.leaves();
      for(var i = 0; i < leaves.length - 3; i++) {
        this.jsdc.append(join(leaves[i]));
      }
      this.jsdc.append(']');
      this.jsdc.append('.concat(');
      this.jsdc.append(node.last().first().token().content());
      this.jsdc.append(')');
      if(o.needTemp) {
        //主表达式中含有生成的对象，不是直接引用，使用临时变量引用
        this.jsdc.append(';return ' + o.temp + '}');
      }
    }
  },
  arrltr: function(node, start) {
    if(node.destruct) {
      return;
    }
    if(start) {
      var last = node.last();
      var spread = last.prev();
      if(spread && spread.name() == JsNode.SPREAD) {
        var token = spread.last().last().token();
        this.hash3[node.nid()] = {
          isStr: token.type() == Token.STRING,
          value: token.content()
        };
        this.jsdc.ignore(spread, 'rest3', true);
        var prev = spread.prev();
        if(prev && prev.name() == JsNode.TOKEN && prev.token().content() == ',') {
          this.jsdc.ignore(prev, 'rest4', true);
        }
      }
    }
    else if(this.hash3.hasOwnProperty(node.nid())) {
      var o = this.hash3[node.nid()];
      this.jsdc.appendBefore('.concat(');
      if(o.isStr) {
        this.jsdc.appendBefore(o.value);
        this.jsdc.appendBefore('.split("")');
      }
      else {
        this.jsdc.appendBefore('function(){var ');
        var temp = this.jsdc.uid();
        var temp2 = this.jsdc.uid();
        this.jsdc.appendBefore(temp);
        this.jsdc.appendBefore('=[],' + temp2);
        this.jsdc.appendBefore(';while(!' + temp2 + '=' + o.value + '.next().done)');
        this.jsdc.appendBefore(temp + '.push(' + temp2 + '.value)}()');
      }
      this.jsdc.appendBefore(')');
    }
  }
});

module.exports = Rest;
