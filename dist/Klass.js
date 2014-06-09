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
  
  var Klass = Class(function(jsdc) {
    this.jsdc = jsdc;
    this.hash = {};
  }).methods({
    parse: function(node, start) {
      if(node.name() == JsNode.CLASSDECL) {
        if(start) {
          var o = {};
          o.name = node.leaf(1).first().token().content();
          this.body(node.last().prev(), o.name);
          this.jsdc.ignore(node.leaf(0));
          this.jsdc.ignore(node.leaf(1));
          this.jsdc.ignore(node.leaf(2));
          if(node.leaf(3).name() == JsNode.CLASSBODY) {
            this.jsdc.ignore(node.leaf(4));
          }
          else {
            this.jsdc.ignore(node.leaf(3));
            this.jsdc.ignore(node.leaf(5));
            o.extend = this.join(node.leaf(2).last());
            this.jsdc.append('!function(){');
            this.jsdc.append('var _=Object.create(' + o.extend + '.prototype);');
            this.jsdc.append('_.constructor=' + o.name + ';');
            this.jsdc.append(o.name + '.prototype=_');
            this.jsdc.append('}();');
          }
          this.hash[node.nid()] = o;
        }
        else {
          var o = this.hash[node.nid()];
          if(o.extend) {
            this.jsdc.appendBefore('Object.keys(' + o.extend + ').forEach(function(k){' + o.name + '[k]=' + o.extend + '[k]});');
          }
        }
      }
      //classexpr由于没有类名，需要封装成一个返回class的fnexpr
      else {
        if(start) {
          this.jsdc.append('function(){');
          var o = {};
          this.jsdc.ignore(node.leaf(0));
          this.jsdc.ignore(node.leaf(1));
          if(node.leaf(2).name() == JsNode.TOKEN
            && node.leaf(2).token().content() == '{') {
            this.jsdc.ignore(node.leaf(2));
            if(node.leaf(1).name() == JsNode.HERITAGE) {
              o.extend = this.join(node.leaf(1).last());
              o.name = this.jsdc.uid();
            }
            else {
              o.name = node.leaf(1).first().token().content();
            }
          }
          else if(node.leaf(3).name() == JsNode.TOKEN
            && node.leaf(3).token().content() == '{') {
            this.jsdc.ignore(node.leaf(3));
            o.name = node.leaf(1).first().token().content();
            o.extend = this.join(node.leaf(2).last());
          }
          else {
            o.name = this.jsdc.uid();
            this.jsdc.ignore(node.leaf(1));
            if(node.leaf(2).name() == JsNode.HERITAGE) {
              o.extend = this.join(node.leaf(2).last());
            }
          }
          this.jsdc.ignore(node.last());
          var classbody = node.last().prev();
          this.body(classbody, o.name);
          if(o.extend) {
            this.jsdc.append('!function(){');
            this.jsdc.append('var _=Object.create(' + o.extend + '.prototype);');
            this.jsdc.append('_.constructor=' + o.name + ';');
            this.jsdc.append(o.name + '.prototype=_');
            this.jsdc.append('}();');
          }
          this.hash[node.nid()] = o;
        }
        else {
          var o = this.hash[node.nid()];
          if(o.extend) {
            this.jsdc.appendBefore('Object.keys(' + o.extend + ').forEach(function(k){' + o.name + '[k]=' + o.extend + '[k]});');
          }
          this.jsdc.appendBefore('return ' + o.name);
          //特别注意这里的()没有结尾分号，因为是表达式
          this.jsdc.appendBefore('}()');
        }
      }
    },
    elem: function(node, start) {
      var first = node.first();
      var top = node.parent().parent();
      var o = this.hash[top.nid()];
      if(first.name() == JsNode.METHOD) {
        first = first.first();
        if(first.name() == JsNode.PROPTNAME) {
          if(start) {
            var token = first.first().first().token();
            this.jsdc.ignore(token);
            if(token.content() == 'constructor') {
              this.jsdc.append('function ');
              this.jsdc.append(o.name);
            }
            else {
              this.jsdc.append(o.name);
              this.jsdc.append('.prototype.' + token.content() + ' = function');
            }
          }
        }
        else {
          var token = first.token();
          if(start) {
            this.jsdc.append(o.name);
            this.jsdc.append('.prototype.');
            if(token.content() == 'get') {
              var n = first.next().first().first().token();
              o.g = n.content();
              this.jsdc.append(o.g);
            }
            else {
              var n = first.next().first().first().token();
              o.s = n.content();
              this.jsdc.append(o.s);
            }
            this.jsdc.append('={');
          }
          else {
            this.jsdc.appendBefore('}["');
            if(token.content() == 'get') {
              this.jsdc.appendBefore(o.g);
            }
            else {
              this.jsdc.appendBefore(o.s);
            }
            this.jsdc.appendBefore('"];');
          }
        }
      }
      else if(first.name() == JsNode.TOKEN
        && first.token().content() == 'static') {
        if(start) {
          this.jsdc.ignore(first.token());
          this.jsdc.append(o.name + '.');
        }
      }
    },
    super: function(node) {
      this.jsdc.ignore(node);
      var top = this.closest(node);
      if(this.hash.hasOwnProperty(top.nid())) {
        this.jsdc.append(this.hash[top.nid()].extend);
        if(node.next()
          && node.next().name() == JsNode.ARGS) {
          this.jsdc.append('.call');
        }
      }
    },
    prts: function(node, start) {
      var parent = node.parent();
      if(start) {
        if(parent.name() == JsNode.METHOD
          && parent.prev()
          && parent.prev().name() == JsNode.TOKEN
          && parent.prev().token().content() == 'static') {
          parent = parent.parent();
          if(parent.name() == JsNode.CLASSELEM) {
            this.jsdc.appendBefore('=function');
          }
        }
      }
      else {
        if(parent.name() == JsNode.ARGS
          && parent.prev().name() == JsNode.TOKEN
          && parent.prev().token().content() == 'super') {
          this.jsdc.appendBefore('this');
        }
      }
    },
    body: function(node, id) {
      var noCons = true;
      var leaves = node.leaves();
      for(var i = 0; i < leaves.length; i++) {
        var leaf = leaves[i];
        if(leaf.name() == JsNode.CLASSELEM
          && (leaf = leaf.first()).name() == JsNode.METHOD
          && (leaf = leaf.first()).name() == JsNode.PROPTNAME
          && (leaf = leaf.first()).first().token().content() == 'constructor') {
          noCons = false;
          break;
        }
      }
      if(noCons) {
        this.jsdc.append('function ' + id + '(){}');
      }
    },
    closest: function(node) {
      var parent = node;
      while(parent = parent.parent()) {
        if(parent.name() == JsNode.CLASSDECL
          || parent.name() == JsNode.CLASSEXPR) {
          return parent;
        }
      }
    },
    join: function(node) {
      var res = { s: '' };
      this.recursion(node, res);
      return res.s;
    },
    recursion: function(node, res) {
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
          self.recursion(leaf, res);
        });
      }
    }
  });
  
  module.exports = Klass;
  
});