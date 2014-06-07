var homunculus = require('homunculus');
var JsNode = homunculus.getClass('Node', 'es6');
var Token = homunculus.getClass('Token');

var Class = require('./util/Class');

var Scope = Class(function(jsdc) {
  this.jsdc = jsdc;
  this.hash = {};
}).methods({
  parse: function(fmparams) {
    if(fmparams.name() == JsNode.FMPARAMS && fmparams.size()) {
      var sgname = fmparams.last();
      if(sgname.name() == JsNode.SINGLENAME && sgname.size() == 2) {
        var init = sgname.last();
        if(init.name() == JsNode.INITLZ) {
          this.jsdc.ignore(init);
          this.hash[fmparams.next().next().next().nid()] = sgname;
        }
      }
    }
  },
  enter: function(fnbody) {
    if(this.hash.hasOwnProperty(fnbody.nid())) {
      var sgname = this.hash[fnbody.nid()];
      var id = sgname.first().first().token().content();
      this.jsdc.append('if(typeof ' + id + ' == "undefined") ' + id);
      this.recursion(sgname.last());
      this.jsdc.append(';');
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

module.exports = Scope;
