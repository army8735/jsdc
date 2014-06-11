define(function(require, exports, module) {
  var homunculus = require('homunculus');
  var JsNode = homunculus.getClass('Node', 'es6');
  
  var Class = require('./util/Class');
  
  var Obj = Class(function(jsdc) {
    this.jsdc = jsdc;
    this.hash = {};
  }).methods({
    propt: function(node, start) {
      var parent = node.parent();
      if(parent.name() == JsNode.OBJLTR) {
        var prmr = parent.parent();
        parent = prmr.parent();
        if(prmr.name() == JsNode.PRMREXPR
          && !prmr.next()
          && (parent.name() == JsNode.ASSIGNEXPR
            || parent.name() == JsNode.INITLZ)) {
          if(node.size() == 1) {
            var first = node.first();
            if(first.name() == JsNode.TOKEN) {
              if(!start) {
                this.jsdc.appendBefore(':' + first.token().content());
              }
            }
            else {
              first = first.first();
              this.hash[first.nid()] = true;
            }
          }
        }
      }
    },
    name: function(node, start) {
      if(!start && this.hash.hasOwnProperty(node.nid())) {
        this.jsdc.append(':function');
      }
    }
  });
  
  module.exports = Obj;
  
});