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
    expect(jsdc.ast()).to.be.a(Object);
  });
  it('#tokens', function() {
    var jsdc = new Jsdc();
    expect(jsdc.tokens).to.be.a(Function);
    expect(jsdc.tokens()).to.be.a(Array);
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
    Jsdc.parse('');
    expect(Jsdc.ast).to.be.a(Function);
    expect(Jsdc.ast()).to.be.a(Object);
  });
  it('static #tokens', function() {
    Jsdc.parse('');
    expect(Jsdc.tokens).to.be.a(Function);
    expect(Jsdc.tokens()).to.be.a(Array);
  });
  it('syntax error', function() {
    expect(Jsdc.parse('var')).to.eql('Error: SyntaxError: missing variable name line 1 col 4');
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
      expect(res).to.eql('!function(){var b;}();');
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
      expect(res).to.eql('!function(){function a(){}}();');
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
      expect(res).to.eql('var a;!function(){a;function a(){}}();');
    });
    it('block with classdecl', function() {
      var s = '{class A{}}';
      var res = Jsdc.parse(s);
      expect(res).to.eql('!function(){function A(){}}();');
    });
    it('block with classdecl and varstmt', function() {
      var s = '{class A{}var a = 1}';
      var res = Jsdc.parse(s);
      expect(res).to.eql('var a;!function(){function A(){}a = 1}();');
    });
    it('if with classdecl and varstmt', function() {
      var s = 'if(true){class A{}var a = 1}';
      var res = Jsdc.parse(s);
      expect(res).to.eql('var a;if(true){!function(){function A(){}a = 1}();}');
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
      expect(res).to.eql('!function(){var a}();');
    });
    it('function in block', function() {
      var s = '{function a(){}}';
      var res = Jsdc.parse(s);
      expect(res).to.eql('!function(){function a(){}}();');
    });
    it('function in ifstmt', function() {
      var s = 'if(true){function a(){}}';
      var res = Jsdc.parse(s);
      expect(res).to.eql('if(true){!function(){function a(){}}();}');
    });
  });
  describe('init params', function() {
    it('only one id', function() {
      var s = 'function a(b = 1){}';
      var res = Jsdc.parse(s);
      expect(res).to.eql('function a(b ){if(b===void 0)b=1;}');
    });
    it('after an id', function() {
      var s = 'function a(b, c = fn()){}';
      var res = Jsdc.parse(s);
      expect(res).to.eql('function a(b, c ){if(c===void 0)c=fn();}');
    });
    it('multi', function() {
      var s = 'function a(b = 1, c = []){}';
      var res = Jsdc.parse(s);
      expect(res).to.eql('function a(b , c ){if(b===void 0)b=1;if(c===void 0)c=[];}');
    });
    it('cross line', function() {
      var s = 'function a(b = function() {var c = 1\n}) {}';
      var res = Jsdc.parse(s);
      expect(res).to.eql('function a(b \n) {if(b===void 0)b=function(){var c=1};}');
    });
  });
  describe('rest params', function() {
    it('fmparams', function() {
      var s = 'function a(...b){}';
      var res = Jsdc.parse(s);
      expect(res).to.eql('function a(b){b=[].slice.call(arguments, 0);}');
    });
    it('callexpr single spread', function() {
      var s = 'Math.max(...a)';
      var res = Jsdc.parse(s);
      expect(res).to.eql('Math.max.apply(Math, [].concat(a))');
    });
    it('callexpr mult spread', function() {
      var s = 'Math.max(a, ...b)';
      var res = Jsdc.parse(s);
      expect(res).to.eql('Math.max.apply(Math, [a].concat(b))');
    });
    it('callexpr with prmrexpr', function() {
      var s = 'fn(a, b, ...c)';
      var res = Jsdc.parse(s);
      expect(res).to.eql('fn.apply(this, [a,b].concat(c))');
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
      var s = 'for(a of o){}';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('for(a =o.next();!a.done;a=o.next()){a=a.value;}');
    });
    it('without blockstmt', function() {
      var s = 'for(a of b);';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('for(a =b.next();!a.done;a=b.next()){a=a.value;;}');
    });
    it('without blockstmt and append comment', function() {
      var s = 'for(a of b);//';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('for(a =b.next();!a.done;a=b.next()){a=a.value;;}//');
    });
    it('without blockstmt and append mulit comment', function() {
      var s = 'for(a of b);/**/\n//\n';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('for(a =b.next();!a.done;a=b.next()){a=a.value;;}/**/\n//\n');
    });
    it('varstmt', function() {
      var s = 'for(var a of {}){a}';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('for(var a ={}.next();!a.done;a={}.next()){a=a.value;a}');
    });
    it('varstmt without blockstmt', function() {
      var s = 'for(var a of {})a';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('for(var a ={}.next();!a.done;a={}.next()){a=a.value;a}');
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
    it('super call property', function() {
      var s = 'class A extends B{constructor(){super.a}}';
      var res = Jsdc.parse(s);
      expect(res).to.eql('!function(){var _=Object.create(B.prototype);_.constructor=A;A.prototype=_}();function A(){B.prototype.a}Object.keys(B).forEach(function(k){A[k]=B[k]});');
    });
    it('super call method with argments', function() {
      var s = 'class A extends B{constructor(){super.a(1)}}';
      var res = Jsdc.parse(s);
      expect(res).to.eql('!function(){var _=Object.create(B.prototype);_.constructor=A;A.prototype=_}();function A(){B.prototype.a.call(this,1)}Object.keys(B).forEach(function(k){A[k]=B[k]});');
    });
    it('getter/setter', function() {
      var s = 'class A{get b(){}set c(d){}}';
      var res = Jsdc.parse(s);
      expect(res).to.eql('function A(){}Object.defineProperty(A.prototype, "b", {get :function(){}});Object.defineProperty(A.prototype, "c", {set :function(d){}});');
    });
    it('static', function() {
      var s = 'class A extends B{\nstatic F(){super.b()}\n}';
      var res = Jsdc.parse(s);
      expect(res).to.eql('function A(){B.call(this)}!function(){var _=Object.create(B.prototype);_.constructor=A;A.prototype=_}();\nA.F=function(){B.prototype.b.call(this)}\nObject.keys(B).forEach(function(k){A[k]=B[k]});');
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
      expect(res).to.eql('!function(){function _0_(){}return _0_}()');
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
      expect(res).to.eql('!function(){function _0_(){}_0_.prototype.a = function(){}return _0_}()');
    });
    it('classexpr extends', function() {
      var s = '!class extends A{}';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('!function(){function _0_(){A.call(this)}!function(){var _=Object.create(A.prototype);_.constructor=_0_;_0_.prototype=_}();Object.keys(A).forEach(function(k){_0_[k]=A[k]});return _0_}()');
    });
    it('classexpr constructor', function() {
      var s = '!class {constructor(){}}';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('!function(){function _0_(){}return _0_}()');
    });
    it('classexpr withname constructor', function() {
      var s = '!class A{constructor(){}}';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('!function(){function A(){}return A}()');
    });
    it('classexpr super', function() {
      var s = '!class A extends B{constructor(){super()}}';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('!function(){!function(){var _=Object.create(B.prototype);_.constructor=A;A.prototype=_}();extends Bfunction A(){B.call(this)}Object.keys(B).forEach(function(k){A[k]=B[k]});return A}()');
    });
    it('classexpr super', function() {
      var s = '!class A extends B{constructor(){super()}}';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('!function(){!function(){var _=Object.create(B.prototype);_.constructor=A;A.prototype=_}();extends Bfunction A(){B.call(this)}Object.keys(B).forEach(function(k){A[k]=B[k]});return A}()');
    });
    it('classexpr extends', function() {
      var s = '!class extends A{}';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('!function(){function _0_(){A.call(this)}!function(){var _=Object.create(A.prototype);_.constructor=_0_;_0_.prototype=_}();Object.keys(A).forEach(function(k){_0_[k]=A[k]});return _0_}()');
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
      expect(res).to.eql('define(function(require,exports,module){var a;!function(){var _0_=require("a");a=_0_.a;}();});');
    });
    it('import multi id', function() {
      var s = 'import a,b from "a"';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('define(function(require,exports,module){var a;var b;!function(){var _0_=require("a");a=_0_.a;b=_0_.b;}();});');
    });
    it('import {}', function() {
      var s = 'import {a,b} from "a"';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('define(function(require,exports,module){var a;var b;!function(){var _0_=require("a");a=_0_.a;b=_0_.b;}();});');
    });
    it('import {} as', function() {
      var s = 'import {a,b as c} from "a"';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('define(function(require,exports,module){var a;var c;!function(){var _0_=require("a");a=_0_.a;c=_0_.b;}();});');
    });
    it('export *', function() {
      var s = 'export * from "a"';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('define(function(require,exports,module){!function(){var _0_=require("a");Object.keys(_0_).forEach(function(k){module.exports[k]=_0_[k];});}();});');
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
      var s = 'import {a as _0_} from "a"';
      Jsdc.reset();
      Jsdc.define(false);
      var res = Jsdc.parse(s);
      expect(res).to.eql('var _0_;!function(){var _1_=require("a");_0_=_1_.a;}();');
    });
    it('set no define', function() {
      var s = 'import {a,b as c} from "a"';
      Jsdc.reset();
      Jsdc.define(false);
      var res = Jsdc.parse(s);
      expect(res).to.eql('var a;var c;!function(){var _0_=require("a");a=_0_.a;c=_0_.b;}();');
    });
    it('insert define before blank but not comment', function() {
      var s = '/**/\n//\n\nexport default a';
      Jsdc.reset();
      Jsdc.define(true);
      var res = Jsdc.parse(s);
      expect(res).to.eql('/**/\n//\ndefine(function(require,exports,module){\nmodule.exports=a});');
    });
  });
  describe('array comprehension', function() {
    it('normal', function() {
      var s = 'var a = [for(k of o)k]';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('var a = function(){var k;var _0_=[];for(k in o){k=o[k];_0_.push(k)}return _0_}()');
    });
    it('with cmphif', function() {
      var s = 'var a = [for(k of o)if(k)k]';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('var a = function(){var k;var _0_=[];for(k in o){k=o[k];if(k)_0_.push(k)}return _0_}()');
    });
    it('multi cmphfor', function() {
      var s = 'var a = [for(a of b)for(c of a)c]';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('var a = function(){var a;var c;var _0_=[];for(a in b){a=b[a];for(c in a){c=a[c];_0_.push(c)}}return _0_}()');
    });
    it('multi cmphfor with cmphif', function() {
      var s = 'var a = [for(a of b)for(c of a)if(c)c]';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('var a = function(){var a;var c;var _0_=[];for(a in b){a=b[a];for(c in a){c=a[c];if(c)_0_.push(c)}}return _0_}()');
    });
    it('multi variable', function() {
      var s = 'var a = [for(k of o)k], b';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('var a = function(){var k;var _0_=[];for(k in o){k=o[k];_0_.push(k)}return _0_}(), b');
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
      expect(res).to.eql('var a=function(){var _0_=0;return function(){return{next:_1_}};function _1_(){return{done:true}}}();');
    });
    it('normal', function() {
      var s = 'function *a(){yield 1}';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('var a=function(){var _0_=0;return function(){return{next:_1_}};function _1_(_2_){while(1){switch(_0_){case 0:_0_=1;return{value:1,done:true};case 1:_0_=-1;default:return{done:true}}}}}();');
    });
    it('multi yield', function() {
      var s = 'function *a(){yield 1;yield 2}';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('var a=function(){var _0_=0;return function(){return{next:_1_}};function _1_(_2_){while(1){switch(_0_){case 0:_0_=1;return{value:1,done:false};case 1:_0_=2;return{value:2,done:true};case 2:_0_=-1;default:return{done:true}}}}}();');
    });
    it('with var state', function() {
      var s = 'function *a(){var a = 1;yield a++;yield a++}';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('var a=function(){var _0_=0;return function(){return{next:_1_}};var a;function _1_(_2_){while(1){switch(_0_){case 0:a = 1;_0_=1;return{value:a++,done:false};case 1:_0_=2;return{value:a++,done:true};case 2:_0_=-1;default:return{done:true}}}}}();');
    });
    it('scope in genaretor', function() {
      var s = 'function *a(){{var a}}';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('var a=function(){var _0_=0;return function(){return{next:_1_}};var a;function _1_(){!function(){a}();return{done:true}}}();');
    });
    it('let scope', function() {
      var s = 'function *a(){{let a}}';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('var a=function(){var _0_=0;return function(){return{next:_1_}};function _1_(){!function(){var a}();return{done:true}}}();');
    });
    it('ignore fndecl', function() {
      var s = 'function *a(){function a(){}}';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('var a=function(){var _0_=0;return function(){return{next:_1_}};function _1_(){function a(){}return{done:true}}}();');
    });
    it('in block', function() {
      var s = '{function *a(){}}';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('!function(){var a=function(){var _0_=0;return function(){return{next:_1_}};function _1_(){return{done:true}}}();}();');
    });
    it('yield a generator', function() {
      var s = 'function *a(){yield * b}';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('var a=function(){var _0_=0;return function(){return{next:_1_}};function _1_(_2_){while(1){switch(_0_){case 0:_0_=1;var _3_=b.next();return{done:(!_3_.done&&_0_--),value:_3_};case 1:_0_=-1;default:return{done:true}}}}}();');
    });
    it('generator expr', function() {
      var s = '~function *(){}';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('~function(){var _0_=0;return function(){return{next:_1_}};function _1_(){}}()');
    });
    it('generator expr with name', function() {
      var s = '~function * a(){}';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('~function(){var _0_=0;return function(){return{next:_1_}};function _1_(){}}()');
    });
    it('in ifstmt', function() {
      var s = 'function *a(){if(true){yield 1}}';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('var a=function(){var _0_=0;return function(){return{next:_1_}};function _1_(_2_){while(1){switch(_0_){case 0:_0_=true?1:2;break;case 1:_0_=3;return{value:1,done:false};case 3:_0_=2;break;case 2:_0_=-1;default:return{done:true}}}}}();');
    });
    it('in ifstmt no {}', function() {
      var s = 'function *a(){if(true)yield 1}';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('var a=function(){var _0_=0;return function(){return{next:_1_}};function _1_(_2_){while(1){switch(_0_){case 0:_0_=true?1:2;break;case 1:_0_=3;return{value:1,done:false};case 3:_0_=2;break;case 2:_0_=-1;default:return{done:true}}}}}();');
    });
    it('in ifstmt else', function() {
      var s = 'function *a(){if(true)yield 1;else{yield 2}}';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('var a=function(){var _0_=0;return function(){return{next:_1_}};function _1_(_2_){while(1){switch(_0_){case 0:_0_=true?1:2;break;case 1:_0_=4;return{value:1,done:false};case 4:_0_=3;break;case 2:_0_=5;return{value:2,done:false};case 5:case 3:_0_=-1;default:return{done:true}}}}}();');
    });
    it('in ifstmt else no {}', function() {
      var s = 'function *a(){if(true)yield 1;else yield 2}';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('var a=function(){var _0_=0;return function(){return{next:_1_}};function _1_(_2_){while(1){switch(_0_){case 0:_0_=true?1:2;break;case 1:_0_=4;return{value:1,done:false};case 4:_0_=3;break;case 2:_0_=5;return{value:2,done:false};case 5:case 3:_0_=-1;default:return{done:true}}}}}();');
    });
    it('in ifstmt elseif', function() {
      var s = 'function *a(){if(true)yield 1;else if(false)yield 2}';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('var a=function(){var _0_=0;return function(){return{next:_1_}};function _1_(_2_){while(1){switch(_0_){case 0:_0_=true?1:2;break;case 1:_0_=4;return{value:1,done:false};case 4:_0_=3;break;case 2:_0_=false?5:6;break;case 5:_0_=7;return{value:2,done:false};case 7:_0_=6;break;case 6:case 3:_0_=-1;default:return{done:true}}}}}();');
    });
    it('in ifstmt elseif no {}', function() {
      var s = 'function *a(){if(true)yield 1;else if(false){yield 2}}';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('var a=function(){var _0_=0;return function(){return{next:_1_}};function _1_(_2_){while(1){switch(_0_){case 0:_0_=true?1:2;break;case 1:_0_=4;return{value:1,done:false};case 4:_0_=3;break;case 2:_0_=false?5:6;break;case 5:_0_=7;return{value:2,done:false};case 7:_0_=6;break;case 6:case 3:_0_=-1;default:return{done:true}}}}}();');
    });
    it('in ifstmt elseif else', function() {
      var s = 'function *a(){if(true)yield 1;else if(false)yield 2;else yield 3}';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('var a=function(){var _0_=0;return function(){return{next:_1_}};function _1_(_2_){while(1){switch(_0_){case 0:_0_=true?1:2;break;case 1:_0_=4;return{value:1,done:false};case 4:_0_=3;break;case 2:_0_=false?5:6;break;case 5:_0_=8;return{value:2,done:false};case 8:_0_=7;break;case 6:_0_=9;return{value:3,done:false};case 9:case 7:case 3:_0_=-1;default:return{done:true}}}}}();');
    });
    it('in whilestmt', function() {
      var s = 'function *a(){while(i++<5){yield i}}';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('var a=function(){var _0_=0;return function(){return{next:_1_}};function _1_(_3_){while(1){switch(_0_){case 0:var _2_;case 1:_0_=(_2_=i++<5)?2:3;break;case 2:_0_=4;return{value:i,done:_2_&&1};case 4:_0_=1;break;case 3:_0_=-1;default:return{done:true}}}}}();');
    });
    it('in whilestmt no {}', function() {
      var s = 'function *a(){while(i++<5)yield i}';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('var a=function(){var _0_=0;return function(){return{next:_1_}};function _1_(_3_){while(1){switch(_0_){case 0:var _2_;case 1:_0_=(_2_=i++<5)?2:3;break;case 2:_0_=4;return{value:i,done:_2_&&1};case 4:_0_=1;break;case 3:_0_=-1;default:return{done:true}}}}}();');
    });
    it('in dowhilestmt', function() {
      var s = 'function *a(){do{yield i}while(i++<5)}';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('var a=function(){var _0_=0;return function(){return{next:_1_}};function _1_(_3_){while(1){switch(_0_){case 0:var _2_;case 1:_0_=3;return{value:i,done:_2_&&1};case 3:_0_=2;break;case 2:_0_=(_2_=i++<5)?1:4;break;case 4:_0_=-1;default:return{done:true}}}}}();');
    });
    it('in dowhilestmt no {}', function() {
      var s = 'function *a(){do yield i;while(i++<5)}';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('var a=function(){var _0_=0;return function(){return{next:_1_}};function _1_(_3_){while(1){switch(_0_){case 0:var _2_;case 1:_0_=3;return{value:i,done:_2_&&1};case 3:_0_=2;break;case 2:_0_=(_2_=i++<5)?1:4;break;case 4:_0_=-1;default:return{done:true}}}}}();');
    });
    it('in forstmt', function() {
      var s = 'function *a(){for(var i = 0; i < 5; i++){yield i}}';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('var a=function(){var _0_=0;return function(){return{next:_1_}};var i;function _1_(_2_){while(1){switch(_0_){case 0:i = 0; case 1:_0_=i < 5?2:3;break; case 4:i++;_0_=1;break;case 2:_0_=5;return{value:i,done:i<5&&1};case 5:_0_=4;break;case 3:_0_=-1;default:return{done:true}}}}}();');
    });
    it('in forstmt no {}', function() {
      var s = 'function *a(){for(var i = 0; i < 5; i++)yield i}';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('var a=function(){var _0_=0;return function(){return{next:_1_}};var i;function _1_(_2_){while(1){switch(_0_){case 0:i = 0; case 1:_0_=i < 5?2:3;break; case 4:i++;_0_=1;break;case 2:_0_=5;return{value:i,done:i<5&&1};case 5:_0_=4;break;case 3:_0_=-1;default:return{done:true}}}}}();');
    });
    it('in forinstmt', function() {
      var s = 'function *a(){for(var i in o){yield i}}';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('var a=function(){var _0_=0;return function(){return{next:_1_}};var i;function _1_(_6_){while(1){switch(_0_){case 0:var _5_=o,_2_=Object.keys(_5_),_3_=_2_.length,_4_=0;case 1:_0_=_4_++<_3_?2:3;break;case 2:i=_2_[_4_];_0_=4;return{value:i,done:_4_<_3_&&1};case 4:_0_=1;break;case 3:_0_=-1;default:return{done:true}}}}}();');
    });
    it('in forinstmt no {}', function() {
      var s = 'function *a(){for(var i in o)yield i}';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('var a=function(){var _0_=0;return function(){return{next:_1_}};var i;function _1_(_6_){while(1){switch(_0_){case 0:var _5_=o,_2_=Object.keys(_5_),_3_=_2_.length,_4_=0;case 1:_0_=_4_++<_3_?2:3;break;case 2:i=_2_[_4_];_0_=4;return{value:i,done:_4_<_3_&&1};case 4:_0_=1;break;case 3:_0_=-1;default:return{done:true}}}}}();');
    });
    it('in forofstmt', function() {
      var s = 'function *a(){for(var i of o){yield i}}';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('var a=function(){var _0_=0;return function(){return{next:_1_}};var i;function _1_(_4_){while(1){switch(_0_){case 0:var _3_=o,_2_=_3_.next();case 1:_0_=_2_.done?3:4;break;case 2:_2_=_3_.next();_0_=1;break;case 3:i=_2_.value;_0_=5;return{value:i,done:_2_.done&&1};case 5:_0_=1;break;case 4:_0_=-1;default:return{done:true}}}}}();');
    });
    it('in forofstmt no {}', function() {
      var s = 'function *a(){for(var i of o)yield i}';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('var a=function(){var _0_=0;return function(){return{next:_1_}};var i;function _1_(_4_){while(1){switch(_0_){case 0:var _3_=o,_2_=_3_.next();case 1:_0_=_2_.done?3:4;break;case 2:_2_=_3_.next();_0_=1;break;case 3:i=_2_.value;_0_=5;return{value:i,done:_2_.done&&1};case 5:_0_=1;break;case 4:_0_=-1;default:return{done:true}}}}}();');
    });
    it('with param id', function() {
      var s = 'function *a(b){var c=yield}';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('var a=function(){var _0_=0;return function(){return{next:_1_}};var c;function _1_(b){while(1){switch(_0_){case 0:_0_=1;return{value:,done:true};case 1:c=b;_0_=-1;default:return{done:true}}}}}();');
    });
    it('with param rest', function() {
      var s = 'function *a(...b){var c=yield}';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('var a=function(){var _0_=0;return function(){return{next:_1_}};var c;function _1_(b){b=[].slice.call(arguments, 0);while(1){switch(_0_){case 0:_0_=1;return{value:,done:true};case 1:c=b[0];_0_=-1;default:return{done:true}}}}}();');
    });
    it('with assignexpr', function() {
      var s = 'function *a(...b){c=yield}';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('var a=function(){var _0_=0;return function(){return{next:_1_}};function _1_(b){b=[].slice.call(arguments, 0);while(1){switch(_0_){case 0:_0_=1;return{value:,done:true};case 1:c=b[0];_0_=-1;default:return{done:true}}}}}();');
    });
    it('with return', function() {
      var s = 'function *a(...b){c\nreturn}';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('var a=function(){var _0_=0;return function(){return{next:_1_}};function _1_(b){b=[].slice.call(arguments, 0);c;_0_=-1;default:\nreturn{value:,done:true}}}();');
    });
    it('with return result', function() {
      var s = 'function *a(...b){c;return c}';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('var a=function(){var _0_=0;return function(){return{next:_1_}};function _1_(b){b=[].slice.call(arguments, 0);c;;_0_=-1;default:return {value:c,done:true}}}();');
    });
  });
  describe('destructor', function() {
    it('single in array', function() {
      var s = 'var [a] = o';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('var a;!function(){var _0_= o;a=_0_[0]}()');
    });
    it('multi in array', function() {
      var s = 'var [a,b] = o';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('var b;var a;!function(){var _0_= o;a=_0_[0];b=_0_[1]}()');
    });
    it('comma placeholder in array', function() {
      var s = 'var [a,,b] = o';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('var b;var a;!function(){var _0_= o;a=_0_[0];b=_0_[2]}()');
    });
    it('multi var in array', function() {
      var s = 'var [a] = [b] = o';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('var a;!function(){var _0_= o;b=_0_[0];a=_0_[0]}()');
    });
    it('single in object', function() {
      var s = 'var {a} = o';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('var a;!function(){var _0_= o;a=_0_["a"]}()');
    });
    it('multi in object', function() {
      var s = 'var {a,b} = o';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('var b;var a;!function(){var _0_= o;a=_0_["a"];b=_0_["b"]}()');
    });
    it('alias in object', function() {
      var s = 'var {a,b:c} = o';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('var c;var a;!function(){var _0_= o;a=_0_["a"];c=_0_["b"]}()');
    });
    it('multi var in object', function() {
      var s = 'var {a} = {b} = o';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('var a;!function(){var _0_= o;b=_0_["b"];a=_0_["a"]}()');
    });
    it('array in array', function() {
      var s = 'var [a,[b]] = o';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('var b;var a;!function(){var _0_= o;a=_0_[0];var _1_=_0_[1];b=_1_[0]}()');
    });
    it('array in array 2', function() {
      var s = 'var [a,[b,[c]]] = o';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('var c;var b;var a;!function(){var _0_= o;a=_0_[0];var _1_=_0_[1];b=_1_[0];var _2_=_1_[1];c=_2_[0]}()');
    });
    it('object in array', function() {
      var s = 'var [a,{b}] = o';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('var b;var a;!function(){var _0_= o;a=_0_[0];var _1_=_0_[1];b=_1_["b"]}()');
    });
    it('array in object', function() {
      var s = 'var {a,b:[c]} = o';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('var c;var a;!function(){var _0_= o;a=_0_["a"];var _1_=_0_["b"];c=_1_[0]}()');
    });
    it('object in object', function() {
      var s = 'var {a,b:{c}} = o';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('var c;var a;!function(){var _0_= o;a=_0_["a"];var _1_=_0_["b"];c=_1_["c"]}()');
    });
    it('object in object 2', function() {
      var s = 'var {a,b:{c:{d}}} = o';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('var d;var a;!function(){var _0_= o;a=_0_["a"];var _1_=_0_["b"];var _2_=_1_["c"];d=_2_["d"]}()');
    });
    it('object in object 3', function() {
      var s = 'var {a,b:{c:d}} = o';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('var d;var a;!function(){var _0_= o;a=_0_["a"];var _1_=_0_["b"];d=_1_["c"]}()');
    });
    it('assingexpr single in array', function() {
      var s = '[a] = o';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('function(){var _0_= o;a=_0_[0];return _0_}()');
    });
    it('assingexpr multi in array', function() {
      var s = '[a,b] = o';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('function(){var _0_= o;a=_0_[0];b=_0_[1];return _0_}()');
    });
    it('multi assingexpr in array', function() {
      var s = '[a] = [b] = o';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('function(){var _0_= o;b=_0_[0];a=_0_[0];return _0_}()');
    });
    it('multi assingexpr multi in array', function() {
      var s = '[a,b] = [c,d] = o';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('function(){var _0_= o;c=_0_[0];d=_0_[1];a=_0_[0];b=_0_[1];return _0_}()');
    });
    it('assingexpr comma placeholder in array', function() {
      var s = '[a,,b] = o';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('function(){var _0_= o;a=_0_[0];b=_0_[2];return _0_}()');
    });
    it('assingexpr single in object', function() {
      var s = '({a} = o)';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('(function(){var _0_= o;a=_0_["a"];return _0_}())');
    });
    it('assingexpr multi in object', function() {
      var s = '({a,b} = o)';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('(function(){var _0_= o;a=_0_["a"];b=_0_["b"];return _0_}())');
    });
    it('multi assingexpr in object', function() {
      var s = '({a} = {b} = o)';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('(function(){var _0_= o;b=_0_["b"];a=_0_["a"];return _0_}())');
    });
    it('multi assingexpr multi in object', function() {
      var s = '({a,b} = {c,d} = o)';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('(function(){var _0_= o;c=_0_["c"];d=_0_["d"];a=_0_["a"];b=_0_["b"];return _0_}())');
    });
    it('assingexpr alias in object', function() {
      var s = '({a,b:c} = o)';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('(function(){var _0_= o;a=_0_["a"];c=_0_["b"];return _0_}())');
    });
    it('assingexpr array in array', function() {
      var s = '([a,[b]] = o)';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('(function(){var _0_= o;a=_0_[0];var _1_=_0_[1];b=_1_[0];return _0_}())');
    });
    it('assingexpr object in array', function() {
      var s = '([a,{b}] = o)';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('(function(){var _0_= o;a=_0_[0];var _1_=_0_[1];b=_1_["b"];return _0_}())');
    });
    it('assingexpr array in object', function() {
      var s = '({a,b:[c]} = o)';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('(function(){var _0_= o;a=_0_["a"];var _1_=_0_["b"];c=_1_[0];return _0_}())');
    });
    it('assingexpr object in object', function() {
      var s = '({a,b:{c}} = o)';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('(function(){var _0_= o;a=_0_["a"];var _1_=_0_["b"];c=_1_["c"];return _0_}())');
    });
    it('init array', function() {
      var s = 'var [a=1] = o';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('var a;!function(){var _0_= o;a=_0_[0];if(_0_.indexOf(a)!=0)a=1}()');
    });
    it('init object', function() {
      var s = 'var {x=1} = o';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('var x;!function(){var _0_= o;x=_0_["x"];if(!_0_.hasOwnProperty("x"))x=1}()');
    });
    it('init array in array', function() {
      var s = 'var [a,[b=1]] = o';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('var b;var a;!function(){var _0_= o;a=_0_[0];var _1_=_0_[1];b=_1_[0];if(_1_.indexOf(b)!=0)b=1}()');
    });
    it('init object in array', function() {
      var s = 'var [a,{b=1}] = o';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('var b;var a;!function(){var _0_= o;a=_0_[0];var _1_=_0_[1];b=_1_["b"];if(!_1_.hasOwnProperty("b"))b=1}()');
    });
    it('init array in object', function() {
      var s = 'var {x,y:[z=1]} = o';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('var z;var x;!function(){var _0_= o;x=_0_["x"];var _1_=_0_["y"];z=_1_[0];if(_1_.indexOf(z)!=0)z=1}()');
    });
    it('init object in object', function() {
      var s = 'var {x,y:{z=1}} = o';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('var z;var x;!function(){var _0_= o;x=_0_["x"];var _1_=_0_["y"];z=_1_["z"];if(!_1_.hasOwnProperty("z"))z=1}()');
    });
    it('assingexpr init array', function() {
      var s = '[a=1] = o';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('function(){var _0_= o;a=_0_[0];if(_0_.indexOf(a)!=0)a=1;return _0_}()');
    });
    it('assingexpr init object', function() {
      var s = '({x=1} = o)';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('(function(){var _0_= o;x=_0_["x"];if(!_0_.hasOwnProperty("x"))x=1;return _0_}())');
    });
    it('assingexpr init array in array', function() {
      var s = '[a,[b=1]] = o';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('function(){var _0_= o;a=_0_[0];var _1_=_0_[1];b=_1_[0];if(_1_.indexOf(b)!=0)b=1;return _0_}()');
    });
    it('assingexpr init object in array', function() {
      var s = '[a,{b=1}] = o';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('function(){var _0_= o;a=_0_[0];var _1_=_0_[1];b=_1_["b"];if(!_1_.hasOwnProperty("b"))b=1;return _0_}()');
    });
    it('assingexpr init array in object', function() {
      var s = '({x,y:[z=1]} = o)';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('(function(){var _0_= o;x=_0_["x"];var _1_=_0_["y"];z=_1_[0];if(_1_.indexOf(z)!=0)z=1;return _0_}())');
    });
    it('assingexpr init object in object', function() {
      var s = '({x,y:{z=1}} = o)';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('(function(){var _0_= o;x=_0_["x"];var _1_=_0_["y"];z=_1_["z"];if(!_1_.hasOwnProperty("z"))z=1;return _0_}())');
    });
    it('assingexpr init object in object in object', function() {
      var s = '({x,y:{m:{n},o:p}} = o)';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('(function(){var _0_= o;x=_0_["x"];var _1_=_0_["y"];var _2_=_1_["m"];n=_2_["n"];p=_1_["o"];return _0_}())');
    });
    it('varstmt arr destruct first start with id', function() {
      var s = 'var a = [b] = [c] = e = o';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('var a = function(){var _0_= e = o;c=_0_[0];b=_0_[0];return _0_}()');
    });
    it('varstmt obj destruct first start with id', function() {
      var s = 'var a = {b} = {c} = e = o';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('var a = function(){var _0_= e = o;c=_0_["c"];b=_0_["b"];return _0_}()');
    });
    it('array var rest', function() {
      var s = 'var [a, ...b] = o';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('var b;var a;!function(){var _0_= o;a=_0_[0];b=_0_.slice(1)}()');
    });
    it('array in array var rest', function() {
      var s = 'var [a, [b, ...c]] = o';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('var c;var b;var a;!function(){var _0_= o;a=_0_[0];var _1_=_0_[1];b=_1_[0];c=_1_.slice(1)}()');
    });
    it('array expr spread', function() {
      var s = '[a, ...b] = o';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('function(){var _0_= o;a=_0_[0];b=_0_.slice(1);return _0_}()');
    });
    it('array in array expr spread', function() {
      var s = '[a, [b, ...c]] = o';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('function(){var _0_= o;a=_0_[0];var _1_=_0_[1];b=_1_[0];c=_1_.slice(1);return _0_}()');
    });
    it('array in array in array expr spread', function() {
      var s = '[a, [b, [...c]]] = o';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('function(){var _0_= o;a=_0_[0];var _1_=_0_[1];b=_1_[0];var _2_=_1_[1];c=_2_.slice(0);return _0_}()');
    });
    it('var id,destruct', function() {
      var s = 'var a,[b]=1';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('var b;var a;!function(){var _0_=1;b=_0_[0]}()');
    });
    it('var id,destruct,id', function() {
      var s = 'var a,[b]=[1],c';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('var b;var a;!function(){var _0_=[1];b=_0_[0]}();var c');
    });
    it('var id,destruct,destruct', function() {
      var s = 'var a,[b]=[1],[c]=[2]';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('var c;var b;var a;!function(){var _0_=[1];b=_0_[0]}();!function(){var _1_=[2];c=_1_[0]}()');
    });
    it('var destruct,destruct,id', function() {
      var s = 'var [a]=[0],[b]=[1],c';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('var b;var a;!function(){var _0_=[0];a=_0_[0]}();!function(){var _1_=[1];b=_1_[0]}();var c');
    });
    it('alias obj', function() {
      var s = 'var {x:y=1} = o';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('var y;!function(){var _0_= o;y=_0_["x"];if(!_0_.hasOwnProperty("x"))y=1}()');
    });
    it('alias obj in array', function() {
      var s = 'var [{x:y=1}] = o';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('var y;!function(){var _0_= o;var _1_=_0_[0];y=_1_["x"];if(!_1_.hasOwnProperty("x"))y=1}()');
    });
    it('alias obj in obj', function() {
      var s = 'var {x:{y:z=1}} = o';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('var z;!function(){var _0_= o;var _1_=_0_["x"];z=_1_["y"];if(!_1_.hasOwnProperty("y"))z=1}()');
    });
    it('expr alias obj', function() {
      var s = '({x:y=1} = o)';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('(function(){var _0_= o;y=_0_["x"];if(!_0_.hasOwnProperty("x"))y=1;return _0_}())');
    });
  });
  describe('Unicode string', function() {
    it('normal', function() {
      var s = '"\\u{10000}"';
      var res = Jsdc.parse(s);
      expect(res).to.eql('"\\uFFFF\\u0001"');
    });
    it('multi', function() {
      var s = '"\\u{10000}\\u{10000}"';
      var res = Jsdc.parse(s);
      expect(res).to.eql('"\\uFFFF\\u0001\\uFFFF\\u0001"');
    });
    it('ignore', function() {
      var s = '"\\\\u{10000}"';
      var res = Jsdc.parse(s);
      expect(res).to.eql('"\\\\u{10000}"');
    });
    it('not ignore', function() {
      var s = '"\\\\\\u{10000}"';
      var res = Jsdc.parse(s);
      expect(res).to.eql('"\\\\\\uFFFF\\u0001"');
    });
    it('prefix 2', function() {
      var s = '"\\u{10010}"';
      var res = Jsdc.parse(s);
      expect(res).to.eql('"\\uFFFF\\u0011"');
    });
    it('prefix 1', function() {
      var s = '"\\u{10110}"';
      var res = Jsdc.parse(s);
      expect(res).to.eql('"\\uFFFF\\u0111"');
    });
    it('prefix 0', function() {
      var s = '"\\u{11110}"';
      var res = Jsdc.parse(s);
      expect(res).to.eql('"\\uFFFF\\u1111"');
    });
  });
  describe('object property', function() {
    it('id', function() {
      var s = 'var a = {o}';
      var res = Jsdc.parse(s);
      expect(res).to.eql('var a = {o:o}');
    });
    it('method', function() {
      var s = 'var a = {o(){}}';
      var res = Jsdc.parse(s);
      expect(res).to.eql('var a = {o:function(){}}');
    });
    it('cal', function() {
      var s = 'var o = {[a]:1}';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('var o = function(){var _0_={_1_:1};_0_[a]=_0_._1_;delete _0_._1_;return _0_}()');
    });
  });
});