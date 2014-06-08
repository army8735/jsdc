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
  var DefaultValue = require('./dist/DefaultValue');
  var Rest = require('./dist/Rest');
  var Template = require('./dist/Template');
  var Forof = require('./dist/Forof');
  var Klass = require('./dist/Klass');
  var Num = require('./dist/Num');
  var Module = require('./dist/Module');
  var ArrCmph = require('./dist/ArrCmph');

  var Jsdc = Class(function(code) {
    this.code = (code + '') || '';
    this.index = 0;
    this.res = '';
    this.node = {};
    this.ignores = {};
    this.scope = new Scope(this);
    this.default = new DefaultValue(this);
    this.rest = new Rest(this);
    this.template = new Template(this);
    this.forof = new Forof(this);
    this.klass = new Klass(this);
    this.num = new Num(this);
    this.module = new Module(this);
    this.arrCmph = new ArrCmph(this);
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
      var content = token.content();
      //替换掉let和const为var
      if(content == 'let'
        || content == 'const') {
        !token.ignore && this.append('var');
      }
      else {
        if(content == '}') {
          this.scope.block(node);
        }
        else if(content == 'of') {
          this.forof.of(node);
          this.arrCmph.of(node);
        }
        else if(content == '(') {
          this.klass.prts(node, true);
        }
        else if(token.type() == Token.KEYWORD
          && content == 'super'){
          token.ignore = true;
          this.append(this.klass.super(node));
        }
        else if(token.type() == Token.TEMPLATE) {
          token.ignore = true;
          this.template.parse(token);
        }
        else if(!token.ignore && token.type() == Token.NUMBER) {
          token.ignore = true;
          this.num.parse(token);
        }
        //替换操作会设置ignore属性将其忽略
        if(!token.ignore) {
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
      var ignore = token.ignore;
      this.i = this.res.length;
      //加上ignore
      var ig;
      while(ig = this.next()) {
        if(!ignore || ig.type() != Token.BLANK) {
          this.res += ig.content();
          ignore = false;
        }
      }
    },
    before: function(node) {
      switch(node.name()) {
        //var变量前置，赋值部分删除var，如此可以将block用匿名函数包裹达到局部作用与效果
        case JsNode.VARSTMT:
          this.scope.prevar(node);
          break;
        case JsNode.FNDECL:
          this.scope.prefn(node);
          break;
        case JsNode.FNBODY:
          this.scope.enter(node);
          this.default.enter(node);
          this.rest.enter(node);
          break;
        case JsNode.BLOCK:
          this.scope.block(node, true);
          break;
        case JsNode.FMPARAMS:
          this.default.param(node);
          this.rest.param(node);
          break;
        case JsNode.CALLEXPR:
          this.rest.expr(node);
          break;
        case JsNode.ARGS:
          this.rest.args(node);
          break;
        case JsNode.ARGLIST:
          this.rest.arglist(node);
          break;
        case JsNode.ITERSTMT:
          this.forof.parse(node, true);
          break;
        case JsNode.CLASSDECL:
        case JsNode.CLASSEXPR:
          this.klass.parse(node, true);
          break;
        case JsNode.CLASSELEM:
          this.klass.elem(node, true);
          break;
        case JsNode.MODULEBODY:
          this.module.enter(node);
          break;
        case JsNode.MODULEIMPORT:
          this.module.module(node);
          break;
        case JsNode.IMPORTDECL:
          this.module.import(node);
          break;
        case JsNode.EXPORTDECL:
          this.module.export(node);
          break;
        case JsNode.ARRCMPH:
          this.arrCmph.parse(node, true);
          break;
        case JsNode.CMPHFOR:
          this.arrCmph.for(node, true);
          break;
        case JsNode.CMPHIF:
          this.arrCmph.if(node, true);
          break;
      }
    },
    after: function(node) {
      switch(node.name()) {
        case JsNode.FNBODY:
          this.scope.leave(node);
          break;
        case JsNode.BLOCK:
          this.scope.block(node);
          break;
        case JsNode.ITERSTMT:
          this.forof.parse(node);
          break;
        case JsNode.CLASSDECL:
        case JsNode.CLASSEXPR:
          this.klass.parse(node);
          break;
        case JsNode.CLASSELEM:
          this.klass.elem(node);
          break;
        case JsNode.MODULEBODY:
          this.module.leave(node);
          break;
        case JsNode.ARRCMPH:
          this.arrCmph.parse(node);
          break;
        case JsNode.CMPHFOR:
          this.arrCmph.for(node);
          break;
        case JsNode.CMPHIF:
          this.arrCmph.if(node);
          break;
      }
    },
    ignore: function(node) {
      var self = this;
      if(node instanceof Token) {
        node.ignore = true;
      }
      else if(node.name() == JsNode.TOKEN) {
        node.token().ignore = true;
      }
      else {
        node.leaves().forEach(function(leaf) {
          self.ignore(leaf);
        });
      }
    },
    uid: function() {
      return Jsdc.uid();
    },
    define: function(d) {
      return Jsdc.define(d);
    }
  }).statics({
    parse: function(code) {
      jsdc = new Jsdc();
      return jsdc.parse(code);
    },
    ast: function() {
      return jsdc.ast();
    },
    uid: function() {
      return '__' + uid++ + '__';
    },
    reset: function() {
      uid = 0;
    },
    define: function(d) {
      if(!character.isUndefined(d)) {
        def = d;
      }
      return def;
    }
  });
  var jsdc = null;
  var uid = 0;
  var def = false;
  module.exports = Jsdc;
});