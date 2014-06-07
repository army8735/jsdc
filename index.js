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
  var Default = require('./dist/Default');
  var Rest = require('./dist/Rest');
  var Template = require('./dist/Template');
  var Forof = require('./dist/Forof');
  var Klass = require('./dist/Klass');

  var Jsdc = Class(function(code) {
    this.code = (code + '') || '';
    this.index = 0;
    this.res = '';
    this.node = {};
    this.ignores = {};
    this.scope = new Scope(this);
    this.default = new Default(this);
    this.rest = new Rest(this);
    this.template = new Template(this);
    this.forof = new Forof(this);
    this.klass = new Klass(this);
    this.i = 0;
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
    append: function(s) {
      this.res += s;
      this.i = this.res.length;
    },
    appendBefore: function(s) {
      if(this.i < this.res.length) {
        this.insert(s, this.i);
        this.i += s.length;
      }
      else {
        this.append(s);
      }
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
      delete token.ignore;
      var content = token.content();
      //替换掉let和const为var
      if(content == 'let'
        || content == 'const') {
        this.append('var');
      }
      else {
        if(content == '}') {
          this.scope.block(node);
        }
        else if(content == 'of') {
          this.forof.of(node);
        }
        else if(content == '(') {
          this.klass.prts(node, true);
        }
        else if(token.type() == Token.KEYWORD
          && content == 'super'){
          ignore = true;
          this.append(this.klass.super(node));
        }
        else if(token.type() == Token.TEMPLATE) {
          ignore = true;
          this.template.parse(token);
        }
        //替换操作会设置ignore属性将其忽略
        if(!ignore) {
          this.append(content);
        }
        if(content == '{') {
          this.scope.block(node, true);
          this.forof.block(node);
        }
        else if(content == ')') {
          this.forof.prts(node);
        }
        else if(content == '(') {
          this.klass.prts(node);
        }
      }
      this.i = this.res.length;
      //加上ignore
      var ig;
      while(ig = this.next()) {
        if(!ignore || ig.type() != Token.BLANK) {
          this.res += ig.content();
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
        this.default.enter(node);
        this.rest.enter(node);
      }
      else if(node.name() == JsNode.BLOCK) {
        this.scope.block(node, true);
      }
      else if(node.name() == JsNode.FMPARAMS) {
        this.default.param(node);
        this.rest.param(node);
      }
      else if(node.name() == JsNode.CALLEXPR) {
        this.rest.expr(node);
      }
      else if(node.name() == JsNode.ARGS) {
        this.rest.args(node);
      }
      else if(node.name() == JsNode.ARGLIST) {
        this.rest.arglist(node);
      }
      else if(node.name() == JsNode.ITERSTMT) {
        this.forof.parse(node, true);
      }
      else if(node.name() == JsNode.CLASSDECL
        || node.name() == JsNode.CLASSEXPR) {
        this.klass.parse(node, true);
      }
      else if(node.name() == JsNode.CLASSELEM) {
        this.klass.elem(node, true);
      }
    },
    after: function(node) {
      if(node.name() == JsNode.FNBODY) {
        this.scope.leave(node);
      }
      else if(node.name() == JsNode.BLOCK) {
        this.scope.block(node);
      }
      else if(node.name() == JsNode.ITERSTMT) {
        this.forof.parse(node);
      }
      else if(node.name() == JsNode.CLASSDECL
        || node.name() == JsNode.CLASSEXPR) {
        this.klass.parse(node);
      }
      else if(node.name() == JsNode.CLASSELEM) {
        this.klass.elem(node);
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