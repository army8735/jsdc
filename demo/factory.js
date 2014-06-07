define(function(require, exports) {
	var Lexer = require('./lexer/Lexer'),
		CssLexer = require('./lexer/CssLexer'),
		EcmascriptRule = require('./lexer/rule/EcmascriptRule'),
		CssRule = require('./lexer/rule/CssRule');
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
			case "css":
			case "css2":
			case "css3":
				return new CssLexer(new CssRule());
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