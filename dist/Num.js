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
  
  var Number = Class(function(jsdc) {
    this.jsdc = jsdc;
  }).methods({
    parse: function(t) {
      var s = t.content();
      if(s.toLowerCase().indexOf('0b') == 0) {
        this.jsdc.ignore(t);
        this.jsdc.append('parseInt("' + t.content().slice(2) + '", 2)');
      }
      else if(s.toLowerCase().indexOf('0o') == 0) {
        this.jsdc.ignore(t);
        this.jsdc.append('parseInt("' + t.content().slice(2) + '", 8)');
      }
    }
  });
  
  module.exports = Number;
  
});