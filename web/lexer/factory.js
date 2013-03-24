define(function(require, exports) {
	var Lexer = require('./Lexer'),
		EcmascriptRule = require('./rule/EcmascriptRule');
	exports.lexer = function(syntax) {
		switch(syntax.toLowerCase()) {
			case "js":
			case "javascript":
			case "ecmascript":
			case "jscript":
			case "as":
			case "as3":
			case "actionscript":
			case "actionscript3":
				return new Lexer(new EcmascriptRule());
			case "java":
				return new Lexer(new JavaRule());
			case "c":
			case "c++":
			case "cpp":
			case "cplusplus":
				return new Lexer(new CRule());
			/*case "py":
			case "python":
				return new PythonLexer(new PythonRule());
			case "xml":
				return new XmlLexer();
			case "css":
				return new CssLexer(new CssRule());
			case "htm":
			case "html":
				return new HtmlLexer();
			case "php":
				return new PhpLexer();
			default:
				return new LanguageLexer(new UnknowRule());*/
		}
	};
});