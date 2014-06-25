define(function(require, exports, module) {
  var homunculus = require('homunculus');
  var JsNode = homunculus.getClass('Node', 'es6');
  var Token = homunculus.getClass('Token');
  
  var Class = require('./util/Class');
  var join = require('./join');
  
  var Rest = Class(function(jsdc) {
    this.jsdc = jsdc;
    this.hash = {};
    this.hash2 = {};
  }).methods({
    param: function(fmparams) {
      if(fmparams.name() == JsNode.FMPARAMS && fmparams.size()) {
        var last = fmparams.last();
        var fnbody = fmparams.next().next().next();
        if(last.name() == JsNode.BINDREST) {
          var rest = last.first();
          this.jsdc.ignore(rest, 'rest1');
          this.hash[fnbody.nid()] = {
            index: fmparams.size() - 1,
            token: last.last().first().token()
          };
        }
      }
    },
    enter: function(fnbody) {
      if(this.hash.hasOwnProperty(fnbody.nid())) {
        var o = this.hash[fnbody.nid()];
        var index = o.index;
        var id = o.token.content();
        this.jsdc.append(id + '=[].slice.call(arguments, ' + index + ');');
      }
    },
    expr: function(node) {
      var args = node.last();
      var arglist = args.leaf(1);
      if(arglist.size() > 1) {
        var last = arglist.last();
        var spread = last.prev();
        if(spread.name() == JsNode.TOKEN && spread.token().content() == '...') {
          var first = node.first();
          this.hash2[node.nid()] = first;
          this.jsdc.ignore(arglist, 'rest2');
        }
      }
    },
    args: function(node) {
      var parent = node.parent();
      if(parent.name() == JsNode.CALLEXPR && this.hash2.hasOwnProperty(parent.nid())) {
        this.jsdc.append('.apply');
      }
    },
    arglist: function(node) {
      var parent = node.parent().parent();
      if(parent.name() == JsNode.CALLEXPR && this.hash2.hasOwnProperty(parent.nid())) {
        var mmb = this.hash2[parent.nid()];
        //主表达式无需设置apply的context，成员需设
        this.jsdc.append(mmb.name() == JsNode.MMBEXPR ? join(mmb.first()) : 'this');
        this.jsdc.append(', [');
        var leaves = node.leaves();
        for(var i = 0; i < leaves.length - 3; i++) {
          this.jsdc.append(join(leaves[i]));
        }
        this.jsdc.append(']');
        this.jsdc.append('.concat(');
        this.jsdc.append(node.last().first().token().content());
        this.jsdc.append(')');
      }
    }
  });
  
  module.exports = Rest;
  
});