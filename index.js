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
  var ArrowFn = require('./dist/ArrowFn');
  var Genarator = require('./dist/Genarator');
  var Destruct = require('./dist/Destruct');

  var Jsdc = Class(function(code) {
    this.code = (code + '') || '';
    this.index = 0;
    this.res = '';
    this.node = {};
    this.ignores = {};
    this.ts = [];

    this.scope = new Scope(this);
    this.defaultValue = new DefaultValue(this);
    this.rest = new Rest(this);
    this.template = new Template(this);
    this.forof = new Forof(this);
    this.klass = new Klass(this);
    this.num = new Num(this);
    this.module = new Module(this);
    this.arrCmph = new ArrCmph(this);
    this.arrowFn = new ArrowFn(this);
    this.gen = new Genarator(this);
    this.destruct = new Destruct(this);

    this.i = 0;
    this.ids = {};
    return this;
  }).methods({
    parse: function(code) {
      var self = this;
      if(!character.isUndefined(code)) {
        self.code = code + '';
      }
      var parser = homunculus.getParser('es6');
      self.node = parser.parse(code);
      self.ignores = parser.ignore();
      //记录所有id
      var lexer = parser.lexer;
      lexer.tokens().forEach(function(token) {
        if(token.type() == Token.ID) {
          self.ids[token.content()] = true;
        }
      });
      self.ts = lexer.tokens();
      //开头部分的ignore
      while(self.ignores[self.index]) {
        self.append(self.ignores[self.index++].content());
      }
      //预分析局部变量，将影响的let和const声明查找出来
      self.scope.parse(self.node);
      //递归处理
      self.recursion(self.node);
      return self.res;
    },
    ast: function() {
      return this.node;
    },
    tokens: function() {
      return this.ts;
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
        else if(content == '=>') {
          this.arrowFn.arrow(token);
        }
        else if(token.type() == Token.KEYWORD
          && content == 'super'){
          this.klass.super(node);
        }
        else if(token.type() == Token.TEMPLATE) {
          this.template.parse(token);
        }
        else if(!token.ignore && token.type() == Token.NUMBER) {
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
      //firefox的奇怪bug，调试时不显示，重新赋值就好了
      token.ignore = token.ignore;
      this.i = this.res.length;
      //加上ignore
      var ig;
      while(ig = this.next()) {
        if(!ignore || ig.type() != Token.BLANK) {
          this.res += ig.content();
          ignore && (ig.ignore = true);
          ignore = false;
        }
      }
    },
    before: function(node) {
      switch(node.name()) {
        //var变量前置，赋值部分删除var，如此可以将block用匿名函数包裹达到局部作用与效果
        case JsNode.VARSTMT:
          this.scope.prevar(node);
          this.gen.prevar(node);
          break;
        case JsNode.FNDECL:
          this.scope.prefn(node);
          break;
        case JsNode.GENDECL:
          this.scope.pregen(node);
          this.gen.parse(node, true);
          break;
        case JsNode.FNBODY:
          this.scope.enter(node);
          this.defaultValue.enter(node);
          this.rest.enter(node);
          this.gen.body(node, true);
          break;
        case JsNode.BLOCK:
          this.scope.block(node, true);
          break;
        case JsNode.FMPARAMS:
          this.defaultValue.param(node);
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
        case JsNode.ARROWFN:
          this.arrowFn.parse(node);
          break;
        case JsNode.ARROWPARAMS:
          this.arrowFn.params(node, true);
          break;
        case JsNode.CNCSBODY:
          this.arrowFn.body(node, true);
          break;
        case JsNode.YIELDEXPR:
          this.gen.yield(node, true);
          break;
      }
    },
    after: function(node) {
      switch(node.name()) {
        case JsNode.FNBODY:
          this.scope.leave(node);
          this.gen.body(node);
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
        case JsNode.ARROWPARAMS:
          this.arrowFn.params(node);
          break;
        case JsNode.CNCSBODY:
          this.arrowFn.body(node);
          break;
        case JsNode.GENDECL:
          this.gen.parse(node);
          break;
        case JsNode.YIELDEXPR:
          this.gen.yield(node);
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
    unIgnore: function(node) {return;
      var self = this;
      if(node instanceof Token) {
        delete node.ignore;
      }
      else if(node.name() == JsNode.TOKEN) {
        delete node.token().ignore;
      }
      else {
        node.leaves().forEach(function(leaf) {
          self.unIgnore(leaf);
        });
      }
    },
    uid: function() {
      var temp;
      while(temp = '__' + uid++ + '__') {
        if(!this.ids.hasOwnProperty(temp)) {
          break;
        }
      }
      return temp;
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
    tokens: function() {
      return jsdc.tokens();
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