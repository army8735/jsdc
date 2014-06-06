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

  var character = require('./dist/util/character');
  var Class = require('./dist/util/Class');

  var Scope = require('./dist/Scope');

  function recursion(node, ignore, jsdc) {
    var isToken = node.name() == JsNode.TOKEN;
    var isVirtual = isToken && node.token().type() == Token.VIRTUAL;
    if(isToken) {
      if(!isVirtual) {
        var token = node.token();
        //替换掉let和const为var
        if(token.content() == 'let'
          || token.content() == 'const') {
          jsdc.append('var');
        }
        else {
          jsdc.append(token.content());
        }
        //加上ignore
        var s;
        while(s = jsdc.next()) {
          jsdc.append(s);
        }
      }
    }
    else {
      //var变量前置，赋值部分删除var，如此可以将block用匿名函数包裹达到局部作用与效果
      if(node.name() == JsNode.VARSTMT) {
        jsdc.scope.prepose(node);
      }
      node.leaves().forEach(function(leaf) {
        recursion(leaf, ignore, jsdc);
      });
    }
  }

  var JSDC = Class(function(code) {
    this.code = (code + '') || '';
    this.index = 0;
    this.res = '';
    this.node = {};
    this.ignore = {};
    this.scope = new Scope(this);
    return this;
  }).methods({
    parse: function(code) {
      if(!character.isUndefined(code)) {
        this.code = code + '';
      }
      var parser = homunculus.getParser('es6');
      this.node = parser.parse(code);
      this.ignore = parser.ignore();
      //开头部分的ignore
      while(this.ignore[this.index]) {
        this.append(this.ignore[this.index++].content());
      }
      //预分析局部变量，将影响的let和const声明查找出来
      this.scope.parse(this.node);
      //递归处理
      recursion(this.node, this.ignore, this);
      return this.res;
    },
    append: function() {
      var self = this;
      var args = Array.prototype.slice.call(arguments, 0);
      args.forEach(function(s) {
        self.res += s;
      });
      return this;
    },
    prepend: function() {
      var self = this;
      var args = Array.prototype.slice.call(arguments, 0);
      args.reverse().forEach(function(s) {
        self.res = s + self.res;
      });
      return this;
    },
    next: function() {
      var i = ++this.index;
      return this.ignore.hasOwnProperty(i) ? this.ignore[i].content() : null;
    }
  }).statics({
    parse: function(code) {
      var jsdc = new JSDC();
      return jsdc.parse(code);
    }
  });
  module.exports = JSDC;
});