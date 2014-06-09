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
  
  var Destruct = Class(function(jsdc) {
    this.jsdc = jsdc;
    this.hash = {};
  }).methods({
    parse: function(node, start) {
      //
    }
  });
  
  module.exports = Destruct;
  
});