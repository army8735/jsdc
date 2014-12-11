define(function(require, exports, module){var homunculus = require('homunculus');
var JsNode = homunculus.getClass('Node', 'es6');

var Class = require('./util/Class');

var ArrowFn = Class(function(jsdc) {
  this.jsdc = jsdc;
}).methods({
  parse: function(node) {
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
  }
});

module.exports = ArrowFn;
});