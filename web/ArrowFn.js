define(function(require, exports, module){var homunculus = require('homunculus');
var JsNode = homunculus.getClass('Node', 'es6');

var Class = require('./util/Class');

var ArrowFn = Class(function(jsdc) {
  this.jsdc = jsdc;
  this.hash = {};
}).methods({
  parse: function(node) {
    //var nid = node.nid();
    ////遍历查看是否有调用this和arguments，存储引用实现lexical绑定
    //this.recursion(node.last(), nid);
    //if(this.hash.hasOwnProperty(nid)) {
    //  var o = this.hash[nid];
    //  if(o.this) {
    //    this.jsdc.append('var ' + o.this + '=this;');
    //  }
    //  if(o.arguments) {
    //    this.jsdc.append('var ' + o.arguments + '=arguments;');
    //  }
    //}
    this.jsdc.append('function');
  },
  params: function(node, start) {
    //默认一个参数需要加()
    if(node.first().name() == JsNode.TOKEN) {
      if(start) {
        this.jsdc.append('(');
      }
      else {
        this.jsdc.appendBefore(')');
      }
    }
  },
  arrow: function(t) {
    this.jsdc.ignore(t, 'arrow1');
  },
  body: function(node, start) {
    //表达式只有1个需要加{return }
    if(node.size() == 1) {
      //可能被rest补齐参数加过了
      if(start) {
        if(!node.rest) {
          this.jsdc.append('{return ');
        }
      }
      else {
        this.jsdc.appendBefore('}');
      }
    }
  },
  recursion: function(node, nid) {
    var self = this;
    if(node.isToken()) {
      var token = node.token();
      if(!token.isVirtual()) {
        var s = token.content();
        if(s == 'this' || s == 'arguments') {
          this.hash[nid] = this.hash[nid] || {};
          this.hash[nid][s] = this.jsdc.uid();
        }
      }
    }
    else {
      node.leaves().forEach(function(leaf) {
        switch(leaf.name()) {
          case JsNode.CLASSDECL:
          case JsNode.CLASSEXPR:
          case JsNode.FNDECL:
          case JsNode.FNEXPR:
          case JsNode.ARROWFN:
          case JsNode.GENDECL:
          case JsNode.GENEXPR:
          case JsNode.OBJLTR:
          case JsNode.WITHSTMT:
            return;
          default:
            self.recursion(leaf, nid);
        }
      });
    }
  }
});

module.exports = ArrowFn;
});