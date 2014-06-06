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
  SCOPE[JsNode.BLOCK] = SCOPE[JsNode.FNBODY] = SCOPE[JsNode.METHOD] = true;
  
  var Scope = Class(function(jsdc) {
    this.jsdc = jsdc;
    this.hash = {};
    this.index = [jsdc.res.length];
  }).methods({
    parse: function(node) {
      this.recursion(node);
    },
    recursion: function(node, last) {
      var self = this;
      var isToken = node.name() == JsNode.TOKEN;
      if(!isToken) {
        //每个{}作用域开始/结束时存入tid()分隔，全局作用域无记录，但可从<第一个和>最后一个判断
        if(SCOPE.hasOwnProperty(node.name())) {
          last = node;
        }
        else if(node.name() == JsNode.LEXDECL && last) {
          self.hash[last.nid()] = true;
        }
        node.leaves().forEach(function(leaf) {
          self.recursion(leaf, last);
        });
      }
    },
    prepose: function(varstmt) {
      var parent = this.closest(varstmt);
      if(parent && this.hash[parent.nid()]) {
        //插入声明的变量到作用域开始，并删除这个var
        var i = this.index[this.index.length - 1];
        this.jsdc.insert('var ' + this.join(varstmt.leaf(1)) + ';', i);
        varstmt.first().token().content('');
        return true;
      }
      return false;
    },
    join: function(node) {
      var first = node.first();
      if(first.name() == JsNode.BINDID) {
        return first.first().token().content();
      }
      return '';
    },
    enter: function(node) {
      this.index.push(this.jsdc.res.length);
    },
    leave: function(node) {
      this.index.pop();
    },
    block: function(node, start) {
      if(node.name() == JsNode.BLOCK && node.parent().name() == JsNode.BLOCKSTMT) {
        this.jsdc.append(start ? '!function() ' : '()');
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