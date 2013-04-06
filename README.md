##transform ecmascript6 to ecmascript5

web目录下为书写符合AMD/CMD规范的js文件；server目录下为nodejs环境的module模块；java目录为性能考虑后续提供的java版本。

语法转换规则参见wiki：https://github.com/army8735/jsdc/wiki/%E8%AF%AD%E6%B3%95%E8%BD%AC%E6%8D%A2%E8%A7%84%E5%88%99

##使用方法

jsdc仅提供安全兼容的转换接口，并且不改变你的源代码行数一致性，这使得调试极为便利。

开发者应在开发环境部署web服务器，将需要开发的js映射代理，经由jsdc转换为结果代码。如此便可实现开发调试时书写易读结构化良好的es6代码，等到发布时再转化为兼容代码上线，满足不同环境浏览器运行。

由于js性能问题，解析大文件会造成耗时，所以良好的做法时解析前先在服务器端检查此js文件有无变更，有之后再调用jsdc，否则读取缓存。

##API

jsdc.parse(code:String):String

方法传入源代码，返回解析后的代码，如果出错，返回错误信息。

jsdc.tree():Object

获取解析后的语法树。此为内部接口，一般用不到。

# License

[MIT License]