define(function(require, exports) {
	var Lexer = require('./lexer/Lexer'),
		EcmascriptRule = require('./lexer/rule/EcmascriptRule'),
		Token = require('./lexer/Token'),
		Parser = require('./parser/Parser'),
		character = require('./util/character');

	exports.parse = function(code) {
		var lexer = new Lexer(new EcmascriptRule());
		lexer.parse(code);
		var parser = new Parser(lexer);
		parser.program();
		return '';
	};
});