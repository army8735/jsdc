define(function(require, exports) {
	var Lexer = require('./lexer/Lexer'),
		EcmascriptRule = require('./lexer/rule/EcmascriptRule'),
		Token = require('./lexer/Token'),
		Parser = require('./parser/Parser'),
		Node = require('./parser/Node'),
		character = require('./util/character'),
		node,
		res = '';
	
	function join(node) {
		var isToken = node.name() == 'Token',
			isVirtual = isToken && node.leaves().type() == Token.VIRTUAL;
		if(isToken) {
			if(!isVirtual) {
				res += node.leaves().content();
			}
		}
		else {
			node.leaves().forEach(function(leaf) {
				join(leaf);
			});
		}
		return res;
	}

	exports.parse = function(code) {
		var lexer = new Lexer(new EcmascriptRule());
		lexer.parse(code);
		var parser = new Parser(lexer);
		try {
			node = parser.program();
		} catch(e) {
			if(console) {
				console.error(e);
			}
			node = null;
			return e.toString();
		}
		return character.escapeHTML(join(node));
	};
	exports.tree = function() {
		return node;
	};
});