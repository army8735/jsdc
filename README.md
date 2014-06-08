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

## 语法转换规则
https://github.com/army8735/jsdc/wiki/%E8%BD%AC%E6%8D%A2%E8%A7%84%E5%88%99

## 使用说明
* jsdc仅提供安全兼容的转换接口，并且不改变你的源代码行数一致性，这使得调试极为便利。
* 智能识别es5语法，jsdc不会修改es5的部分。
* CommonJS/AMD/CMD自适应。
* as simple as possible。
* 仅转换可实现的语言部分，扩展库（如`Set`和`Map`）请使用`es6-shim`之类的库。

### 已实现的部分
* 二进制和八进制的Number扩展
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

## API

### Jsdc
* constructor(code:String = '') 传入需要转换的code
* parse(code:String = null):String 转换code，可以为空，否则会覆盖构造函数里传入的code
* define(d:Boolean):Boolean 读取/设置转换module为CommonJS时是否包裹define（即转为AMD/CMD），默认false

### 静态属性
* parse(code:String):String 可以直接调用静态方法转换，以省略new一个对象的步骤
* define(d:Boolean):Boolean 读取/设置转换module为CommonJS时是否包裹define（即转为AMD/CMD），默认false

## Demo
* demo目录下是一个web端的实时转换例子，本地浏览需要`npm install`安装依赖
* 在线地址：http://army8735.me/jsdc/demo/

## License
[MIT License]