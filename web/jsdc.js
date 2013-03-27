define(function(require, exports) {
	var Lexer = require('./lexer/Lexer'),
		EcmascriptRule = require('./lexer/rule/EcmascriptRule'),
		Token = require('./lexer/Token'),
		Parser = require('./parser/Parser'),
		lexer = new Lexer(new EcmascriptRule()),
		parser = new Parser(lexer),
		character = require('./util/character');

	exports.parse = function(code) {
		return '';
	};
});