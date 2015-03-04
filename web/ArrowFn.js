define(function(require, exports, module){var homunculus = require('homunculus');
var JsNode = homunculus.getClass('Node', 'es6');

var Class = require('./util/Class');
var eventbus = require('./eventbus');

var ArrowFn = Class(function(jsdc) {
  this.jsdc = jsdc;
  this.hash = {};
  this.scope = [];
}).methods({
  parse: function(node) {
    this.jsdc.append('function');
  },
  lexical: function(node) {
    var self = this;
    var nid = node.nid();
    //遍历查看是否有调用this和arguments，存储引用实现lexical绑定
    this.find(node, nid);
    if(this.hash.hasOwnProperty(nid)) {
      var o = this.hash[nid];
      eventbus.on(nid, function(node, start) {
        if(start) {
          if(o.hasOwnProperty('_this')) {
            self.jsdc.append('var ' + o._this + '=this;');
          }
          if(o.hasOwnProperty('_arguments')) {
            self.jsdc.append('var ' + o._arguments + '=arguments;');
          }
        }
      });
    }
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
  find: function(node, pid) {
    var self = this;
    if(!node.isToken()) {
      if(node.name() == JsNode.ARROWFN) {
        self.recursion(node, node.nid(), pid);
      }
      else {
        node.leaves().forEach(function(leaf) {
          self.find(leaf, pid);
        });
      }
    }
  },
  recursion: function(node, nid, pid) {
    var self = this;
    if(node.isToken()) {
      var token = node.token();
      if(!token.isVirtual()) {
        var s = token.content();
        if(s == 'this' || s == 'arguments') {
          this.hash[pid] = this.hash[pid] || {};
          this.hash[pid]['_' + s] = this.hash[pid]['_' + s] || this.jsdc.uid();
          self.jsdc.ignore(node, 'arrow1');
          eventbus.on(node.nid(), function(node, start) {
            if(start) {
              self.jsdc.append(self.hash[pid]['_' + s]);
            }
          });
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
            self.recursion(leaf, nid, pid);
        }
      });
    }
  }
});

module.exports = ArrowFn;
});