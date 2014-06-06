var homunculus = require('homunculus');
var JsNode = homunculus.getClass('Node', 'es6');

var Class = require('./util/Class');

var Scope = Class(function(jsdc) {
  this.jsdc = jsdc;
  this.split = [];
  this.lexes = [];
}).methods({
  parse: function(node) {
    this.recursion(node, 0);
    this.lexes.push(false);
    return this;
  },
  recursion: function(node, depth) {
    var self = this;
    var isToken = node.name() == JsNode.TOKEN;
    if(!isToken) {
      //每个作用域开始/结束时存入tid()分隔，全局作用域无记录，但可从<第一个和>最后一个判断
      if(node.name() == JsNode.FNDECL
        || node.name() == JsNode.FNEXPR) {
        this.split.push({
          start: node.first().token().tid(),
          end: node.last().token().tid()
        });
        this.lexes.push(false);
      }
      else if(node.name() == JsNode.LEXDECL) {
        self.lexes[depth] = true;
      }
      node.leaves().forEach(function(leaf) {
        self.recursion(leaf, depth + 1);
      });
    }
    return self;
  },
  prepose: function(varstmt) {
    var token = varstmt.first().token();
    var sec = this.getCurrentSection(token.tid());
    if(this.lexes[sec]) {
      if(sec == 0) {
        this.jsdc.prepend('var ' + this.jion(varstmt.leaf(1)));
      }
      else {}
      return true;
    }
    return false;
  },
  getCurrentSection: function(tid) {
    if(!this.split.length || tid < this.split[0].start || tid > this.split[this.split.length - 1].end) {
      return 0;
    }
    for(var i = 0; i < this.split.length; i++) {
      if(tid > this.split[i].start && tid < this.split[i].end) {
        return i + 1;
      }
    }
  },
  join: function(node) {
    //
  }
});

module.exports = Scope;