define(function(require, exports) {
	var Lexer = require('./lexer/Lexer'),
		EcmascriptRule = require('./lexer/rule/EcmascriptRule'),
		Token = require('./lexer/Token'),
		Parser = require('./parser/Parser'),
		Node = require('./parser/Node'),
		character = require('./util/character'),
		index = 0,
		node = null;
	
	function join(node, ignore) {
		index = 0;
		var isToken = node.name() == 'Token',
			isVirtual = isToken && node.leaves().type() == Token.VIRTUAL,
			res = '';
		if(isToken) {
			if(!isVirtual) {
				res += node.leaves().content();
				while(ignore[++index]) {
					res += ignore[index].content();
				}
			}
		}
		else {
			node.leaves().forEach(function(leaf) {
				res += join(leaf, ignore, index);
			});
		}
		return res;
	}

	exports.parse = function(code) {
		var lexer = new Lexer(new EcmascriptRule());
		lexer.parse(code);
		var parser = new Parser(lexer);
		var ignore = {};
		try {
			node = parser.program();
			ignore = parser.ignore();
		} catch(e) {
			if(window.console) {
				console.error(e);
			}
			return e.toString();
		}
		return character.escapeHTML(join(node, ignore));
	};
	exports.tree = function() {
		return node;
	};
});