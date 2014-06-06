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

  var character = require('./dist/util/character');
  var Class = require('./dist/util/Class');

  function recursion(node, ignore, jsdc) {
    var isToken = node.name() == JsNode.TOKEN;
    var isVirtual = isToken && node.token().type() == Token.VIRTUAL;
    if(isToken) {
      if(!isVirtual) {
        var token = node.token();
        jsdc.append(token.content());
        //加上ignore
        var s;
        while(s = jsdc.next()) {
          jsdc.append(s);
        }
      }
    }
    else {
      node.leaves().forEach(function(leaf) {
        recursion(leaf, ignore, jsdc);
      });
    }
  }

  var JSDC = Class(function(code) {
    this.code = (code + '') || '';
    this.index = 0;
    this.res = '';
    this.node = {};
    this.ignore = {};
    return this;
  }).methods({
    parse: function(code) {
      if(!character.isUndefined(code)) {
        this.code = code + '';
      }
      var parser = homunculus.getParser('es6');
      var node = this.node = parser.parse(code);
      var ignore = this.ignore = parser.ignore();

      while(ignore[this.index]) {
        this.append(ignore[this.index++].content());
      }
      recursion(node, ignore, this);
      return this.res;
    },
    append: function() {
      var self = this;
      var args = Array.prototype.slice.call(arguments, 0);
      args.forEach(function(s) {
        self.res += s;
      });
      return this;
    },
    next: function() {
      var i = ++this.index;
      return this.ignore.hasOwnProperty(i) ? this.ignore[i].content() : null;
    }
  }).statics({
    parse: function(code) {
      var jsdc = new JSDC();
      return jsdc.parse(code);
    }
  });
  module.exports = JSDC;
});