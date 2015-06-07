var expect = require('expect.js');
var fs = require('fs');
var path = require('path');

var originEs6 = function hasNativeGenerators () {
  var has = false;
  try {
    eval('(function*(){})');
    has = true;
  } catch (e) {
  }
  return has;
}()

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
      expect(res).to.eql('function a(b){if(b===void 0)b=1;}');
    });
    it('after an id', function() {
      var s = 'function a(b, c = fn()){}';
      var res = Jsdc.parse(s);
      expect(res).to.eql('function a(b, c){if(c===void 0)c=fn();}');
    });
    it('multi', function() {
      var s = 'function a(b = 1, c = []){}';
      var res = Jsdc.parse(s);
      expect(res).to.eql('function a(b, c){if(b===void 0)b=1;if(c===void 0)c=[];}');
    });
    it('cross line', function() {
      var s = 'function a(b = function() {var c = 1\n}) {}';
      var res = Jsdc.parse(s);
      expect(res).to.eql('function a(b\n) {if(b===void 0)b=function(){var c=1};}');
    });
  });
  describe('rest params', function() {
    it('no params', function() {
      var s = 'new A';
      var res = Jsdc.parse(s);
      expect(res).to.eql(s);
    });
    it('fmparams', function() {
      var s = 'function a(...b){}';
      var res = Jsdc.parse(s);
      expect(res).to.eql('function a(b){b=[].slice.call(arguments, 0);}');
    });
    it('fmparams 2', function() {
      var s = 'function a(a, ...b){}';
      var res = Jsdc.parse(s);
      expect(res).to.eql('function a(a, b){b=[].slice.call(arguments, 1);}');
    });
    it('fmparams 3', function() {
      var s = 'function a(a, b, ...c){}';
      var res = Jsdc.parse(s);
      expect(res).to.eql('function a(a, b, c){c=[].slice.call(arguments, 2);}');
    });
    it('fmparams 4', function() {
      var s = 'function a(a, b, c, ...d){}';
      var res = Jsdc.parse(s);
      expect(res).to.eql('function a(a, b, c, d){d=[].slice.call(arguments, 3);}');
    });
    it('callexpr single spread', function() {
      Jsdc.reset();
      var s = 'Math.max(...a)';
      var res = Jsdc.parse(s);
      expect(res).to.eql('Math.max.apply(Math,[].concat(Array.from(a)))');
    });
    it('callexpr with a fn spread', function() {
      Jsdc.reset();
      var s = 'a(...b())';
      var res = Jsdc.parse(s);
      expect(res).to.eql('a.apply(this,[].concat(Array.from(b())))');
    });
    it('callexpr mult spread', function() {
      Jsdc.reset();
      var s = 'Math.max(a, ...b)';
      var res = Jsdc.parse(s);
      expect(res).to.eql('Math.max.apply(Math,[a].concat(Array.from(b)))');
    });
    it('callexpr with prmrexpr', function() {
      Jsdc.reset();
      var s = 'fn(a, b, ...c)';
      var res = Jsdc.parse(s);
      expect(res).to.eql('fn.apply(this,[a,b].concat(Array.from(c)))');
    });
    it('arrltr with rest', function() {
      Jsdc.reset();
      var s = '[a, ...b]';
      var res = Jsdc.parse(s);
      expect(res).to.eql('[a].concat(Array.from(b))');
    });
    it('arrltr with rest string', function() {
      Jsdc.reset();
      var s = '[a, ..."b"]';
      var res = Jsdc.parse(s);
      expect(res).to.eql('[a].concat("b".split(""))');
    });
    it('callexpr contains a newexpr', function() {
      Jsdc.reset();
      var s = 'new a().b(...c)';
      var res = Jsdc.parse(s);
      expect(res).to.eql('function(){var _0=new a();return _0.b.apply(_0,[].concat(Array.from(c)))}()');
    });
    it('spread with fn', function() {
      Jsdc.reset();
      var s = '[...a()]';
      var res = Jsdc.parse(s);
      expect(res).to.eql('[].concat(Array.from(a()))');
    });
    it('multi spread 1', function() {
      Jsdc.reset();
      var s = '[...a, ...b]';
      var res = Jsdc.parse(s);
      expect(res).to.eql('[].concat(Array.from(a)).concat(Array.from(b))');
    });
    it('multi spread 2', function() {
      Jsdc.reset();
      var s = '[...a, c, ...b]';
      var res = Jsdc.parse(s);
      expect(res).to.eql('[].concat(Array.from(a)).concat([c]).concat(Array.from(b))');
    });
    it('multi spread with string', function() {
      Jsdc.reset();
      var s = '[...a, ..."b"]';
      var res = Jsdc.parse(s);
      expect(res).to.eql('[].concat(Array.from(a)).concat("b".split(""))');
    });
    it('new class', function() {
      Jsdc.reset();
      var s = 'new Cls(...args)';
      var res = Jsdc.parse(s);
      expect(res).to.eql('new (Function.prototype.bind.apply(Cls, [null].concat(Array.from(args))))');
    });
    it('new class multi', function() {
      Jsdc.reset();
      var s = 'new Cls(a, ...args)';
      var res = Jsdc.parse(s);
      expect(res).to.eql('new (Function.prototype.bind.apply(Cls, [null,a].concat(Array.from(args))))');
    });
    it('new class serveral', function() {
      Jsdc.reset();
      var s = 'new Cls(a, b, ...args)';
      var res = Jsdc.parse(s);
      expect(res).to.eql('new (Function.prototype.bind.apply(Cls, [null,a,b].concat(Array.from(args))))');
    });
    it('new class with a fn spread', function() {
      Jsdc.reset();
      var s = 'new Cls(...a())';
      var res = Jsdc.parse(s);
      expect(res).to.eql('new (Function.prototype.bind.apply(Cls, [null].concat(Array.from(a()))))');
    });
    it('lexical', function() {
      var s = 'new Cls(...this.a)';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('new (Function.prototype.bind.apply(Cls, [null].concat(Array.from(this.a))))');
    });
    it('arrow fn no {}', function() {
      Jsdc.reset();
      var s = 'var fn = (...arg) => console.log(arg);';
      var res = Jsdc.parse(s);
      expect(res).to.eql('var fn = function(arg) {arg=[].slice.call(arguments, 0);return console.log(arg)};');
    });
    it('arrow fn with multi params no {}', function() {
      Jsdc.reset();
      var s = 'var fn = (a, b, c, d, ...arg) => console.log(arg);';
      var res = Jsdc.parse(s);
      expect(res).to.eql('var fn = function(a, b, c, d, arg) {arg=[].slice.call(arguments, 4);return console.log(arg)};');
    });
    it('arrow fn {}', function() {
      Jsdc.reset();
      var s = 'var fn = (...arg) => {console.log(arg)};';
      var res = Jsdc.parse(s);
      expect(res).to.eql('var fn = function(arg) {arg=[].slice.call(arguments, 0);console.log(arg)};');
    });
    it('arrow fn with multi params', function() {
      Jsdc.reset();
      var s = 'var fn = (a, b, c, ...arg) => {console.log(arg)};';
      var res = Jsdc.parse(s);
      expect(res).to.eql('var fn = function(a, b, c, arg) {arg=[].slice.call(arguments, 3);console.log(arg)};');
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
    it('multi', function() {
      var s = '`${a}${b}`';
      var res = Jsdc.parse(s);
      expect(res).to.eql('(a + "" + b)');
    });
    it('blank', function() {
      var s = '`${ a}`';
      var res = Jsdc.parse(s);
      expect(res).to.eql('( a)');
    });
    it('expression', function() {
      var s = '`${a+b}`';
      var res = Jsdc.parse(s);
      expect(res).to.eql('((a+b))');
    });
    it('multi-line', function() {
      var s = '`${a+b}\nc`';
      var res = Jsdc.parse(s);
      expect(res).to.eql('((a+b) + "\\\nc")');
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
      expect(res).to.eql('var _0=o;for(a =_0[Symbol.iterator]().next();!a.done;a=_0.next()){a=a.value;}');
    });
    it('without blockstmt', function() {
      var s = 'for(a of b);';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('var _0=b;for(a =_0[Symbol.iterator]().next();!a.done;a=_0.next()){a=a.value;;}');
    });
    it('without blockstmt and append comment', function() {
      var s = 'for(a of b);//';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('var _0=b;for(a =_0[Symbol.iterator]().next();!a.done;a=_0.next()){a=a.value;;}//');
    });
    it('without blockstmt and append mulit comment', function() {
      var s = 'for(a of b);/**/\n//\n';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('var _0=b;for(a =_0[Symbol.iterator]().next();!a.done;a=_0.next()){a=a.value;;}/**/\n//\n');
    });
    it('varstmt', function() {
      var s = 'for(var a of {}){a}';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('var _0={};for(var a =_0[Symbol.iterator]().next();!a.done;a=_0.next()){a=a.value;a}');
    });
    it('varstmt without blockstmt', function() {
      var s = 'for(var a of {})a';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('var _0={};for(var a =_0[Symbol.iterator]().next();!a.done;a=_0.next()){a=a.value;a}');
    });
    it('destruct var arr', function() {
      var s = 'for(var [a] of o){}';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('var _0=o;for(var a=_0[Symbol.iterator]().next();!a.done;a=_0.next()){a=a.value;a=a[0];}');
    });
    it('destruct var arr init', function() {
      var s = 'for(var [a=1] of o){}';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('var _0=o;for(var a=_0[Symbol.iterator]().next();!a.done;a=_0.next()){a=a.value;!function(){var _1=a;a=a[0];if(_1.indexOf(a)!=0)a=1}();}');
    });
    it('destruct var arr multi', function() {
      var s = 'for(var [a,b] of o){}';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('var _0=o;for(var b=_0[Symbol.iterator]().next();!b.done;b=_0.next()){b=b.value;a=b[0];b=b[1];}');
    });
    it('destruct var obj', function() {
      var s = 'for(var {a} of o){}';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('var _0=o;for(var a=_0[Symbol.iterator]().next();!a.done;a=_0.next()){a=a.value;a=a["a"];}');
    });
    it('destruct var obj init', function() {
      var s = 'for(var {a=1} of o){}';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('var _0=o;for(var a=_0[Symbol.iterator]().next();!a.done;a=_0.next()){a=a.value;!function(){var _1=a;a=a["a"];if(!_1.hasOwnProperty("a"))a=1}();}');
    });
    it('destruct var obj multi', function() {
      var s = 'for(var {a,b} of o){}';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('var _0=o;for(var b=_0[Symbol.iterator]().next();!b.done;b=_0.next()){b=b.value;a=b["a"];b=b["b"];}');
    });
    it('destruct var complex', function() {
      var s = 'for(var {a,b:c,d:{e=1}} of o){}';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('var _0=o;for(var e=_0[Symbol.iterator]().next();!e.done;e=_0.next()){e=e.value;a=e["a"];c=e["b"];var _1=e["d"];!function(){var _2=e;e=_1["e"];if(!_2.hasOwnProperty("e"))e=1}();}');
    });
    it('destruct expr arr', function() {
      var s = 'for([a] of o){}';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('var _0=o;for(a=_0[Symbol.iterator]().next();!a.done;a=_0.next()){a=a.value;a=a[0];}');
    });
    it('destruct expr arr init', function() {
      var s = 'for([a=1] of o){}';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('var _0=o;for(a=_0[Symbol.iterator]().next();!a.done;a=_0.next()){a=a.value;!function(){var _1=a;a=a[0];if(_1.indexOf(a)!=0)a=1}();}');
    });
    it('destruct expr arr multi', function() {
      var s = 'for([a,b] of o){}';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('var _0=o;for(b=_0[Symbol.iterator]().next();!b.done;b=_0.next()){b=b.value;a=b[0];b=b[1];}');
    });
    it('destruct expr obj', function() {
      var s = 'for({a} of o){}';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('var _0=o;for(a=_0[Symbol.iterator]().next();!a.done;a=_0.next()){a=a.value;a=a["a"];}');
    });
    it('destruct expr obj init', function() {
      var s = 'for({a=1} of o){}';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('var _0=o;for(a=_0[Symbol.iterator]().next();!a.done;a=_0.next()){a=a.value;!function(){var _1=a;a=a["a"];if(!_1.hasOwnProperty("a"))a=1}();}');
    });
    it('destruct expr obj alias init', function() {
      var s = 'for({a:b=1} of o){}';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('var _0=o;for(b=_0[Symbol.iterator]().next();!b.done;b=_0.next()){b=b.value;!function(){var _1=b;b=b["a"];if(!_1.hasOwnProperty("a"))b=1}();}');
    });
    it('destruct expr obj multi', function() {
      var s = 'for({a,b} of o){}';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('var _0=o;for(b=_0[Symbol.iterator]().next();!b.done;b=_0.next()){b=b.value;a=b["a"];b=b["b"];}');
    });
    it('destruct expr complex', function() {
      var s = 'for({a,b:c,d:{e=1}} of o){}';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('var _0=o;for(e=_0[Symbol.iterator]().next();!e.done;e=_0.next()){e=e.value;a=e["a"];c=e["b"];var _1=e["d"];e=_1["e"];if(!_1.hasOwnProperty("e"))e=1;}');
    });
    it('destruct complex', function() {
      var s = 'for({a=1,b:c=2,d:{e=3},f:[g=4]} of o){}';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('var _0=o;for(g=_0[Symbol.iterator]().next();!g.done;g=_0.next()){g=g.value;a=g["a"];if(!g.hasOwnProperty("a"))a=1;c=g["b"];if(!g.hasOwnProperty("b"))c=2;var _1=g["d"];e=_1["e"];if(!_1.hasOwnProperty("e"))e=3;var _2=g["f"];g=_2[0];if(_2.indexOf(g)!=0)g=4;}');
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
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('!function(){var _0=Object.create(B.prototype);_0.constructor=A;A.prototype=_0}();\nfunction A(){B.call(this)}\nA.prototype.a = function(){}\nObject.keys(B).forEach(function(k){A[k]=B[k]});');
    });
    it('super call property', function() {
      var s = 'class A extends B{constructor(){super.a}}';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('!function(){var _0=Object.create(B.prototype);_0.constructor=A;A.prototype=_0}();function A(){B.prototype.a}Object.keys(B).forEach(function(k){A[k]=B[k]});');
    });
    it('super call multi', function() {
      var s = 'class A extends B{constructor(){super(a,b)}}';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('!function(){var _0=Object.create(B.prototype);_0.constructor=A;A.prototype=_0}();function A(){B.call(this,a,b)}Object.keys(B).forEach(function(k){A[k]=B[k]});');
    });
    it('super call spread', function() {
      var s = 'class A extends B{constructor(){super(...d)}}';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('!function(){var _0=Object.create(B.prototype);_0.constructor=A;A.prototype=_0}();function A(){B.apply(this,[].concat(Array.from(d)))}Object.keys(B).forEach(function(k){A[k]=B[k]});');
    });
    it('super call multi spread', function() {
      var s = 'class A extends B{constructor(){super(a,b,...c)}}';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('!function(){var _0=Object.create(B.prototype);_0.constructor=A;A.prototype=_0}();function A(){B.apply(this,[a,b].concat(Array.from(c)))}Object.keys(B).forEach(function(k){A[k]=B[k]});');
    });
    it('super call method with argments', function() {
      var s = 'class A extends B{constructor(){super.a(1)}}';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('!function(){var _0=Object.create(B.prototype);_0.constructor=A;A.prototype=_0}();function A(){B.prototype.a.call(this,1)}Object.keys(B).forEach(function(k){A[k]=B[k]});');
    });
    it('super call method with multi argments', function() {
      var s = 'class A extends B{constructor(){super.a(1,2)}}';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('!function(){var _0=Object.create(B.prototype);_0.constructor=A;A.prototype=_0}();function A(){B.prototype.a.call(this,1,2)}Object.keys(B).forEach(function(k){A[k]=B[k]});');
    });
    it('super call method with spread', function() {
      var s = 'class A extends B{constructor(){super.a(...d)}}';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('!function(){var _0=Object.create(B.prototype);_0.constructor=A;A.prototype=_0}();function A(){B.prototype.a.apply(this,[].concat(Array.from(d)))}Object.keys(B).forEach(function(k){A[k]=B[k]});');
    });
    it('super call method multi spread', function() {
      var s = 'class A extends B{constructor(){super.a(b,...d)}}';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('!function(){var _0=Object.create(B.prototype);_0.constructor=A;A.prototype=_0}();function A(){B.prototype.a.apply(this,[b].concat(Array.from(d)))}Object.keys(B).forEach(function(k){A[k]=B[k]});');
    });
    it('getter/setter', function() {
      var s = 'class A{get b(){}set c(d){}}';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('function A(){}var _0={};_0.b={};_0.b.get =function(){}_0.c={};_0.c.set =function(d){}Object.keys(_0).forEach(function(k){Object.defineProperty(A.prototype,k,_0[k])});');
    });
    it('getter/setter multi', function() {
      var s = 'class A{get b(){}set c(d){}get c(){}}';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('function A(){}var _0={};_0.b={};_0.b.get =function(){}_0.c={};_0.c.set =function(d){}_0.c.get =function(){}Object.keys(_0).forEach(function(k){Object.defineProperty(A.prototype,k,_0[k])});');
    });
    it('static', function() {
      var s = 'class A extends B{\nstatic F(){super.b()}\n}';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('function A(){B.call(this)}!function(){var _0=Object.create(B.prototype);_0.constructor=A;A.prototype=_0}();\nA.F=function(){B.prototype.b.call(this)}\nObject.keys(B).forEach(function(k){A[k]=B[k]});');
    });
    it('static getter/setter', function() {
      var s = 'class A extends B{\nstatic get F(){super.b()}\n}';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('function A(){B.call(this)}!function(){var _0=Object.create(B.prototype);_0.constructor=A;A.prototype=_0}();\nvar _1={};_1.F={};_1.F.get =function(){B.prototype.b.call(this)}\nObject.keys(_1).forEach(function(k){Object.defineProperty(A,k,_1[k])});Object.keys(B).forEach(function(k){A[k]=B[k]});');
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
      expect(res).to.eql('!function(){function _0(){}return _0}()');
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
      expect(res).to.eql('!function(){function _0(){}_0.prototype.a = function(){}return _0}()');
    });
    it('classexpr extends', function() {
      var s = '!class extends A{}';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('!function(){function _0(){A.call(this)}!function(){var _1=Object.create(A.prototype);_1.constructor=_0;_0.prototype=_1}();Object.keys(A).forEach(function(k){_0[k]=A[k]});return _0}()');
    });
    it('classexpr constructor', function() {
      var s = '!class {constructor(){}}';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('!function(){function _0(){}return _0}()');
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
      expect(res).to.eql('!function(){!function(){var _0=Object.create(B.prototype);_0.constructor=A;A.prototype=_0}();extends Bfunction A(){B.call(this)}Object.keys(B).forEach(function(k){A[k]=B[k]});return A}()');
    });
    it('classexpr super', function() {
      var s = '!class A extends B{constructor(){super()}}';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('!function(){!function(){var _0=Object.create(B.prototype);_0.constructor=A;A.prototype=_0}();extends Bfunction A(){B.call(this)}Object.keys(B).forEach(function(k){A[k]=B[k]});return A}()');
    });
    it('classexpr extends', function() {
      var s = '!class extends A{}';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('!function(){function _0(){A.call(this)}!function(){var _1=Object.create(A.prototype);_1.constructor=_0;_0.prototype=_1}();Object.keys(A).forEach(function(k){_0[k]=A[k]});return _0}()');
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
      expect(res).to.eql('define(function(require,exports,module){var a=function(){var _0=require("a");return _0.hasOwnProperty("default")?_0["default"]:_0}();});');
    });
    it('uid with hasOwnProperty', function() {
      var s = 'import a from "a";a.hasOwnProperty';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('define(function(require,exports,module){var a=function(){var _0=require("a");return _0.hasOwnProperty("default")?_0["default"]:_0}();a.hasOwnProperty});');
    });
    it('import from', function() {
      var s = 'import More from "./More";';
      Jsdc.reset();
      Jsdc.define(false);
      var res = Jsdc.parse(s);
      expect(res).to.eql('var More=function(){var _0=require("./More");return _0.hasOwnProperty("default")?_0["default"]:_0}();');
    });
    it('import multi id', function() {
      var s = 'import a,b from "a"';
      Jsdc.reset();
      Jsdc.define(true);
      var res = Jsdc.parse(s);
      expect(res).to.eql('define(function(require,exports,module){var a;var b;!function(){var _0=require("a");a=_0.a;b=_0.b;}();});');
    });
    it('import {}', function() {
      var s = 'import {a,b} from "a"';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('define(function(require,exports,module){var a;var b;!function(){var _0=require("a");a=_0.a;b=_0.b;}();});');
    });
    it('import {} as', function() {
      var s = 'import {a,b as c} from "a"';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('define(function(require,exports,module){var a;var c;!function(){var _0=require("a");a=_0.a;c=_0.b;}();});');
    });
    it('export *', function() {
      var s = 'export * from "a"';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('define(function(require,exports,module){!function(){var _0=require("a");Object.keys(_0).forEach(function(k){module.exports[k]=_0[k];});}();});');
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
      expect(res).to.eql('define(function(require,exports,module){exports["default"]=a});');
    });
    it('avoid of id __\d__', function() {
      var s = 'import {a as _0} from "a"';
      Jsdc.reset();
      Jsdc.define(false);
      var res = Jsdc.parse(s);
      expect(res).to.eql('var _0;!function(){var _1=require("a");_0=_1.a;}();');
    });
    it('set no define', function() {
      var s = 'import {a,b as c} from "a"';
      Jsdc.reset();
      Jsdc.define(false);
      var res = Jsdc.parse(s);
      expect(res).to.eql('var a;var c;!function(){var _0=require("a");a=_0.a;c=_0.b;}();');
    });
    it('insert define before blank but not comment', function() {
      var s = '/**/\n//\n\nexport default a';
      Jsdc.reset();
      Jsdc.define(true);
      var res = Jsdc.parse(s);
      expect(res).to.eql('/**/\n//\ndefine(function(require,exports,module){\nexports["default"]=a});');
    });
  });
  describe('array comprehension', function() {
    it('normal', function() {
      var s = 'var a = [for(k of o)k]';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('var a = function(){var k;var _0=[];for(k in o){k=o[k];_0.push(k)}return _0}()');
    });
    it('with cmphif', function() {
      var s = 'var a = [for(k of o)if(k)k]';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('var a = function(){var k;var _0=[];for(k in o){k=o[k];if(k)_0.push(k)}return _0}()');
    });
    it('multi cmphfor', function() {
      var s = 'var a = [for(a of b)for(c of a)c]';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('var a = function(){var a;var c;var _0=[];for(a in b){a=b[a];for(c in a){c=a[c];_0.push(c)}}return _0}()');
    });
    it('multi cmphfor with cmphif', function() {
      var s = 'var a = [for(a of b)for(c of a)if(c)c]';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('var a = function(){var a;var c;var _0=[];for(a in b){a=b[a];for(c in a){c=a[c];if(c)_0.push(c)}}return _0}()');
    });
    it('multi variable', function() {
      var s = 'var a = [for(k of o)k], b';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('var a = function(){var k;var _0=[];for(k in o){k=o[k];_0.push(k)}return _0}(), b');
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
    it('lexical 1', function() {
      var s = 'var a = (b, c) => console.log(this, arguments)';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('var _0=this;var _1=arguments;var a = function(b, c) {return console.log(_0, _1)}');
    });
    it('lexical 2', function() {
      var s = 'function x(){ var a = (b, c) => console.log(this, arguments) }';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('function x(){ var _0=this;var _1=arguments;var a = function(b, c) {return console.log(_0, _1)} }');
    });
    it('lexical with', function() {
      var s = 'with(o){ var a = (b, c) => console.log(this, arguments) }';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('var a;with(o)!function(){ var _0=this;var _1=arguments;a = function(b, c) {return console.log(_0, _1)} }();');
    });
  });
  describe('generator function', function() {
    it('empty', function() {
      var s = 'function *a(){}';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('var a=function(){return function(){return{next:_0};function _0(){;return{done:true}}}}();');
    });
    it('normal', function() {
      var s = 'function *a(){yield 1}';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('var a=function(){return function(){var _0=0;return{next:_1};function _1(_2){while(1){switch(_0){case 0:_0=1;return{value:1,done:true};case 1:_0=-1;default:return{done:true}}}}}}();');
    });
    it('multi yield', function() {
      var s = 'function *a(){yield 1;yield 2}';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('var a=function(){return function(){var _0=0;return{next:_1};function _1(_2){while(1){switch(_0){case 0:_0=1;return{value:1,done:false};case 1:_0=2;return{value:2,done:true};case 2:_0=-1;default:return{done:true}}}}}}();');
    });
    it('with var state', function() {
      var s = 'function *a(){var a = 1;yield a++;yield a++}';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('var a=function(){return function(){var _0=0;return{next:_1};var a;function _1(_2){while(1){switch(_0){case 0:a = 1;_0=1;return{value:a++,done:false};case 1:_0=2;return{value:a++,done:true};case 2:_0=-1;default:return{done:true}}}}}}();');
    });
    it('scope in genaretor', function() {
      var s = 'function *a(){{var a}}';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('var a=function(){return function(){return{next:_0};var a;function _0(){!function(){a}();;return{done:true}}}}();');
    });
    it('let scope', function() {
      var s = 'function *a(){{let a}}';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('var a=function(){return function(){return{next:_0};function _0(){!function(){var a}();;return{done:true}}}}();');
    });
    it('ignore fndecl', function() {
      var s = 'function *a(){function a(){}}';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('var a=function(){return function(){return{next:_0};function _0(){function a(){};return{done:true}}}}();');
    });
    it('in block', function() {
      var s = '{function *a(){}}';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('!function(){var a=function(){return function(){return{next:_0};function _0(){;return{done:true}}}}();}();');
    });
    it('yield a generator', function() {
      var s = 'function *a(){yield * b}';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('var a=function(){return function(){var _0=0;return{next:_1};function _1(_2){while(1){switch(_0){case 0:_0=1;var _3=b.next();return{done:(!_3.done&&_0--),value:_3};case 1:_0=-1;default:return{done:true}}}}}}();');
    });
    it('generator expr', function() {
      var s = '~function *(){}';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('~function(){return function(){return{next:_0};function _0(){}}}()');
    });
    it('generator expr with name', function() {
      var s = '~function * a(){}';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('~function(){return function(){return{next:_0};function _0(){}}}()');
    });
    it('in ifstmt', function() {
      var s = 'function *a(){if(true){yield 1}}';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('var a=function(){return function(){var _0=0;return{next:_1};function _1(_2){while(1){switch(_0){case 0:_0=true?1:2;break;case 1:_0=3;return{value:1,done:false};case 3:_0=2;break;case 2:_0=-1;default:return{done:true}}}}}}();');
    });
    it('in ifstmt no {}', function() {
      var s = 'function *a(){if(true)yield 1}';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('var a=function(){return function(){var _0=0;return{next:_1};function _1(_2){while(1){switch(_0){case 0:_0=true?1:2;break;case 1:_0=3;return{value:1,done:false};case 3:_0=2;break;case 2:_0=-1;default:return{done:true}}}}}}();');
    });
    it('in ifstmt else', function() {
      var s = 'function *a(){if(true)yield 1;else{yield 2}}';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('var a=function(){return function(){var _0=0;return{next:_1};function _1(_2){while(1){switch(_0){case 0:_0=true?1:2;break;case 1:_0=4;return{value:1,done:false};case 4:_0=3;break;case 2:_0=5;return{value:2,done:false};case 5:case 3:_0=-1;default:return{done:true}}}}}}();');
    });
    it('in ifstmt else no {}', function() {
      var s = 'function *a(){if(true)yield 1;else yield 2}';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('var a=function(){return function(){var _0=0;return{next:_1};function _1(_2){while(1){switch(_0){case 0:_0=true?1:2;break;case 1:_0=4;return{value:1,done:false};case 4:_0=3;break;case 2:_0=5;return{value:2,done:false};case 5:case 3:_0=-1;default:return{done:true}}}}}}();');
    });
    it('in ifstmt elseif', function() {
      var s = 'function *a(){if(true)yield 1;else if(false)yield 2}';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('var a=function(){return function(){var _0=0;return{next:_1};function _1(_2){while(1){switch(_0){case 0:_0=true?1:2;break;case 1:_0=4;return{value:1,done:false};case 4:_0=3;break;case 2:_0=false?5:6;break;case 5:_0=7;return{value:2,done:false};case 7:_0=6;break;case 6:case 3:_0=-1;default:return{done:true}}}}}}();');
    });
    it('in ifstmt elseif no {}', function() {
      var s = 'function *a(){if(true)yield 1;else if(false){yield 2}}';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('var a=function(){return function(){var _0=0;return{next:_1};function _1(_2){while(1){switch(_0){case 0:_0=true?1:2;break;case 1:_0=4;return{value:1,done:false};case 4:_0=3;break;case 2:_0=false?5:6;break;case 5:_0=7;return{value:2,done:false};case 7:_0=6;break;case 6:case 3:_0=-1;default:return{done:true}}}}}}();');
    });
    it('in ifstmt elseif else', function() {
      var s = 'function *a(){if(true)yield 1;else if(false)yield 2;else yield 3}';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('var a=function(){return function(){var _0=0;return{next:_1};function _1(_2){while(1){switch(_0){case 0:_0=true?1:2;break;case 1:_0=4;return{value:1,done:false};case 4:_0=3;break;case 2:_0=false?5:6;break;case 5:_0=8;return{value:2,done:false};case 8:_0=7;break;case 6:_0=9;return{value:3,done:false};case 9:case 7:case 3:_0=-1;default:return{done:true}}}}}}();');
    });
    it('in whilestmt', function() {
      var s = 'function *a(){while(i++<5){yield i}}';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('var a=function(){return function(){var _0=0;return{next:_1};var _2;function _1(_3){while(1){switch(_0){case 0:_0=(_2=i++<5)?1:2;break;case 1:_0=3;return{value:i,done:!_2&&1};case 3:_0=0;break;case 2:_0=-1;default:return{done:true}}}}}}();');
    });
    it('in whilestmt no {}', function() {
      var s = 'function *a(){while(i++<5)yield i}';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('var a=function(){return function(){var _0=0;return{next:_1};var _2;function _1(_3){while(1){switch(_0){case 0:_0=(_2=i++<5)?1:2;break;case 1:_0=3;return{value:i,done:!_2&&1};case 3:_0=0;break;case 2:_0=-1;default:return{done:true}}}}}}();');
    });
    it('in dowhilestmt', function() {
      var s = 'function *a(){do{yield i}while(i++<5)}';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('var a=function(){return function(){var _0=0;return{next:_1};var _2;function _1(_3){while(1){switch(_0){case 0:case 1:_0=3;return{value:i,done:!_2&&1};case 3:_0=2;break;case 2:_0=(_2=i++<5)?1:4;break;case 4:_0=-1;default:return{done:true}}}}}}();');
    });
    it('in dowhilestmt no {}', function() {
      var s = 'function *a(){do yield i;while(i++<5)}';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('var a=function(){return function(){var _0=0;return{next:_1};var _2;function _1(_3){while(1){switch(_0){case 0:case 1:_0=3;return{value:i,done:!_2&&1};case 3:_0=2;break;case 2:_0=(_2=i++<5)?1:4;break;case 4:_0=-1;default:return{done:true}}}}}}();');
    });
    it('in forstmt', function() {
      var s = 'function *a(){for(var i = 0; i < 5; i++){yield i}}';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('var a=function(){return function(){var _0=0;return{next:_1};var i;var _2;function _1(_3){while(1){switch(_0){case 0:i = 0; case 1:_0=(_2=i < 5)?2:3; case 2:i++;_0=4;return{value:i,done:!_2&&1};case 4:_0=1;break;case 3:_0=-1;default:return{done:true}}}}}}();');
    });
    it('in forstmt no {}', function() {
      var s = 'function *a(){for(var i = 0; i < 5; i++)yield i}';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('var a=function(){return function(){var _0=0;return{next:_1};var i;var _2;function _1(_3){while(1){switch(_0){case 0:i = 0; case 1:_0=(_2=i < 5)?2:3; case 2:i++;_0=4;return{value:i,done:!_2&&1};case 4:_0=1;break;case 3:_0=-1;default:return{done:true}}}}}}();');
    });
    it('in forstmt no expr1', function() {
      var s = 'function *a(){for(; i < 5; i++)yield i}';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('var a=function(){return function(){var _0=0;return{next:_1};var _2;function _1(_3){while(1){switch(_0){case 0:; case 1:_0=(_2=i < 5)?2:3; case 2:i++;_0=4;return{value:i,done:!_2&&1};case 4:_0=1;break;case 3:_0=-1;default:return{done:true}}}}}}();');
    });
    it('in forstmt no expr2', function() {
      var s = 'function *a(){for(;; i++)yield i}';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('var a=function(){return function(){var _0=0;return{next:_1};var _2;function _1(_3){while(1){switch(_0){case 0:case 1:;; case 2:i++;_0=4;return{value:i,done:!_2&&1};case 4:_0=1;break;case 3:_0=-1;default:return{done:true}}}}}}();');
    });
    it('in forstmt no expr3', function() {
      var s = 'function *a(){for(;;)yield i}';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('var a=function(){return function(){var _0=0;return{next:_1};var _2;function _1(_3){while(1){switch(_0){case 0:case 1:;;_0=4;return{value:i,done:!_2&&1};case 4:_0=1;break;case 3:;case 2:_0=-1;default:return{done:true}}}}}}();');
    });
    it('in forinstmt', function() {
      var s = 'function *a(){for(var i in o){yield i}}';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('var a=function(){return function(){var _0=0;return{next:_1};var i;function _1(_6){while(1){switch(_0){case 0:var _5=o,_2=Object.keys(_5),_3=_2.length,_4=0;case 1:_0=_4++<_3?2:3;break;case 2:i=_2[_4];_0=4;return{value:i,done:_4<_3&&1};case 4:_0=1;break;case 3:_0=-1;default:return{done:true}}}}}}();');
    });
    it('in forinstmt no {}', function() {
      var s = 'function *a(){for(var i in o)yield i}';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('var a=function(){return function(){var _0=0;return{next:_1};var i;function _1(_6){while(1){switch(_0){case 0:var _5=o,_2=Object.keys(_5),_3=_2.length,_4=0;case 1:_0=_4++<_3?2:3;break;case 2:i=_2[_4];_0=4;return{value:i,done:_4<_3&&1};case 4:_0=1;break;case 3:_0=-1;default:return{done:true}}}}}}();');
    });
    it('in forofstmt', function() {
      var s = 'function *a(){for(var i of o){yield i}}';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('var a=function(){return function(){var _0=0;return{next:_1};var i;function _1(_4){while(1){switch(_0){case 0:var _3=o,_2=_3.next();case 1:_0=_2.done?3:4;break;case 2:_2=_3.next();_0=1;break;case 3:i=_2.value;_0=5;return{value:i,done:_2.done&&1};case 5:_0=1;break;case 4:_0=-1;default:return{done:true}}}}}}();');
    });
    it('in forofstmt no {}', function() {
      var s = 'function *a(){for(var i of o)yield i}';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('var a=function(){return function(){var _0=0;return{next:_1};var i;function _1(_4){while(1){switch(_0){case 0:var _3=o,_2=_3.next();case 1:_0=_2.done?3:4;break;case 2:_2=_3.next();_0=1;break;case 3:i=_2.value;_0=5;return{value:i,done:_2.done&&1};case 5:_0=1;break;case 4:_0=-1;default:return{done:true}}}}}}();');
    });
    it('with param id', function() {
      var s = 'function *a(b){var c=yield}';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('var a=function(){return function(){var _0=0;return{next:_1};var c;function _1(b){while(1){switch(_0){case 0:_0=1;return{value:void 0,done:true};case 1:c=b;_0=-1;default:return{done:true}}}}}}();');
    });
    it('with param rest', function() {
      var s = 'function *a(...b){var c=yield}';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('var a=function(){return function(){var _0=0;return{next:_1};var c;function _1(b){b=[].slice.call(arguments, 0);while(1){switch(_0){case 0:_0=1;return{value:void 0,done:true};case 1:c=b[0];_0=-1;default:return{done:true}}}}}}();');
    });
    it('with assignexpr', function() {
      var s = 'function *a(...b){c=yield}';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('var a=function(){return function(){var _0=0;return{next:_1};function _1(b){b=[].slice.call(arguments, 0);while(1){switch(_0){case 0:_0=1;return{value:void 0,done:true};case 1:c=b[0];_0=-1;default:return{done:true}}}}}}();');
    });
    it('with return', function() {
      var s = 'function *a(...b){c\nreturn}';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('var a=function(){return function(){return{next:_0};function _0(b){b=[].slice.call(arguments, 0);c\nreturn{value:void 0,done:true}}}}();');
    });
    it('with return result', function() {
      var s = 'function *a(...b){c;return c}';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('var a=function(){return function(){return{next:_0};function _0(b){b=[].slice.call(arguments, 0);c;return {value:c,done:true}}}}();');
    });
    it('yield null', function() {
      var s = 'function *a(){yield}';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('var a=function(){return function(){var _0=0;return{next:_1};function _1(_2){while(1){switch(_0){case 0:_0=1;return{value:void 0,done:true};case 1:_0=-1;default:return{done:true}}}}}}();');
    });
    it('with for of destructor', function() {
      var s = 'function *a(){for(var [a] of o){yield}}';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('var a=function(){return function(){var _0=0;return{next:_1};var a;function _1(_4){while(1){switch(_0){case 0:var _3=o,_2=_3.next();case 1:_0=_2.done?3:4;break;case 2:_2=_3.next();_0=1;break;case 3:a=_2.value;a=a[0];_0=5;return{value:void 0,done:_2.done&&1};case 5:_0=1;break;case 4:_0=-1;default:return{done:true}}}}}}();');
    });
    it('multi var', function() {
      var s = 'function *a(){var a,b,c;}';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('var a=function(){return function(){return{next:_0};var c;var b;var a;function _0(){a,b,c;;return{done:true}}}}();');
    });
    it('with destruct', function() {
      var s = 'function *a(){var [a]=[1];var b,{c,d}=o}';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('var a=function(){return function(){return{next:_0};var d;var c;var b;var a;function _0(){!function(){var _1=[1];a=_1[0]}();b;!function(){var _2=o;c=_2["c"];d=_2["d"]}();return{done:true}}}}();');
    });
    it('with destruct 2', function() {
      var s = 'function *a(){var [a]=[1];var b,{c,d}=o,e}';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('var a=function(){return function(){return{next:_0};var e;var d;var c;var b;var a;function _0(){!function(){var _1=[1];a=_1[0]}();b;!function(){var _2=o;c=_2["c"];d=_2["d"]}();var e;return{done:true}}}}();');
    });
  });
  describe('destructor', function() {
    it('single in array', function() {
      var s = 'var [a] = o';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('var a;!function(){var _0= o;a=_0[0]}()');
    });
    it('multi in array', function() {
      var s = 'var [a,b] = o';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('var b;var a;!function(){var _0= o;a=_0[0];b=_0[1]}()');
    });
    it('comma placeholder in array', function() {
      var s = 'var [a,,b] = o';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('var b;var a;!function(){var _0= o;a=_0[0];b=_0[2]}()');
    });
    it('multi var in array', function() {
      var s = 'var [a] = [b] = o';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('var a;!function(){var _0= o;b=_0[0];a=_0[0]}()');
    });
    it('single in object', function() {
      var s = 'var {a} = o';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('var a;!function(){var _0= o;a=_0["a"]}()');
    });
    it('multi in object', function() {
      var s = 'var {a,b} = o';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('var b;var a;!function(){var _0= o;a=_0["a"];b=_0["b"]}()');
    });
    it('alias in object', function() {
      var s = 'var {a,b:c} = o';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('var c;var a;!function(){var _0= o;a=_0["a"];c=_0["b"]}()');
    });
    it('multi var in object', function() {
      var s = 'var {a} = {b} = o';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('var a;!function(){var _0= o;b=_0["b"];a=_0["a"]}()');
    });
    it('array in array', function() {
      var s = 'var [a,[b]] = o';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('var b;var a;!function(){var _0= o;a=_0[0];var _1=_0[1];b=_1[0]}()');
    });
    it('array in array 2', function() {
      var s = 'var [a,[b,[c]]] = o';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('var c;var b;var a;!function(){var _0= o;a=_0[0];var _1=_0[1];b=_1[0];var _2=_1[1];c=_2[0]}()');
    });
    it('object in array', function() {
      var s = 'var [a,{b}] = o';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('var b;var a;!function(){var _0= o;a=_0[0];var _1=_0[1];b=_1["b"]}()');
    });
    it('array in object', function() {
      var s = 'var {a,b:[c]} = o';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('var c;var a;!function(){var _0= o;a=_0["a"];var _1=_0["b"];c=_1[0]}()');
    });
    it('object in object', function() {
      var s = 'var {a,b:{c}} = o';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('var c;var a;!function(){var _0= o;a=_0["a"];var _1=_0["b"];c=_1["c"]}()');
    });
    it('object in object 2', function() {
      var s = 'var {a,b:{c:{d}}} = o';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('var d;var a;!function(){var _0= o;a=_0["a"];var _1=_0["b"];var _2=_1["c"];d=_2["d"]}()');
    });
    it('object in object 3', function() {
      var s = 'var {a,b:{c:d}} = o';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('var d;var a;!function(){var _0= o;a=_0["a"];var _1=_0["b"];d=_1["c"]}()');
    });
    it('assingexpr single in array', function() {
      var s = '[a] = o';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('function(){var _0= o;a=_0[0];return _0}()');
    });
    it('assingexpr multi in array', function() {
      var s = '[a,b] = o';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('function(){var _0= o;a=_0[0];b=_0[1];return _0}()');
    });
    it('multi assingexpr in array', function() {
      var s = '[a] = [b] = o';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('function(){var _0= o;b=_0[0];a=_0[0];return _0}()');
    });
    it('multi assingexpr multi in array', function() {
      var s = '[a,b] = [c,d] = o';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('function(){var _0= o;c=_0[0];d=_0[1];a=_0[0];b=_0[1];return _0}()');
    });
    it('assingexpr comma placeholder in array', function() {
      var s = '[a,,b] = o';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('function(){var _0= o;a=_0[0];b=_0[2];return _0}()');
    });
    it('assingexpr single in object', function() {
      var s = '({a} = o)';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('(function(){var _0= o;a=_0["a"];return _0}())');
    });
    it('assingexpr multi in object', function() {
      var s = '({a,b} = o)';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('(function(){var _0= o;a=_0["a"];b=_0["b"];return _0}())');
    });
    it('multi assingexpr in object', function() {
      var s = '({a} = {b} = o)';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('(function(){var _0= o;b=_0["b"];a=_0["a"];return _0}())');
    });
    it('multi assingexpr multi in object', function() {
      var s = '({a,b} = {c,d} = o)';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('(function(){var _0= o;c=_0["c"];d=_0["d"];a=_0["a"];b=_0["b"];return _0}())');
    });
    it('assingexpr alias in object', function() {
      var s = '({a,b:c} = o)';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('(function(){var _0= o;a=_0["a"];c=_0["b"];return _0}())');
    });
    it('assingexpr array in array', function() {
      var s = '([a,[b]] = o)';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('(function(){var _0= o;a=_0[0];var _1=_0[1];b=_1[0];return _0}())');
    });
    it('assingexpr object in array', function() {
      var s = '([a,{b}] = o)';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('(function(){var _0= o;a=_0[0];var _1=_0[1];b=_1["b"];return _0}())');
    });
    it('assingexpr array in object', function() {
      var s = '({a,b:[c]} = o)';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('(function(){var _0= o;a=_0["a"];var _1=_0["b"];c=_1[0];return _0}())');
    });
    it('assingexpr object in object', function() {
      var s = '({a,b:{c}} = o)';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('(function(){var _0= o;a=_0["a"];var _1=_0["b"];c=_1["c"];return _0}())');
    });
    it('init array', function() {
      var s = 'var [a=1] = o';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('var a;!function(){var _0= o;a=_0[0];if(_0.indexOf(a)!=0)a=1}()');
    });
    it('init object', function() {
      var s = 'var {x=1} = o';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('var x;!function(){var _0= o;x=_0["x"];if(!_0.hasOwnProperty("x"))x=1}()');
    });
    it('init array in array', function() {
      var s = 'var [a,[b=1]] = o';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('var b;var a;!function(){var _0= o;a=_0[0];var _1=_0[1];b=_1[0];if(_1.indexOf(b)!=0)b=1}()');
    });
    it('init object in array', function() {
      var s = 'var [a,{b=1}] = o';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('var b;var a;!function(){var _0= o;a=_0[0];var _1=_0[1];b=_1["b"];if(!_1.hasOwnProperty("b"))b=1}()');
    });
    it('init array in object', function() {
      var s = 'var {x,y:[z=1]} = o';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('var z;var x;!function(){var _0= o;x=_0["x"];var _1=_0["y"];z=_1[0];if(_1.indexOf(z)!=0)z=1}()');
    });
    it('init object in object', function() {
      var s = 'var {x,y:{z=1}} = o';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('var z;var x;!function(){var _0= o;x=_0["x"];var _1=_0["y"];z=_1["z"];if(!_1.hasOwnProperty("z"))z=1}()');
    });
    it('assingexpr init array', function() {
      var s = '[a=1] = o';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('function(){var _0= o;a=_0[0];if(_0.indexOf(a)!=0)a=1;return _0}()');
    });
    it('assingexpr init object', function() {
      var s = '({x=1} = o)';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('(function(){var _0= o;x=_0["x"];if(!_0.hasOwnProperty("x"))x=1;return _0}())');
    });
    it('assingexpr init array in array', function() {
      var s = '[a,[b=1]] = o';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('function(){var _0= o;a=_0[0];var _1=_0[1];b=_1[0];if(_1.indexOf(b)!=0)b=1;return _0}()');
    });
    it('assingexpr init object in array', function() {
      var s = '[a,{b=1}] = o';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('function(){var _0= o;a=_0[0];var _1=_0[1];b=_1["b"];if(!_1.hasOwnProperty("b"))b=1;return _0}()');
    });
    it('assingexpr init array in object', function() {
      var s = '({x,y:[z=1]} = o)';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('(function(){var _0= o;x=_0["x"];var _1=_0["y"];z=_1[0];if(_1.indexOf(z)!=0)z=1;return _0}())');
    });
    it('assingexpr init object in object', function() {
      var s = '({x,y:{z=1}} = o)';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('(function(){var _0= o;x=_0["x"];var _1=_0["y"];z=_1["z"];if(!_1.hasOwnProperty("z"))z=1;return _0}())');
    });
    it('assingexpr init object in object in object', function() {
      var s = '({x,y:{m:{n},o:p}} = o)';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('(function(){var _0= o;x=_0["x"];var _1=_0["y"];var _2=_1["m"];n=_2["n"];p=_1["o"];return _0}())');
    });
    it('varstmt arr destruct first start with id', function() {
      var s = 'var a = [b] = [c] = e = o';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('var a = function(){var _0= e = o;c=_0[0];b=_0[0];return _0}()');
    });
    it('varstmt obj destruct first start with id', function() {
      var s = 'var a = {b} = {c} = e = o';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('var a = function(){var _0= e = o;c=_0["c"];b=_0["b"];return _0}()');
    });
    it('array var rest', function() {
      var s = 'var [a, ...b] = o';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('var b;var a;!function(){var _0= o;a=_0[0];b=_0.slice(1)}()');
    });
    it('array in array var rest', function() {
      var s = 'var [a, [b, ...c]] = o';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('var c;var b;var a;!function(){var _0= o;a=_0[0];var _1=_0[1];b=_1[0];c=_1.slice(1)}()');
    });
    it('array expr spread', function() {
      var s = '[a, ...b] = o';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('function(){var _0= o;a=_0[0];b=_0.slice(1);return _0}()');
    });
    it('array in array expr spread', function() {
      var s = '[a, [b, ...c]] = o';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('function(){var _0= o;a=_0[0];var _1=_0[1];b=_1[0];c=_1.slice(1);return _0}()');
    });
    it('array in array in array expr spread', function() {
      var s = '[a, [b, [...c]]] = o';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('function(){var _0= o;a=_0[0];var _1=_0[1];b=_1[0];var _2=_1[1];c=_2.slice(0);return _0}()');
    });
    it('var id,destruct', function() {
      var s = 'var a,[b]=1';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('var b;var a;!function(){var _0=1;b=_0[0]}()');
    });
    it('var id,destruct,id', function() {
      var s = 'var a,[b]=[1],c';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('var b;var a;!function(){var _0=[1];b=_0[0]}();var c');
    });
    it('var id,destruct,destruct', function() {
      var s = 'var a,[b]=[1],[c]=[2]';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('var c;var b;var a;!function(){var _0=[1];b=_0[0]}();!function(){var _1=[2];c=_1[0]}()');
    });
    it('var destruct,destruct,id', function() {
      var s = 'var [a]=[0],[b]=[1],c';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('var b;var a;!function(){var _0=[0];a=_0[0]}();!function(){var _1=[1];b=_1[0]}();var c');
    });
    it('alias obj', function() {
      var s = 'var {x:y=1} = o';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('var y;!function(){var _0= o;y=_0["x"];if(!_0.hasOwnProperty("x"))y=1}()');
    });
    it('alias obj in array', function() {
      var s = 'var [{x:y=1}] = o';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('var y;!function(){var _0= o;var _1=_0[0];y=_1["x"];if(!_1.hasOwnProperty("x"))y=1}()');
    });
    it('alias obj in obj', function() {
      var s = 'var {x:{y:z=1}} = o';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('var z;!function(){var _0= o;var _1=_0["x"];z=_1["y"];if(!_1.hasOwnProperty("y"))z=1}()');
    });
    it('expr alias obj', function() {
      var s = '({x:y=1} = o)';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('(function(){var _0= o;y=_0["x"];if(!_0.hasOwnProperty("x"))y=1;return _0}())');
    });
    it('var multi obj', function() {
      var s = 'var a = 1, { x } = { "x": 2 }';
      Jsdc.reset();
      var res = Jsdc.parse(s);
      expect(res).to.eql('var x;var a = 1;!function(){var _0= { "x": 2 };x=_0["x"]}()');
    });
  });
  describe('Unicode string', function() {
    it('normal', function() {
      var s = '"\\u{10000}"';
      var res = Jsdc.parse(s);
      expect(res).to.eql('"\\ud800\\udc00"');
    });
    it('multi', function() {
      var s = '"\\u{10000}\\u{10000}"';
      var res = Jsdc.parse(s);
      expect(res).to.eql('"\\ud800\\udc00\\ud800\\udc00"');
    });
    it('ignore', function() {
      var s = '"\\\\u{10000}"';
      var res = Jsdc.parse(s);
      expect(res).to.eql('"\\\\u{10000}"');
    });
    it('not ignore', function() {
      var s = '"\\\\\\u{10000}"';
      var res = Jsdc.parse(s);
      expect(res).to.eql('"\\\\\\ud800\\udc00"');
    });
    it('prefix 2', function() {
      var s = '"\\u{10010}"';
      var res = Jsdc.parse(s);
      expect(res).to.eql('"\\ud800\\udc10"');
    });
    it('prefix 1', function() {
      var s = '"\\u{10110}"';
      var res = Jsdc.parse(s);
      expect(res).to.eql('"\\ud800\\udd10"');
    });
    it('prefix 0', function() {
      var s = '"\\u{11110}"';
      var res = Jsdc.parse(s);
      expect(res).to.eql('"\\ud804\\udd10"');
    });
    it('only remove {}', function() {
      var s = '"\\u{8888}"';
      var res = Jsdc.parse(s);
      expect(res).to.eql('"\\u8888"');
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
      expect(res).to.eql('var o = function(){var _0={_1:1};_0[a]=_0._1;delete _0._1;return _0}()');
    });
    it('in retstmt', function() {
      var s = 'return{a,b(){}}';
      var res = Jsdc.parse(s);
      expect(res).to.eql('return{a:a,b:function(){}}');
    });
    it('in arglist', function() {
      var s = 'fn({a,b(){}})';
      var res = Jsdc.parse(s);
      expect(res).to.eql('fn({a:a,b:function(){}})');
    });
  });
  describe('runntime', function() {
    it('open', function() {
      Jsdc.runtime(true);
      var res = require('./runtime');
      expect(res).to.eql(1);
    });
    it('close', function() {
      Jsdc.runtime(false);
      var filename = path.resolve(__dirname, './runtime.js');
      delete require.cache[filename];
      if(!originEs6) {
        expect(function() {
          require('./runtime');
        }).to.throwError();
      }
    });
    it('openAgain', function() {
      Jsdc.runtime(true);
      var res = require('./runtime');
      expect(res).to.eql(1);
    });
    it('closeAgain', function() {
      Jsdc.runtime(false);
      var filename = path.resolve(__dirname, './runtime.js');
      delete require.cache[filename];
      if(!originEs6) {
        expect(function() {
          require('./runtime');
        }).to.throwError();
      }
    });
  });
});