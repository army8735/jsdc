define(function(require, exports, module) {
  var homunculus = require('homunculus');
  var JsNode = homunculus.getClass('Node', 'es6');
  var Token = homunculus.getClass('Token');
  
  var Class = require('./util/Class');
  
  var Obj = Class(function(jsdc) {
    this.jsdc = jsdc;
    this.hash = {};
    this.method = {};
    this.temp = {};
  }).methods({
    propt: function(node, start) {
      var objltr = node.parent();
      if(objltr.name() == JsNode.OBJLTR) {
        var prmr = objltr.parent();
        var parent = prmr.parent();
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
            else if(first.name() == JsNode.METHOD) {
              first = first.first();
              this.method[first.nid()] = true;
            }
          }
          else if(node.size() == 3) {
            var first = node.first();
            if(start
              && first.name() == JsNode.PROPTNAME
              && (first = first.first()).name() == JsNode.CMPTPROPT) {
              var temp = this.jsdc.uid();
              this.hash[objltr.nid()].temp.push({
                temp: temp,
                id: this.join(first)
              });
              this.jsdc.append(temp);
              this.jsdc.ignore(first);
            }
          }
        }
      }
    },
    name: function(node, start) {
      if(!start && this.method.hasOwnProperty(node.nid())) {
        this.jsdc.append(':function');
      }
    },
    parse: function(node, start) {
      var self = this;
      var prmr = node.parent();
      var parent = prmr.parent();
      if(prmr.name() == JsNode.PRMREXPR
        && !prmr.next()
        && (parent.name() == JsNode.ASSIGNEXPR
          || parent.name() == JsNode.INITLZ)) {
        if(start) {
          node.leaves().forEach(function(leaf) {
            if(leaf.name() == JsNode.PROPTDEF
              && (leaf = leaf.first()).name() == JsNode.PROPTNAME
              && (leaf = leaf.first()).name() == JsNode.CMPTPROPT) {
              var id = self.jsdc.uid();
              self.hash[node.nid()] = {
                id: id,
                temp: []
              };
              self.jsdc.append('function(){var ' + id + '=');
            }
          });
        }
        else if(self.hash.hasOwnProperty(node.nid())){
          var h = self.hash[node.nid()];
          var id = h.id;
          h.temp.forEach(function(t) {
            self.jsdc.appendBefore(';' + id);
            self.jsdc.appendBefore(t.id + '=' + id + '.' + t.temp);
            self.jsdc.appendBefore(';delete ' + id + '.' + t.temp);
          });
          self.jsdc.appendBefore(';return ' + id + '}()');
        }
      }
    },
    join: function(node, res) {
      res = res || { s: '' };
      var self = this;
      var isToken = node.name() == JsNode.TOKEN;
      var isVirtual = isToken && node.token().type() == Token.VIRTUAL;
      if(isToken) {
        if(!isVirtual) {
          res.s += node.token().content();
        }
      }
      else {
        node.leaves().forEach(function(leaf) {
          self.join(leaf, res);
        });
      }
      return res.s;
    }
  });
  
  module.exports = Obj;
  
});