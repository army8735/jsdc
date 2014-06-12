define(function(require, exports, module) {
  var homunculus = require('homunculus');
  var JsNode = homunculus.getClass('Node', 'es6');
  
  var Class = require('./util/Class');
  
  var Generator = Class(function(jsdc) {
    this.jsdc = jsdc;
    this.hash = {};
    this.star = {};
  }).methods({
    parse: function(node, start) {
      if(start) {
        this.jsdc.ignore(node.leaf(1));
        var token = node.leaf(2).first().token();
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
          temp: temp,
          yield: []
        };
        this.jsdc.append('function(){');
        this.jsdc.append('var ' + state + '=0;');
        this.jsdc.append('return ');
        this.jsdc.append('function(){return{next:' + temp + '}};');
        o.pos = this.jsdc.res.length;
        this.jsdc.append('function ' + temp);
      }
      else {
        this.jsdc.appendBefore('}();');
      }
    },
    expr: function(node, start) {
      if(start) {
        this.jsdc.ignore(node.first());
        this.jsdc.ignore(node.leaf(1));
        if(node.leaf(2).name() == JsNode.BINDID) {
          this.jsdc.ignore(node.leaf(2));
        }
        var state = this.jsdc.uid();
        var temp = this.jsdc.uid();
        var o = this.hash[node.nid()] = {
          state: state,
          index: 0,
          temp: temp,
          yield: []
        };
        this.jsdc.append('function(){');
        this.jsdc.append('var ' + state + '=0;');
        this.jsdc.append('return ');
        this.jsdc.append('function(){return{next:' + temp + '}};');
        o.pos = this.jsdc.res.length;
        this.jsdc.append('function ' + temp);
      }
      else {
        this.jsdc.appendBefore('}()');
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
        this.jsdc.append('arguments[0];');
        //yield *
        if(node.size() > 2
          && node.leaf(1).name() == JsNode.TOKEN
          && node.leaf(1).token().content() == '*') {
          this.jsdc.ignore(node.leaf(1));
          var temp = this.star[node.nid()] = this.jsdc.uid();
          this.jsdc.append('var ' + temp + '=');
        }
        else {
          this.jsdc.append('return{value:');
        }
      }
      else {
        if(this.star.hasOwnProperty(node.nid())) {
          var temp = this.star[node.nid()];
          this.jsdc.appendBefore('();if(!' + temp + '.done)' + o.state + '--;return ' + temp);
          o.yield.push({
            i: this.jsdc.i,
            star: temp
          });
        }
        else {
          this.jsdc.appendBefore(',done:false}');
          o.yield.push({
            i: this.jsdc.i
          });
        }
      }
    },
    body: function(node, start) {
      var top = node.parent();
      if(top.name() == JsNode.GENDECL) {
        var o = this.hash[top.nid()];
        if(start) {
          this.jsdc.append('switch(' + o.state + '++){case 0:');
        }
        else {
          if(o.index) {
            var yie = o.yield[o.yield.length - 1];
            var i;
            if(yie.star) {
              i = this.jsdc.res.lastIndexOf(yie.star, i);
              this.jsdc.replace(';default:', i + yie.star.length, 0);
            }
            else {
              i = this.jsdc.res.lastIndexOf(',done:false}', i);
              this.jsdc.replace('true};default:', i + 6, 6);
            }
          }
          this.jsdc.appendBefore(';return{done:true}}');
        }
      }
    },
    closest: function(node) {
      var parent = node;
      while(parent = parent.parent()) {
        if(parent.name() == JsNode.GENDECL
          || parent.name() == JsNode.GENEXPR) {
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
  
  module.exports = Generator;
  
});