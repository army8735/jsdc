define(function(require, exports) {
	var Lexer = require('./lexer/Lexer'),
		EcmascriptRule = require('./lexer/rule/EcmascriptRule'),
		Token = require('./lexer/Token'),
		lexer = new Lexer(new EcmascriptRule()),
		character = require('./util/character');
	function join(tokens, start, end) {
		if(start === undefined) {
			start = 0;
		}
		if(end === undefined) {
			end = tokens.length;
		}
		else {
			end = Math.min(end, tokens.length);
		}
		var res = '';
		for(; start < end; start++) {
			res += tokens[start].content();
		}
		return res;
	}
	function getVars(index) {
	}
	exports.parse = function(tokens) {
		if(typeof tokens == 'string') {
			tokens = lexer.parse(tokens);
		}
		exports.topVar(tokens);
		return join(tokens);
	};
	exports.topVar = function(tokens) {
		if(typeof tokens == 'string') {
			tokens = lexer.parse(tokens);
		}
		var line = 1,
			context = [], //-1表示非作用域{，非负表示作用域起始{索引
			isFunction = false,
			depth = 0,
			record = [];
		outer:
		for(var i = 0, len = tokens.length; i < len; i++) {
			var token = tokens[i];
			if(token.type() == Token.LINE) {
				line++;
			}
			if(token.type() == Token.KEYWORD) {
				if(token.content() == 'var') {
					isFunction = false;
					token = tokens[i+1];
					if(!token || (token.type() != Token.LINE && token.type() != Token.BLANK && token.type() != Token.TAB)) {
						throw new Error('SyntaxError: missing variable name' + line + '\n' + join(tokens.slice(i, i + 2)));
					}
					var vars = [],
						val = false;
					for(var j = i + 2; j < len; j++) {
						token = tokens[j];
						if(token.type() == Token.BLANK || token.type() == Token.TAB) {
							continue;
						}
						else if(token.type() == Token.KEYWORD) {
							break;
						}
						else if(token.type() == Token.ID) {
							if(val) {
								i = j + 1;
								continue outer;
							}
							val = true;
							vars.push(token.content());
						}
						else if(token.type() == Token.NUMBER) {
							if(val) {
								val = false;
							}
							else {
								i = j + 1;
								continue outer;
							}
						}
						else if(token.type() == Token.LINE) {
							if(val) {
								break;
							}
						}
						else if(token.type() == Token.SIGN) {
							if(token.content() == character.COMMA) {
								val = false;
							}
							else if(token.content() == character.EQUAL) {
								val = true;
							}
							else {
								break;
							}
						}
					}
					if(!vars.length) {
						throw new Error('SyntaxError: missing variable name' + line + '\n' + join(tokens.slice(i, j)));
					}console.log(vars.join(','));
				}
				else if(token.content() == 'function') {
					isFunction = true;
				}
				else {
					isFunction = false;
				}
			}
			else if(token.type() == Token.SIGN) {
				if(token.content() == '{') {
					if(isFunction) {
						isFunction = false;
						context.push(i);
					}
					else {
						context.push(-1);
					}
				}
				else if(token.content() == '}') {
					context.pop();
				}
			}
			else {
				line += character.count(token.content(), Token.LINE);
			}
		}
		return exports;
	};
});