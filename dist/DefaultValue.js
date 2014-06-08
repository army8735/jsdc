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
  
  var DefaultValue = Class(function(jsdc) {
    this.jsdc = jsdc;
    this.hash = {};
  }).methods({
    param: function(fmparams) {
      var self = this;
      if(fmparams.name() == JsNode.FMPARAMS && fmparams.size()) {
        var fnbody = fmparams.next().next().next().nid();
        fmparams.leaves().forEach(function(sgname) {
          if(sgname.name() == JsNode.SINGLENAME && sgname.size() == 2) {
            var init = sgname.last();
            if(init.name() == JsNode.INITLZ) {
              self.jsdc.ignore(init);
              (self.hash[fnbody] = self.hash[fnbody] || []).push(sgname);
            }
          }
        });
      }
    },
    enter: function(fnbody) {
      var self = this;
      if(self.hash.hasOwnProperty(fnbody.nid())) {
        var sgnames = self.hash[fnbody.nid()];
        sgnames.forEach(function(sgname) {
          var id = sgname.first().first().token().content();
          self.jsdc.append('if(typeof ' + id + '=="undefined")' + id);
          self.recursion(sgname.last());
          self.jsdc.append(';');
        });
      }
    },
    recursion: function(node) {
      var self = this;
      var isToken = node.name() == JsNode.TOKEN;
      var isVirtual = isToken && node.token().type() == Token.VIRTUAL;
      if(isToken) {
        if(!isVirtual) {
          self.jsdc.append(' ' + node.token().content());
        }
      }
      else {
        node.leaves().forEach(function(leaf) {
          self.recursion(leaf);
        });
      }
    }
  });
  
  module.exports = DefaultValue;
  
});