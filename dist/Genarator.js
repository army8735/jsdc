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
  
  var Genarator = Class(function(jsdc) {
    this.jsdc = jsdc;
    this.hash = {};
  }).methods({
    parse: function(node, start) {
      if(start) {
        this.jsdc.ignore(node.leaf(1));
        var token = node.leaf(2).first().token();
        var id = token.content();
        //有可能被scope前置过
        var hasPre = token.ignore;
        //忽略本身
        this.jsdc.ignore(node.first());
        this.jsdc.ignore(token);
        if(!hasPre) {
          this.jsdc.append('var ');
          this.jsdc.append(node.leaf(2).first().token().content());
          this.jsdc.append('=');
        }
        var state = this.jsdc.uid();
        var temp = this.jsdc.uid();
        var o = this.hash[node.nid()] = {
          state: state,
          index: 0,
          temp: temp
        };
        this.jsdc.append('function(){');
        this.jsdc.append('var ' + state + '=0;');
        this.jsdc.append('return ');
        this.jsdc.append('function (){return {next:' + temp + '}};');
        o.pos = this.jsdc.res.length;
        this.jsdc.append('function ' + temp);
      }
      else {
        this.jsdc.appendBefore('}();');
      }
    },
    yield: function(node, start) {
      var top = this.closest(node);
      var o = this.hash[top.nid()];
      if(start) {
        if(o.index++ != 0) {
          this.jsdc.append('case ' + (o.index - 1) + ':');
        }
        this.jsdc.ignore(node.first());
        this.jsdc.append('return ');
      }
      else {
      }
    },
    body: function(node, start) {
      var top = node.parent();
      if(top.name() == JsNode.GENDECL) {
        if(start) {
          var o = this.hash[top.nid()];
          this.jsdc.append('switch(' + o.state + '++){case 0:');
        }
        else {
          this.jsdc.appendBefore('}');
        }
      }
    },
    closest: function(node) {
      var parent = node;
      while(parent = parent.parent()) {
        if(parent.name() == JsNode.GENDECL) {
          return parent;
        }
      }
    },
    prevar: function(varstmt) {
      var top = varstmt.gen;
      if(top) {
        this.jsdc.ignore(varstmt.first());
        this.jsdc.insert('var ' + varstmt.leaf(1).first().first().token().content() + ';', this.hash[top.nid()].pos);
      }
    }
  });
  
  module.exports = Genarator;
  
});