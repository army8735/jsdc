(function(factory) {
  if(typeof define === 'function' && (define.amd || define.cmd)) {
    define(factory);
  }
  else {
    factory(require, exports, module);
  }
})(function(require, exports, module) {
  var homunculus = require('homunculus');
  var JsNode = homunculus.getClass('Node', 'es6');
  var Token = homunculus.getClass('Token');
  
  var Class = require('./util/Class');
  
  var ArrCmph = Class(function(jsdc) {
    this.jsdc = jsdc;
    this.hash = {};
  }).methods({
    parse: function(node, start) {
      var self = this;
      //忽略[]
      if(start) {
        self.hash[node.nid()] = {
          id: '',
          f: 0
        };
        self.jsdc.ignore(node.first());
        self.jsdc.ignore(node.last());
        self.jsdc.append('function(){');
        //forbinding的变量要提出来声明
        var leaves = node.leaf(1).leaves();
        for(var i = 0; i < leaves.length - 1; i++) {
          var leaf = leaves[i];
          if(leaf.name() == JsNode.CMPHFOR) {
            var id = leaf.leaf(2).first().token().content();
            self.jsdc.append('var ' + id + ';');
            self.hash[node.nid()].f++;
          }
        }
        var id = this.jsdc.uid();
        self.hash[node.nid()].id = id;
        self.jsdc.append('var ' + id + '=[];');
      }
      else {
        self.jsdc.appendBefore(')');
        //有多少个cmphfor则包裹多少个{}
        while(self.hash[node.nid()].f--) {
          self.jsdc.appendBefore('}');
        }
        self.jsdc.appendBefore('return ' + self.hash[node.nid()].id + '}();');
      }
    },
    for: function(node, start) {
      var top = node.parent().parent();
      if(top.name() == JsNode.ARRCMPH) {
        if(!start) {
          var id = node.leaf(2).first().token().content();
          this.jsdc.appendBefore('{');
          this.jsdc.appendBefore(id);
          this.jsdc.appendBefore('=');
          this.jsdc.appendBefore(this.join(node.leaf(4)));
          this.jsdc.appendBefore('[');
          this.jsdc.appendBefore(id);
          this.jsdc.appendBefore('];');
          var s = node.next().name();
          if(s != JsNode.CMPHIF
            && s != JsNode.CMPHFOR) {
            this.jsdc.appendBefore(this.hash[top.nid()].id + '.push(');
          }
        }
      }
    },
    if: function(node, start) {
      var top = node.parent().parent();
      if(top.name() == JsNode.ARRCMPH) {
        if(!start) {
          this.jsdc.appendBefore(this.hash[top.nid()].id + '.push(');
        }
      }
    },
    of: function(node) {
      if(node.parent().name() == JsNode.CMPHFOR) {
        this.jsdc.ignore(node);
        this.jsdc.append('in ');
      }
    },
    join: function(node) {
      var res = { s: '' };
      this.recursion(node, res);
      return res.s;
    },
    recursion: function(node, res) {
      var self = this;
      var isToken = node.name() == JsNode.TOKEN;
      var isVirtual = isToken && node.token().type() == Token.VIRTUAL;
      if(isToken) {
        if(!isVirtual) {
          res.s += node.token().content();
        }
      }
      else {
        node.leaves().forEach(function(leaf) {
          self.recursion(leaf, res);
        });
      }
    }
  });
  
  module.exports = ArrCmph;
  
});