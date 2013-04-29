define(function(require, exports) {
	var Lexer = require('./lexer/Lexer'),
		EcmascriptRule = require('./lexer/rule/EcmascriptRule'),
		Token = require('./lexer/Token'),
		ParserR = require('./parser/ParserR'),
		Node = require('./parser/Node'),
		character = require('./util/character'),
		node;

	exports.parse = function(code) {
		var lexer = new Lexer(new EcmascriptRule()),
			parser = new ParserR(lexer),
			ignore = {};
		try {
			token = lexer.parse(code);
			node = parser.program();
			ignore = parser.ignore();
		} catch(e) {
			if(window.console) {
				console.error(e);
			}
		}
	};
	exports.tree = function() {
		return node;
	};
	exports.token = function() {
		return token;
	};
});