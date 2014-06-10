var expect = require('expect.js');
var fs = require('fs');
var path = require('path');

var Jsdc = require('../');

describe('api', function() {
  it('#parse', function() {
    var jsdc = new Jsdc();
    expect(jsdc.parse).to.be.a(Function);
  });
  it('#append', function() {
    var jsdc = new Jsdc();
    expect(jsdc.append).to.be.a(Function);
  });
  it('#appendBefore', function() {
    var jsdc = new Jsdc();
    expect(jsdc.appendBefore).to.be.a(Function);
  });
  it('#insert', function() {
    var jsdc = new Jsdc();
    expect(jsdc.insert).to.be.a(Function);
  });
  it('#next', function() {
    var jsdc = new Jsdc();
    expect(jsdc.next).to.be.a(Function);
  });
  it('#before', function() {
    var jsdc = new Jsdc();
    expect(jsdc.before).to.be.a(Function);
  });
  it('#token', function() {
    var jsdc = new Jsdc();
    expect(jsdc.token).to.be.a(Function);
  });
  it('#recursion', function() {
    var jsdc = new Jsdc();
    expect(jsdc.recursion).to.be.a(Function);
  });
  it('#ignore', function() {
    var jsdc = new Jsdc();
    expect(jsdc.ignore).to.be.a(Function);
  });
  it('#uid', function() {
    var jsdc = new Jsdc();
    expect(jsdc.uid).to.be.a(Function);
  });
  it('#define', function() {
    var jsdc = new Jsdc();
    expect(jsdc.define).to.be.a(Function);
  });
  it('#ast', function() {
    var jsdc = new Jsdc();
    expect(jsdc.ast).to.be.a(Function);
  });
  it('#tokens', function() {
    var jsdc = new Jsdc();
    expect(jsdc.tokens).to.be.a(Function);
  });
  it('static #parse', function() {
    expect(Jsdc.parse).to.be.a(Function);
  });
  it('static #reset', function() {
    expect(Jsdc.reset).to.be.a(Function);
  });
  it('static #define', function() {
    expect(Jsdc.define).to.be.a(Function);
  });
  it('static #ast', function() {
    expect(Jsdc.ast).to.be.a(Function);
  });
  it('static #tokens', function() {
    expect(Jsdc.tokens).to.be.a(Function);
  });
});
describe('ignore es5', function() {
  it('varstmt', function() {
    var s = 'var a = 1';
    var res = Jsdc.parse(s);
    expect(res).to.eql(s);
  });
  it('forstmt', function() {
    var s = 'for(;;){var a}';
    var res = Jsdc.parse(s);
    expect(res).to.eql(s);
  });
  it('whilestmt', function() {
    var s = 'while(false){var a}';
    var res = Jsdc.parse(s);
    expect(res).to.eql(s);
  });
  it('trystmt', function() {
    var s = 'try{var a}catch(e){var b}finally{var c}';
    var res = Jsdc.parse(s);
    expect(res).to.eql(s);
  });
  it('forin', function() {
    var s = 'for(a in b){}';
    var res = Jsdc.parse(s);
    expect(res).to.eql(s);
  });
  it('function', function() {
    var s = 'function a(b){}';
    var res = Jsdc.parse(s);
    expect(res).to.eql(s);
  });
  it('jquery', function() {
    var s = fs.readFileSync(path.join(__dirname, './lib/jquery.js'), { encoding: 'utf-8' });
    var res = Jsdc.parse(s);
    expect(res).to.eql(s);
  });
  it('use new', function() {
    var s = 'function a(b){}';
    var res = new Jsdc().parse(s);
    expect(res).to.eql(s);
  });
});
describe('es6', function() {
  describe('scope', function() {
    it('global let should be replaced by var', function() {
      var s = 'let a = 1';
      var res = Jsdc.parse(s);
      expect(res).to.eql('var a = 1');
    });
    it('global const should be replaced by var', function() {
      var s = 'let a = 1';
      var res = Jsdc.parse(s);
      expect(res).to.eql('var a = 1');
    });
    it('global let/const with var', function() {
      var s = 'let a;var b;const c; var d;';
      var res = Jsdc.parse(s);
      expect(res).to.eql('var a;var b;var c; var d;');
    });
    it('let in block', function() {
      var s = '{let b;}';
      var res = Jsdc.parse(s);
      expect(res).to.eql('!function(){var b;}();')
    });
    it('let and var in block', function() {
      var s = '{var a;let b;}';
      var res = Jsdc.parse(s);
      expect(res).to.eql('var a;!function(){a;var b;}();');
    });
    it('let and var in ifstmt', function() {
      var s = 'if(true){var a;let b;}';
      var res = Jsdc.parse(s);
      expect(res).to.eql('var a;if(true){!function(){a;var b;}();}');
    });
    it('const and var in forstmt', function() {
      var s = 'for(;;){var a;const b;}';
      var res = Jsdc.parse(s);
      expect(res).to.eql('var a;for(;;){!function(){a;var b;}();}');
    });
    it('const and var in whilestmt', function() {
      var s = 'while(false){var a;const b;}';
      var res = Jsdc.parse(s);
      expect(res).to.eql('var a;while(false){!function(){a;var b;}();}');
    });
    it('let and var in trystmt', function() {
      var s = 'try{var a;let b}catch(e){var a;let b}finally{var a;let b}';
      var res = Jsdc.parse(s);
      expect(res).to.eql('var a;try{!function(){a;var b}();}catch(e){!function(){a;var b}();}finally{!function(){a;var b}();}');
    });
    it('let and var in function', function() {
      var s = 'function a(){var b;let c;{var d;let e}}';
      var res = Jsdc.parse(s);
      expect(res).to.eql('function a(){var d;var b;var c;!function(){d;var e}();}');
    });
    it('empty block', function() {
      var s = '{}';
      var res = Jsdc.parse(s);
      expect(res).to.eql('!function(){}();');
    });
    it('block with function decl', function() {
      var s = '{function a(){}}';
      var res = Jsdc.parse(s);
      expect(res).to.eql('var a;!function(){a=function (){}}();');
    });
    it('block with varstmt', function() {
      var s = '{var a}';
      var res = Jsdc.parse(s);
      expect(res).to.eql('var a;!function(){a}();');
    });
    it('block with multi vardecl', function() {
      var s = '{var a,b}';
      var res = Jsdc.parse(s);
      expect(res).to.eql('var b;var a;!function(){a,b}();');
    });
    it('block with var and fn with same name', function() {
      var s = '{var a;function a(){}}';
      var res = Jsdc.parse(s);
      expect(res).to.eql('var a;!function(){a;a=function (){}}();');
    });
    it('var in method', function() {
      var s = 'class A{m(){var a}}';
      var res = Jsdc.parse(s);
      expect(res).to.eql('function A(){}A.prototype.m = function(){var a}');
    });
    it('let in method', function() {
      var s = 'class A{m(){let a}}';
      var res = Jsdc.parse(s);
      expect(res).to.eql('function A(){}A.prototype.m = function(){var a}');
    });
    it('var and let in method', function() {
      var s = 'class A{m(){let a;var b}}';
      var res = Jsdc.parse(s);
      expect(res).to.eql('function A(){}A.prototype.m = function(){var a;var b}');
    });
    it('append comment', function() {
      var s = '{}//';
      var res = Jsdc.parse(s);
      expect(res).to.eql('!function(){}();//');
    });
    it('append multi comment', function() {
      var s = '{}//\n//';
      var res = Jsdc.parse(s);
      expect(res).to.eql('!function(){}();//\n//');
    });
    it('ifstmt append comment', function() {
      var s = 'if(true){let a}//';
      var res = Jsdc.parse(s);
      expect(res).to.eql('if(true){!function(){var a}();}//');
    });
    it('trystmt append comment', function() {
      var s = 'try{let a}catch(e){const a}//';
      var res = Jsdc.parse(s);
      expect(res).to.eql('try{!function(){var a}();}catch(e){!function(){var a}();}//');
    });
    it('use new', function() {
      var s = '{const a}';
      var res = new Jsdc().parse(s);
      expect(res).to.eql('!function(){var a}();')
    });
  });
  describe('init params', function() {
    it('only one id', function() {
      var s = 'function a(b = 1){}';
      var res = Jsdc.parse(s);
      expect(res).to.eql('function a(b ){if(typeof b=="undefined")b = 1;}')
    });
    it('after an id', function() {
      var s = 'function a(b, c = fn()){}';
      var res = Jsdc.parse(s);
      expect(res).to.eql('function a(b, c ){if(typeof c=="undefined")c = fn ( );}')
    });
    it('multi', function() {
      var s = 'function a(b = 1, c = []){}';
      var res = Jsdc.parse(s);
      expect(res).to.eql('function a(b , c ){if(typeof b=="undefined")b = 1;if(typeof c=="undefined")c = [ ];}')
    });
  });
  describe('rest params', function() {
    it('fmparams', function() {
      var s = 'function a(...b){}';
      var res = Jsdc.parse(s);
      expect(res).to.eql('function a(b){b=[].slice.call(arguments, 0);}')
    });
    it('callexpr single spread', function() {
      var s = 'Math.max(...a)';
      var res = Jsdc.parse(s);
      expect(res).to.eql('Math.max.apply(Math, [].concat(a))')
    });
    it('callexpr mult spread', function() {
      var s = 'Math.max(a, ...b)';
      var res = Jsdc.parse(s);
      expect(res).to.eql('Math.max.apply(Math, [a].concat(b))')
    });
    it('callexpr with prmrexpr', function() {
      var s = 'fn(a, b, ...c)';
      var res = Jsdc.parse(s);
      expect(res).to.eql('fn.apply(this, [a,b].concat(c))')
    });
  });
  describe('template', function() {
    it('normal', function() {
      var s = '`temp`';
      var res = Jsdc.parse(s);
      expect(res).to.eql('"temp"');
    });
    it('with varable 1', function() {
      var s = '`${a}b`';
      var res = Jsdc.parse(s);
      expect(res).to.eql('(a + "b")');
    });
    it('with varable 2', function() {
      var s = '`a${b}`';
      var res = Jsdc.parse(s);
      expect(res).to.eql('("a" + b)');
    });
    it('escape varable', function() {
      var s = '`\\${b}`';
      var res = Jsdc.parse(s);
      expect(res).to.eql('"\\${b}"');
    });
    it('escape quote', function() {
      var s = '`"a"b\'c`';
      var res = Jsdc.parse(s);
      expect(res).to.eql('"\\"a\\"b\'c"');
    });
  });
  describe('for of', function() {
    it('normal', function() {
      var s = 'for(a of {}){}';
      var res = Jsdc.parse(s);
      expect(res).to.eql('for(a in {}){a={}[a];}');
    });
    it('without blockstmt', function() {
      var s = 'for(a of b);';
      var res = Jsdc.parse(s);
      expect(res).to.eql('for(a in b){a=b[a];;}');
    });
    it('without blockstmt and append comment', function() {
      var s = 'for(a of b);//';
      var res = Jsdc.parse(s);
      expect(res).to.eql('for(a in b){a=b[a];;}//');
    });
    it('without blockstmt and append mulit comment', function() {
      var s = 'for(a of b);/**/\n//\n';
      var res = Jsdc.parse(s);
      expect(res).to.eql('for(a in b){a=b[a];;}/**/\n//\n');
    });
    it('varstmt', function() {
      var s = 'for(var a of {}){a}';
      var res = Jsdc.parse(s);
      expect(res).to.eql('for(var a in {}){a={}[a];a}');
    });
    it('varstmt without blockstmt', function() {
      var s = 'for(var a of {})a';
      var res = Jsdc.parse(s);
      expect(res).to.eql('for(var a in {}){a={}[a];a}');
    });
  });
  describe('class', function() {
    it('empty', function() {
      var s = 'class A{}';
      var res = Jsdc.parse(s);
      expect(res).to.eql('function A(){}');
    });
    it('normal', function() {
      var s = 'class A{constructor(){}}';
      var res = Jsdc.parse(s);
      expect(res).to.eql('function A(){}');
    });
    it('extends', function() {
      var s = 'class A extends B{\nconstructor(){super()}\na(){}\n}';
      var res = Jsdc.parse(s);
      expect(res).to.eql('!function(){var _=Object.create(B.prototype);_.constructor=A;A.prototype=_}();\nfunction A(){B.call(this)}\nA.prototype.a = function(){}\nObject.keys(B).forEach(function(k){A[k]=B[k]});');
    });
    it('getter/setter', function() {
      var s = 'class A extends B{\na(){}\nget b(){}\nset c(d){}\n}';
      var res = Jsdc.parse(s);
      expect(res).to.eql('function A(){}!function(){var _=Object.create(B.prototype);_.constructor=A;A.prototype=_}();\nA.prototype.a = function(){}\nA.prototype.b={get b(){}}["b"];\nA.prototype.c={set c(d){}}["c"];\nObject.keys(B).forEach(function(k){A[k]=B[k]});');
    });
    it('static', function() {
      var s = 'class A extends B{\nstatic a(){super.b}\n}';
      var res = Jsdc.parse(s);
      expect(res).to.eql('function A(){}!function(){var _=Object.create(B.prototype);_.constructor=A;A.prototype=_}();\nA.a=function(){B.b}\nObject.keys(B).forEach(function(k){A[k]=B[k]});');
    });
    it(';', function() {
      var s = 'class A{;}';
      var res = Jsdc.parse(s);
      expect(res).to.eql('function A(){};');
    });
    it('classexpr', function() {
      var s = '!class {}';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('!function(){function __0__(){}return __0__}()');
    });
    it('classexpr withname', function() {
      var s = '!class A{}';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('!function(){function A(){}return A}()');
    });
    it('classexpr method', function() {
      var s = '!class {a(){}}';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('!function(){function __0__(){}__0__.prototype.a = function(){}return __0__}()');
    });
    it('classexpr extends', function() {
      var s = '!class extends A{}';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('!function(){function __0__(){}!function(){var _=Object.create(A.prototype);_.constructor=__0__;__0__.prototype=_}();Object.keys(A).forEach(function(k){__0__[k]=A[k]});return __0__}()');
    });
    it('classexpr constructor', function() {
      var s = '!class {constructor(){}}';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('!function(){function __0__(){}return __0__}()');
    });
    it('classexpr withname constructor', function() {
      var s = '!class A{constructor(){}}';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('!function(){function A(){}return A}()');
    });
    it('classexpr super', function() {
      var s = '!class extends A{constructor(){super()}}';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('!function(){!function(){var _=Object.create(A.prototype);_.constructor=__0__;__0__.prototype=_}();function __0__(){A.call(this)}Object.keys(A).forEach(function(k){__0__[k]=A[k]});return __0__}()');
    });
  });
  describe('number', function() {
    it('0b binary', function() {
      var s = '0b010';
      var res = Jsdc.parse(s);
      expect(res).to.eql('parseInt("010", 2)');
    });
    it('0B binary', function() {
      var s = '0B101';
      var res = Jsdc.parse(s);
      expect(res).to.eql('parseInt("101", 2)');
    });
    it('0o octonary', function() {
      var s = '0o456';
      var res = Jsdc.parse(s);
      expect(res).to.eql('parseInt("456", 8)');
    });
    it('0O octonary', function() {
      var s = '0o777';
      var res = Jsdc.parse(s);
      expect(res).to.eql('parseInt("777", 8)');
    });
  });
  describe('module', function() {
    before(function() {
      Jsdc.define(true);
    });
    it('module from', function() {
      var s = 'module circle from "a"';
      var res = Jsdc.parse(s);
      expect(res).to.eql('define(function(require,exports,module){var circle=require("a");});');
    });
    it('import string', function() {
      var s = 'import "a"';
      var res = Jsdc.parse(s);
      expect(res).to.eql('define(function(require,exports,module){require("a");});');
    });
    it('import id', function() {
      var s = 'import a from "a"';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('define(function(require,exports,module){var a;!function(){var __0__=require("a");a=__0__.a;}();});');
    });
    it('import multi id', function() {
      var s = 'import a,b from "a"';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('define(function(require,exports,module){var a;var b;!function(){var __0__=require("a");a=__0__.a;b=__0__.b;}();});');
    });
    it('import {}', function() {
      var s = 'import {a,b} from "a"';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('define(function(require,exports,module){var a;var b;!function(){var __0__=require("a");a=__0__.a;b=__0__.b;}();});');
    });
    it('import {} as', function() {
      var s = 'import {a,b as c} from "a"';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('define(function(require,exports,module){var a;var c;!function(){var __0__=require("a");a=__0__.a;c=__0__.b;}();});');
    });
    it('export *', function() {
      var s = 'export * from "a"';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('define(function(require,exports,module){module.exports=require("a");});');
    });
    it('export var', function() {
      var s = 'export var a';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('define(function(require,exports,module){var a;exports.a=a});');
    });
    it('export lexdecl', function() {
      var s = 'export let a = 1';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('define(function(require,exports,module){var a;exports.a=a = 1});');
    });
    it('export function decl', function() {
      var s = 'export function a(){}';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('define(function(require,exports,module){exports.a=a;function a(){}});');
    });
    it('export function decl', function() {
      var s = 'export function a(){}';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('define(function(require,exports,module){exports.a=a;function a(){}});');
    });
    it('export class decl', function() {
      var s = 'export class A{}';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('define(function(require,exports,module){exports.A=A;function A(){}});');
    });
    it('export default', function() {
      var s = 'export default a';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('define(function(require,exports,module){module.exports=a});');
    });
    it('avoid of id __\d__', function() {
      var s = 'import {a as __0__} from "a"';
      Jsdc.reset();
      Jsdc.define(false);
      var res = Jsdc.parse(s);
      expect(res).to.eql('var __0__;!function(){var __1__=require("a");__0__=__1__.a;}();');
    });
    it('set no define', function() {
      var s = 'import {a,b as c} from "a"';
      Jsdc.reset();
      Jsdc.define(false);
      var res = Jsdc.parse(s);
      expect(res).to.eql('var a;var c;!function(){var __0__=require("a");a=__0__.a;c=__0__.b;}();');
    });
  });
  describe('array comprehension', function() {
    it('normal', function() {
      var s = 'var a = [for(k of o)k]';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('var a = function(){var k;var __0__=[];for(k in o){k=o[k];__0__.push(k)}return __0__}()');
    });
    it('with cmphif', function() {
      var s = 'var a = [for(k of o)if(k)k]';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('var a = function(){var k;var __0__=[];for(k in o){k=o[k];if(k)__0__.push(k)}return __0__}()');
    });
    it('multi cmphfor', function() {
      var s = 'var a = [for(a of b)for(c of a)c]';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('var a = function(){var a;var c;var __0__=[];for(a in b){a=b[a];for(c in a){c=a[c];__0__.push(c)}}return __0__}()');
    });
    it('multi cmphfor with cmphif', function() {
      var s = 'var a = [for(a of b)for(c of a)if(c)c]';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('var a = function(){var a;var c;var __0__=[];for(a in b){a=b[a];for(c in a){c=a[c];if(c)__0__.push(c)}}return __0__}()');
    });
    it('multi variable', function() {
      var s = 'var a = [for(k of o)k], b';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('var a = function(){var k;var __0__=[];for(k in o){k=o[k];__0__.push(k)}return __0__}(), b');
    });
  });
  describe('arrow function', function() {
    it('only a assignexpr', function() {
      var s = 'var a = v => v';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('var a = function(v) {return v}');
    });
    it('empty param', function() {
      var s = 'var a = () => 5';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('var a = function() {return 5}');
    });
    it('multi params', function() {
      var s = 'var a = (b, c) => b + c';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('var a = function(b, c) {return b + c}');
    });
    it('with a block', function() {
      var s = 'var a = (b, c) => {return b - c}';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('var a = function(b, c) {return b - c}');
    });
  });
  describe('generator function', function() {
    it('empty', function() {
      var s = 'function *a(){}';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('var a=function(){var __0__=0;return function (){return {next:__1__}};function __1__(){switch(__0__++){case 0:}}}();');
    });
    it('normal', function() {
      var s = 'function *a(){yield 1;}';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('var a=function(){var __0__=0;return function (){return {next:__1__}};function __1__(){switch(__0__++){case 0:return 1;}}}();');
    });
    it('multi yield', function() {
      var s = 'function *a(){yield 1;yield 2}';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('var a=function(){var __0__=0;return function (){return {next:__1__}};function __1__(){switch(__0__++){case 0:return 1;case 1:return 2}}}();');
    });
    it('with var state', function() {
      var s = 'function *a(){var a = 1;yield a++;yield a++}';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('var a=function(){var __0__=0;return function (){return {next:__1__}};var a;function __1__(){switch(__0__++){case 0:a = 1;return a++;case 1:return a++}}}();');
    });
    it('scope in genaretor', function() {
      var s = 'function *a(){{var a}}';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('var a=function(){var __0__=0;return function (){return {next:__1__}};var a;function __1__(){switch(__0__++){case 0:!function(){a}();}}}();');
    });
    it('let scope', function() {
      var s = 'function *a(){{let a}}';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('var a=function(){var __0__=0;return function (){return {next:__1__}};function __1__(){switch(__0__++){case 0:!function(){var a}();}}}();');
    });
    it('ignore fndecl', function() {
      var s = 'function *a(){function a(){}}';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('var a=function(){var __0__=0;return function (){return {next:__1__}};function __1__(){switch(__0__++){case 0:function a(){}}}}();');
    });
  });
  describe('destructor', function() {
    it('single in array', function() {
      var s = 'var [a] = o';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('var a;!function(){var __0__= o;a=__0__[0];}()');
    });
    it('multi in array', function() {
      var s = 'var [a,b] = o';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('var b;var a;!function(){var __0__= o;a=__0__[0];b=__0__[1];}()');
    });
    it('comma placeholder in array', function() {
      var s = 'var [a,,b] = o';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('var b;var a;!function(){var __0__= o;a=__0__[0];b=__0__[2];}()');
    });
    it('single in object', function() {
      var s = 'var {a} = o';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('var a;!function(){var __0__= o;a=__0__["a"];}()');
    });
    it('multi in object', function() {
      var s = 'var {a,b} = o';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('var b;var a;!function(){var __0__= o;a=__0__["a"];b=__0__["b"];}()');
    });
    it('alias in object', function() {
      var s = 'var {a,b:c} = o';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('var a;!function(){var __0__= o;a=__0__["a"];c=__0__["b"];}()');
    });
    it('array in array', function() {
      var s = 'var [a,[b]] = o';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('var b;var a;!function(){var __0__= o;a=__0__[0];var __1__=__0__[1];b=__1__[0];}()');
    });
    it('object in array', function() {
      var s = 'var [a,{b}] = o';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('var b;var a;!function(){var __0__= o;a=__0__[0];var __1__=__0__[1];b=__1__["b"];}()');
    });
    it('array in object', function() {
      var s = 'var {a,b:[c]} = o';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('var c;var a;!function(){var __0__= o;a=__0__["a"];var __1__=__0__["b"];c=__1__[0];}()');
    });
    it('object in object', function() {
      var s = 'var {a,b:{c}} = o';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('var c;var a;!function(){var __0__= o;a=__0__["a"];var __1__=__0__["b"];c=__1__["c"];}()');
    });
    it('assingexpr single in array', function() {
      var s = '[a] = o';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('!function(){var __0__= o;a=__0__[0];}()');
    });
    it('assingexpr multi in array', function() {
      var s = '[a,b] = o';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('!function(){var __0__= o;a=__0__[0];b=__0__[1];}()');
    });
    it('assingexpr comma placeholder in array', function() {
      var s = '[a,,b] = o';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('!function(){var __0__= o;a=__0__[0];b=__0__[2];}()');
    });
    it('assingexpr single in object', function() {
      var s = '({a} = o)';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('(!function(){var __0__= o;a=__0__["a"];}())');
    });
    it('assingexpr multi in object', function() {
      var s = '({a,b} = o)';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('(!function(){var __0__= o;a=__0__["a"];b=__0__["b"];}())');
    });
    it('assingexpr alias in object', function() {
      var s = '({a,b:c} = o)';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('(!function(){var __0__= o;a=__0__["a"];c=__0__["b"];}())');
    });
    it('assingexpr array in array', function() {
      var s = '([a,[b]] = o)';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('(!function(){var __0__= o;a=__0__[0];var __1__=__0__[1];b=__1__[0];}())');
    });
    it('assingexpr object in array', function() {
      var s = '([a,{b}] = o)';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('(!function(){var __0__= o;a=__0__[0];var __1__=__0__[1];b=__1__["b"];}())');
    });
    it('assingexpr array in object', function() {
      var s = '({a,b:[c]} = o)';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('(!function(){var __0__= o;a=__0__["a"];var __1__=__0__["b"];c=__1__[0];}())');
    });
    it('assingexpr object in object', function() {
      var s = '({a,b:{c}} = o)';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('(!function(){var __0__= o;a=__0__["a"];var __1__=__0__["b"];c=__1__["c"];}())');
    });
  });
});