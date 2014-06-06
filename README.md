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

https://github.com/army8735/jsdc/wiki/%E8%AF%AD%E6%B3%95%E8%BD%AC%E6%8D%A2%E8%A7%84%E5%88%99

## 使用说明

* jsdc仅提供安全兼容的转换接口，并且不改变你的源代码行数一致性，这使得调试极为便利。
* 智能识别es5语法，jsdc会原封不动地返回它。
* CommonJS/AMD/CMD自适应。

## API

### JSDC
* constructor(code:String = ''):String 传入需要转换的code
* parse(code:String = null):String 转换code，可以为空，否则会覆盖构造函数里传入的code

### 静态属性
* parse(code:String):String 可以直接调用静态方法转换，以省略new一个对象的步骤

## License

[MIT License]