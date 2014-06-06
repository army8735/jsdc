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

  var character = require('./src/util/character');
  var Class = require('./src/util/Class');

  function recursion(node, ignore) {
    var isToken = node.name() == JsNode.TOKEN;
    var isVirtual = isToken && node.token().type() == Token.VIRTUAL;
    if(isToken) {
      if(!isVirtual) {
        //
      }
    }
    else {
      node.leaves().forEach(function(leaf) {
        recursion(leaf, ignore);
      });
    }
  }

  var JSDC = Class(function(code) {
    this.code = (code + '') || '';
    this.res = '';
    return this;
  }).methods({
    parse: function(code) {
      if(!character.isUndefined(code)) {
        this.code = code + '';
      }
      var parser = homunculus.getParser('es6');
      var node = parser.parse(code);
      var ignore = parser.ignore();
      recursion(node, ignore);
      return this;
    },
    append: function() {
      var self = this;
      var args = Array.prototype.slice.call(arguments, 0);
      args.forEach(function(s) {
        self.res += s;
      });
      return this;
    }
  }).statics({
    parse: function(code) {
      var jsdc = new JSDC();
      return jsdc.parse(code);
    }
  });
  module.exports = JSDC;
});