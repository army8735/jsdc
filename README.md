# Javascript Downcast
### transform ecmascript6 to ecmascript5

[![NPM version](https://badge.fury.io/js/jsdc.png)](https://npmjs.org/package/jsdc)
[![Build Status](https://travis-ci.org/army8735/jsdc.svg?branch=master)](https://travis-ci.org/army8735/jsdc)
[![Coverage Status](https://coveralls.io/repos/army8735/jsdc/badge.png)](https://coveralls.io/r/army8735/jsdc)
[![Dependency Status](https://david-dm.org/army8735/jsdc.png)](https://david-dm.org/army8735/jsdc)

## INSTALL
```
npm install jsdc
```

## 使用说明
* jsdc仅提供安全兼容的转换接口，并且不改变你的源代码行数一致性，这使得调试极为便利
* 智能识别es5语法，jsdc不会修改es5的部分
* 无需预置script脚本，绝不更改任何变量
* CommonJS/AMD/CMD自适应
* as simple as possible
* 仅转换可实现的语言部分，扩展库（如`Set`和`Map`）请使用`es6-shim`之类的库

### 已实现的部分
* 二进制和八进制的Number扩展
* Unicode的字符串增强
* Object属性增强
* block局部作用域
* let/const关键字
* 默认参数赋值
* rest扩展参数和spread扩展参数调用
* template模板
* for of循环
* class类实现
* extends类继承
* module模块
* ArrayComprehension数组推导
* ArrowFunction箭头函数
* yield语句
* Generator生成器函数
* 解构

## API

### Jsdc
* constructor(code:String = '') 传入需要转换的code
* parse(code:String = null):String 转换code，可以为空，否则会覆盖构造函数里传入的code
* define(d:Boolean):Boolean 读取/设置转换module为CommonJS时是否包裹define（即转为AMD/CMD），默认false
* ast():Object 返回解析后的语法树
* tokens():Array<Object> 返回解析后的词法单元序列

### 静态属性
* parse(code:String):String 可以直接调用静态方法转换，以省略new一个对象的步骤
* define(d:Boolean):Boolean 读取/设置转换module为CommonJS时是否包裹define（即转为AMD/CMD），默认false
* ast():Object 返回解析后的语法树
* tokens():Array<Object> 返回解析后的词法单元序列

## Demo
* demo目录下是一个web端的实时转换例子，本地浏览需要`npm install`安装依赖
* 依赖的语法解析器来自于`homunculus`：https://github.com/army8735/homunculus
* 在线地址：http://army8735.me/jsdc/demo/

## License
[MIT License]

## 语法转换规则

* 以下按实现逻辑顺序排列（如有逻辑关联，如let和block作用域）
* 确保转换后代码执行一致，调试行数一致

### Number数字扩展
`0b`或`0B`开头的二进制将使用`parseInt`转换：
```js
var i = 0b010, j = 0B101
```
```js
var i = parseInt("0b010", 2), j = parseInt("0B101", 2)
```
`0o`或`0O`开头的八进制也是如此（有人会用大写的字母O吗，和数字0根本看不出来区别）：
```js
var i = 0o456, j = 0O777
```
```js
var i = parseInt("0o456", 8), j = parseInt("0O777", 8)
```

### Unicode的字符串增强
`Unicode`编号大于`0xFFFF`的字符将会转移成2个`utf-8`拼接：
```js
'\u{10000}'
```
```js
'\uFFFF\u0001'
```
转义符也能正确识别：
```js
'\\u{10000}'
```
```js
'\\u{10000}'
```

### Object增强
赋值对象时`Object`的同名属性可以简写：
```js
var a = {o}
```
```js
var a = {o:o}
```
方法也是：
```js
var a = {o(){}}
```
```js
var a = {o:function(){}}
```
甚至可以用`[]`表明它是一个表达式：
```js
var a = {
['a'+'b'] : 1
}
```
```js
var a = function(){var _0_={
_1_: 1
};_0_['a'+'b']=_0_._1_;delete _0_._1_;return _0_}()
```
> 实现方法是先用个临时唯一变量替换掉表达式，最后再将它还原回来。

### var和函数迁移
将`var`申明迁移至最近的作用域起始处：
```js
function() {
  if(true) {
    var a = 1;
    let b = 2;
  }
}
```
```js
function() {var a;
  if(true) {
    a = 1;
    let b = 2;
  }
}
```
仅当必要时才迁移，否则保持原样（比如下面没有`let`）：
```js
function() {
  if(true) {
    var a = 1;
  }
}
```
> 示例中`let`和块级作用域尚未处理，后面会提到。

函数和var的性质一样，除了迁移还会改写为var形式：
```js
{function a(){}}
```
```js
var a;{a=function (){}}
```

### {}块级作用域
必要时将`{}`替换为`function`作用域：
```js
{
  let a = 1;
  function b(){}
}
```
```js
!function() {
  let a = 1;
  function b(){}
}();
```
`if`语句，`iterator`语句和`try`/`catch`/`finally`等也是，注意和纯`{}`语句插入匿名函数位置的异同：
```js
if(true) {
  let a = 1;
}
```
```js
if(true) {!function() {
  let a = 1;
}();}
```
> 示例中`let`尚未做处理，后面会提到。

### let/const关键字
将`let`和`const`替换为`var`：
```js
let a = 1;
const b;
```
```js
var a = 1;
var b;
```
注意和块级作用域的交互：
```js
{
  var a = 1;
  let b;
  const c = 1;
}
```
```js
var a;!function() {
  a = 1;
  var b;
  var c = 1;
}();
```
> 函数和`Generator`函数均默认块级作用域。

### 默认参数值
根据是否`undefined`赋值，它可以有多个：
```js
function method(a, b = 1) {
}
```
```js
function method(a, b ) {if(b ===void 0) b = 1;
}
```

### 扩展参数
将扩展参数通过`arguments`转换为数组：
```js
function method(a, ...args) {
}
```
```js
function method(a, args) {args = [].slice.call(arguments, 1);
}
```
方法执行则使用`apply`调用：
```js
fn(a, b, ...c)
```
```js
fn.apply(this, [a,b].concat(c))
```
如果调用者是成员表达式，context将从`this`变为主表达式：
```js
Math.max(...a)
```
```js
Math.max.apply(Math, [].concat(a))
```

### template模板
将模板转换为普通字符串，需要的情况下会包裹括号（确保运算符优先级正确性）：
```js
`template`
```
```js
"template"
```
模板中的引号将被转义：
```js
`"`
```
```js
"\""
```
模板中的变量会被替换：
```js
`${a}b`
```
```js
(a + "b")
```
注意变量标识符$也可以被转义：
```js
`\${a}b`
```
```js
"\${a}b"
```

### for of循环
将`of`改为`=`并添加`;`补完循环：
```js
for(a of b){
}
```
```js
for(a =b;;){
}
```
将赋值添加`.next()`并添加`.done`结束判断：
```js
for(a of b){
}
```
```js
for(a =b.next();!a.done;){
}
```
循环体内先赋值`.value`：
```js
for(a of b){
}
```
```js
for(a =b.next();!a.done;){a=a.value;
}
```
`var`语句同样处理：
```js
for(var a of b){
}
```
```js
for(var a =b.next();!a.done;){a=a.value;
}
```

### class类声明
将类声明改为`function`声明：
```js
class A{}
```
```js
function A(){}
```
`constructor`构造函数可省略，也可以显示声明：
```js
class A{
  constructor(a){this.a = a}
}
```
```js
//此行是空行，请忽略：由于github会忽略前面的空白，所以用注释代替
function A(a){this.a = a}

```
> 注意行对应关系，省略的话行位置是`class`声明行，否则是`constructor`声明行。

方法会改写成`prototype`的原型方法：
```js
class A{
  method(){}
}
```
```js
function A{}
A.prototype.method=function(){}

```
getter/setter会巧妙地设置到原型上：
```js
class A{
  get b(){}
  set c(d){}
}
```
```js
function A(){}
  A.prototype.b={get b(){}}["b"];
  A.prototype.c={set c(d){}}["c"];

```
`static`静态属性会附加在`function`本身：
```js
class A{
static F(){}
}
```
```js
function A(){}
A.F=function(){}

```

### extends类继承和super关键字
采用最广泛的寄生组合式继承：
```js
class A extends B{
constructor(){}
}
```
```js
function A(){}!function(){var _=Object.create(B.prototype);_.constructor=A;A.prototype=_;}();
function A(){}
Object.keys(B).forEach(function(k){A[k]=B[k]});
```
> 开头会附加上一段`prototype`原型和`constructor`构造器，标准的寄生组合式继承方法。

> 结尾会继承父类的静态属性。

`super`关键字直接改写为父类引用：
```js
class A extends B{
constructor(){super()}
}
```
```js
!function(){var _=Object.create(B.prototype);_.constructor=A;A.prototype=_;}();
function A(){B.call(this)}
Object.keys(B).forEach(function(k){A[k]=B[k]});
```
如果不是调用父类构造函数而是方法，则会这样：
```js
class A extends B{
constructor(){super.a()}
}
```
```js
!function(){var _=Object.create(B.prototype);_.constructor=A;A.prototype=_;}();
function A(){B.a.call(this)}
Object.keys(B).forEach(function(k){A[k]=B[k]});
```
默认构造器函数则会自动调用`super()`：
```js
class A extends B{
}
```
```js
function A(){B.call(this)}!function(){var _=Object.create(B.prototype);_.constructor=A;A.prototype=_}();
Object.keys(B).forEach(function(k){A[k]=B[k]});
```

### class表达式
和函数表达式一样，class也可以有表达式：
```js
var o = class{
  method(){}
}
```
```js
var o = function(){function _0_(){}
  _0_.prototype.method = function(){}
return _0_}()
```
> 由于表达式没有名字（也可以有），所以需要封装成立即执行的匿名函数并返回一个`class`声明。

> 有名字的话就用原有名字，否则依然临时唯一id。

> 注意匿名函数的结尾没有分号，因为本身是个`assignmentexpr`。

### module
只要出现了module/import/export语句，就认为文件是个模块，用`define`封装成AMD/CMD模块：
```js
module circle from "a"
```
```js
define(function(requrie,exports,module){module circle from "a"});
```
> 注意语句本身尚未做处理，下面会说明。为阅读方便，下面所有都省略了`define`封装。

也可以通过API设置来控制：
```js
jsdc.define(wrap:Boolean):Boolean
```
`module`转换为`require`：
```js
module circle from "a"
```
```js
var circle=require("a");
```
`import`也会转换为`require`：
```js
import "a"
```
```js
require("a");
```
`import`可以指定id：
```js
import a from "a"
```
```js
var a;!function(){var _0_=require("a");a=_0_.a}();
```
> 类似`_0_`变量是自动生成的，数字会自动累加，且不会和已有变量冲突。

在冲突时会自动跳过：
```js
import _0_ from "a"
```
```js
var _0_;!function(){var _1_=require("a");_0_=_1_.a}();
```
`import`还可以指定多个id：
```js
import a,b from "a"
```
```js
var a;var b;!function(){var _0_=require("a");a=_0_.a;b=_0_.b;}();
```
`import`可以用`{}`来赋值，注意里面`as`声明变量名的方法：
```js
import {a,b as c} from "a"
```
```js
var a;var c;!function(){var _0_=require("a");a=_0_.a;c=_0_.b;}();
```
`export * from ""`会将模块的导出赋给module.exports：
```js
export * from "a"
```
```js
!function(){var _0_=require("a");Object.keys(_0_).forEach(function(k){module.exports[k]=temp[k];});}();
```
`export`一个`var`语句时会自动赋值同名变量：
```js
export var a = 1
```
```js
var a;exports.a=a = 1
```
`export`一个方法或类时也一样：
```js
export function a(){}
export class A{}
```
```js
exports.a=a;function a(){}
exports.A=A;function A(){}
```
`export default`会直接赋给`module.exports`：
```js
export default a
```
```js
module.exports=a
```

### ArrayComprehension数组推导
可以代替`Array.map`方法：
```js
var a = [for(k of o)k]
```
```js
var a = function(){var k;var _0_=[];for(k in o){k=o[k];_0_.push(k)}return _0_}()
```
> 注意再次出现的临时变量`_0_`和上面提到的一致，不会冲突。

`if`语句可以替代`Array.filter`方法：
```js
var a = [for(k of o)if(k)k]
```
```js
var a = function(){var k;var _0_=[];for(k in o){k=o[k];if(k)_0_.push(k)}return _0_}()
```
嵌套组合使用也是可以的：
```js
var a = [for(a of b)for(c of a)if(c)c]
```
```js
var a = function(){var a;var c;var _0_=[];for(a in b){a=b[a];for(c in a){c=a[c];if(c)_0_.push(c)}}return _0_}()
```

### ArrowFunction箭头函数
转换为普通函数：
```js
var a = v => v
```
```js
var a = function(v) {return v}
```
括号形式的参数：
```js
var a = (b, c) => b + c
```
```js
var a = function(b, c) {return b + c}
```
带`{}`的函数体：
```js
var a = (b, c) => {return b - c}
```
```js
var a = function(b, c) {return b - c}
```

### yield语句
`yield`作为关键字只能出现在`Generator`中，会被替换为`return`：
```js
function *a() {
  yield
}
```
```js
function *a() {
  return
}
```
> `Generator`语句本身尚未做处理，后面会提到。

语句前会加上`arguments[0]`，模拟`next()`带上的一个参数：
```js
function *a() {
  var a = yield
}
```
```js
function *a() {
  var a = arguments[0];return
}
```
`yield`的返回值将变成一个对象的value：
```js
function *a() {
  var a = yield 1
}
```
```js
function *a() {
  var a = arguments[0];return {value:1}
}
```

### Generator生成器函数
它的实现比较复杂，首先是改写为普通函数：
```js
function *a(){
  yield 1
  yield 2
}
```
```js
function a(){
  arguments[0];return {value:1,done:false}
  arguments[0];return {value:2,done:false}
}
```
然后包裹：
```js
function *a(){
  yield 1
  yield 2
}
```
```js
var a=function(){return function(){return {next:a}};function a(){
  arguments[0];return {value:1,done:false}
  arguments[0];return {value:2,done:false}
}}();
```
> 这样每次调用它便能得到像es6中一样的一个具有`next()`方法的对象。

内部的a变量需要改写为一个唯一临时id（为什么后面会提到）：
```js
function *a(){
  yield 1
  yield 2
}
```
```js
var a=function(){return function(){return {next:_0_}};function _0_(){
  arguments[0];return {value:1,done:false}
  arguments[0];return {value:2,done:false}
}}();
```
再次添加一个唯一临时id作为state标识，来为实现`yield`功能做准备：
```js
function *a(){
  yield 1
  yield 2
}
```
```js
var a=function(){var _1_=0;return function(){return {next:_0_}};function _0_(){
  arguments[0];return {value:1,done:false}
  arguments[0];return {value:2,done:false}
}}();
```
当出现`yield`语句时，添加`switch`语句来模拟顺序执行：
```js
function *a(){
  yield 1
  yield 2
}
```
```js
var a=function(){var _1_=0;return function(){return {next:_0_}};function _0_(){
  switch(_1_++){case 0:arguments[0];return {value:1,done:false}
  case 1:arguments[0];return {value:1,done:false}}
}}();
```
同时函数里面的`var`声明需要前置，以免每次调用`next()`方法时又重新声明一遍失去了状态：
```js
function *a(){
  var a = 1;
  yield a++;
  yield a++;
}
```
```js
var a=function(){var _1_=0;return function(){return {next:_0_}};var a;function _0_(){
  switch(_1_++){case 0:a = 1;
  arguments[0];return {value:a++,done:false};
  case 1:arguments[0];return {value:a++,done:false;}
}}();
```
> 函数则不需要前置。

> 注意函数内有个同名变量`a`，这就是前面为什么要改函数名的原因。

添加`default`语句，更改最后一个`yield`的`done`为`true`：
```js
function *a(){
  var a = 1;
  yield a++;
  yield a++;
}
```
```js
var a=function(){var _6_=0;return function(){return {next:_7_}};var a;function _7_(){
 switch(_6_++){case 0:a = 1;
  arguments[0];return {value:a++,done:false};
  case 1:arguments[0];return {value:a++,done:true};default:;;return{done:true}}
}}();
```
`yield`还支持返回一个`Generator`，这就是一个递归：
```js
function *a(){
  yield * b
}
```
```js
var a=function(){var _0_=0;return function(){return{next:_1_}};function _1_(){
  switch(_0_++){case 0:arguments[0];var _2_=b();if(!_2_.done)_0_--;return _2_;default:;return{done:true}}
}}();
```
表达式也一样：
```js
~function *(){
}
```
```js
~function(){var _0_=0;return function (){return{next:_1_}};function _1_(){
}}()
```

### destructure解构
`var`声明变量时可以用数组：
```js
var [a] = [1]
```
```js
var a;!function(){var _0_= [1];a=_0_[0];}()
```
> 变量名会被前置，同时包裹执行一个匿名函数，将变量名赋值对应到正确的索引。

多个变量一样，注意逗号占位符：
```js
var [a,b,,c] = [1]
```
```js
var c;var b;var a;!function(){var _1_= [1];a=_1_[0];b=_1_[1];c=_1_[3]}()
```
也可以是对象：
```js
var {a} = {"a":1}
```
```js
var a;!function(){var _0_= {"a":1};a=_0_["a"]}()
```
> 注意变量名和键名要一致。

对象可以用`:`号更改引用：
```js
var {a,b:c} = {"a":1,"b":2}
```
```js
var a;!function(){var _0_= {"a":1,"b":2};a=_0_["a"];c=_0_["b"]}()
```
它们甚至可以互相嵌套递归：
```js
var [a,{b},{c:[d]}] = [1,{"b":2},{"c":[3]}]
```
```js
var d;var b;var a;!function(){var _0_= [1,{"b":2},{"c":[3]}];a=_0_[0];var _1_=_0_[1];b=_1_["b"];var _2_=_0_[2];var _3_=_2_["c"];d=_3_[0]}()
```
解构还允许在未定义的情况下默认赋值：
```js
var [a=1] = []
```
```js
var a;!function(){var _0_= [];a=_0_[0];if(a===void 0)a=1}()
```
表达式赋值也可以：
```js
({a=1} = {})
```
```js
(!function(){var _0_= {};a=_0_["a"];if(a===void 0)a=1}())
```
数组解构最后允许`rest`运算符：
```js
var [a, ...b] = [1, 2, 3]
```
```js
var b;var a;!function(){var _0_= [1, 2, 3];a=_0_[0];b=_0_.slice(1)}()
```