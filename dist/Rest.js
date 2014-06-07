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
  
  var Scope = Class(function(jsdc) {
    this.jsdc = jsdc;
  }).methods({
    parse: function(node) {
      var fmparams = node.prev().prev().prev();
      if(fmparams.name() == JsNode.FMPARAMS && fmparams.size()) {
        var last = fmparams.last();
        if(last.name() == JsNode.SINGLENAME && last.size() == 2) {
          var init = last.last();
          if(init.name() == JsNode.INITIAL) {
            var id = last.first().first().token().content();
          }
        }
      }
    }
  });
  
  module.exports = Scope;
  
});