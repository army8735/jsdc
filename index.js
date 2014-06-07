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
  var Rest = require('./dist/Rest');

  var Jsdc = Class(function(code) {
    this.code = (code + '') || '';
    this.index = 0;
    this.res = '';
    this.node = {};
    this.ignores = {};
    this.scope = new Scope(this);
    this.rest = new Rest(this);
    return this;
  }).methods({
    parse: function(code) {
      if(!character.isUndefined(code)) {
        this.code = code + '';
      }
      var parser = homunculus.getParser('es6');
      this.node = parser.parse(code);
      this.ignores = parser.ignore();
      //开头部分的ignore
      while(this.ignores[this.index]) {
        this.append(this.ignores[this.index++].content());
      }
      //预分析局部变量，将影响的let和const声明查找出来
      this.scope.parse(this.node);
      //递归处理
      this.recursion(this.node);
      return this.res;
    },
    ast: function() {
      return this.node;
    },
    append: function() {
      var self = this;
      var args = Array.prototype.slice.call(arguments, 0);
      args.forEach(function(s) {
        self.res += s;
      });
    },
    insert: function(s, i) {
      this.res = this.res.slice(0, i) + s + this.res.slice(i);
    },
    next: function() {
      var i = ++this.index;
      return this.ignores.hasOwnProperty(i) ? this.ignores[i] : null;
    },
    recursion: function(node) {
      var self = this;
      var isToken = node.name() == JsNode.TOKEN;
      var isVirtual = isToken && node.token().type() == Token.VIRTUAL;
      if(isToken) {
        if(!isVirtual) {
          self.token(node);
        }
      }
      else {
        self.before(node);
        node.leaves().forEach(function(leaf) {
          self.recursion(leaf);
        });
        self.after(node);
      }
    },
    token: function(node) {
      var token = node.token();
      var ignore = token.ignore;
      //替换掉let和const为var
      if(token.content() == 'let'
        || token.content() == 'const') {
        this.append('var');
      }
      else {
        if(token.content() == '}') {
          this.scope.block(node);
        }
        //替换操作会设置ignore属性将其忽略
        if(!ignore) {
          this.append(token.content());
        }
        if(token.content() == '{') {
          this.scope.block(node, true);
        }
      }
      //加上ignore
      var ig;
      while(ig = this.next()) {
        if(!ignore || ig.type() != Token.BLANK) {
          this.append(ig.content());
        }
      }
    },
    before: function(node) {
      //var变量前置，赋值部分删除var，如此可以将block用匿名函数包裹达到局部作用与效果
      if(node.name() == JsNode.VARSTMT) {
        this.scope.prepose(node);
      }
      else if(node.name() == JsNode.FNBODY) {
        this.scope.enter(node);
        this.rest.enter(node);
      }
      else if(node.name() == JsNode.BLOCK) {
        this.scope.block(node, true);
      }
      else if(node.name() == JsNode.FMPARAMS) {
        this.rest.parse(node);
      }
    },
    after: function(node) {
      if(node.name() == JsNode.FNBODY) {
        this.scope.leave(node);
      }
      else if(node.name() == JsNode.BLOCK) {
        this.scope.block(node);
      }
    },
    ignore: function(node) {
      var self = this;
      if(node instanceof Token) {
        node.ignore = true;
      }
      else if(node.name() == JsNode.TOKEN && node.token().type() != Token.VIRTUAL) {
        node.token().ignore = true;
      }
      else {
        node.leaves().forEach(function(leaf) {
          self.ignore(leaf);
        });
      }
    }
  }).statics({
    parse: function(code) {
      jsdc = new Jsdc();
      return jsdc.parse(code);
    },
    ast: function() {
      return jsdc.ast();
    }
  });
  var jsdc = null;
  module.exports = Jsdc;
});