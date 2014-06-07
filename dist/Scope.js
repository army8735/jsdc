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
  
  var Class = require('./util/Class');
  var SCOPE = {};
  SCOPE[JsNode.BLOCK] =
    SCOPE[JsNode.FNBODY] = true;
  var NOT_ABS_BLOCK = {};
    NOT_ABS_BLOCK[JsNode.ITERSTMT] =
      NOT_ABS_BLOCK[JsNode.IFSTMT] = true;
  
  var Scope = Class(function(jsdc) {
    this.jsdc = jsdc;
    this.hash = {};
    this.history = {};
    this.index = [jsdc.res.length];
  }).methods({
    parse: function(node) {
      this.recursion(node);
    },
    recursion: function(node) {
      var self = this;
      var isToken = node.name() == JsNode.TOKEN;
      if(!isToken) {
        //每个{}作用域记录是否有lexdecl
        if(node.name() == JsNode.LEXDECL) {
          var parent = self.closest(node);
          //全局lexdecl没有作用域无需记录，fnbody的也无需记录
          if(parent && parent.name() != JsNode.FNBODY) {
            self.hash[parent.nid()] = true;
          }
        }
        node.leaves().forEach(function(leaf) {
          self.recursion(leaf);
        });
      }
    },
    prepose: function(varstmt) {
      var self = this;
      var parent = self.closest(varstmt);
      if(parent && self.hash[parent.nid()]) {
        //插入声明的变量到作用域开始，并删除这个var
        var i = self.index[self.index.length - 1];
        self.history[i] = self.history[i] || {};
        var his = self.history[i];
        self.join(varstmt.leaf(1)).forEach(function(id) {
          if(!his.hasOwnProperty(id)) {
            his[id] = true;
            self.jsdc.insert('var ' + id + ';', i);
          }
        });
        self.jsdc.ignore(varstmt.first().token());
      };
    },
    join: function(node) {
      var first = node.first();
      var res = [];
      if(first.name() == JsNode.BINDID) {
        res.push(first.first().token().content());
      }
      return res;
    },
    enter: function(node) {
      this.index.push(this.jsdc.res.length);
    },
    leave: function(node) {
      this.index.pop();
    },
    block: function(node, start) {
      if(node.name() == JsNode.BLOCK) {
        node = node.parent();
        var pname = node.name();
        if(pname == JsNode.BLOCKSTMT) {
          pname = node.parent().name();
          //纯block父节点为blockstmt且祖父节点不是iteratorstmt,ifstmt
          //try,catch,final已在父节点不是blockstmt排除
          if(!NOT_ABS_BLOCK.hasOwnProperty(pname)
            || this.hash.hasOwnProperty(node.nid())) {
            if(start) {
              this.jsdc.append('!function()');
            }
            else {
              this.jsdc.appendBefore('()');
            }
          }
        }
      }
      //{和}需要添加匿名函数，排除纯block，即父节点不为blockstmt或祖父节点不为iteratorstmt,ifstmt
      else if(node.name() == JsNode.TOKEN) {
        node = node.parent();
        if(node.name() == JsNode.BLOCK
          && this.hash.hasOwnProperty(node.nid())) {
          node = node.parent();
          if(node.name() != JsNode.BLOCKSTMT
            || NOT_ABS_BLOCK.hasOwnProperty(node.parent().name())) {
            this.jsdc.append(start ? '!function(){' : '}()');
          }
        }
      }
    },
    closest: function(node) {
      var parent = node;
      while(parent = parent.parent()) {
        if(SCOPE.hasOwnProperty(parent.name())) {
          return parent;
        }
      }
    }
  });
  
  module.exports = Scope;
  
});