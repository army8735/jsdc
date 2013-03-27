define(function(require, exports) {
	var Class = require('../util/Class'),
		Lexer = require('../lexer/Lexer'),
		Token = require('../lexer/Token'),
		Parser = Class(function(lexer) {
			this.lexer = lexer;
			this.look = null;
			this.tokens = lexer.tokens();
			if(this.tokens.length) {
				this.move();
			}
		}).methods({
			program: function() {
				if(this.look) {
					switch(this.look.val()) {
						case '{':
							this.block();
							break;
						default:
							this.stmts();
					}
				}
			},
			block: function() {
				 this.match('{');
				 stmts();
				 this.match('}');
			},
			stmts: function() {
				switch(this.look.val()) {
					case '}':
						break;
					case 'var':
						this.move();
						decls();
						break;
					case 'function':
						this.func();
						break;
					default: 
						this.stmt();
						this.stmts();
				}
			},
			stmt: function() {
			},
			decls: function() {
				outer:
				switch(this.look.type()) {
					case Token.ID:
						decl();
						break;
					case Token.SIGN:
						switch(this.look.val()) {
							case ';':
							case '\n':
								this.move();
								break outer;
							default:
								throw new Error('SyntaxError: missing variable name');
						}
						break;
					default:
						throw new Error('SyntaxError: missing variable name');
				}
			},
			decl: function() {
			},
			declAssign: function() {
				this.match('=');
				while(this.look.type() == Token.LINE) {
					this.move();
				}
				switch(this.look.val()) {
					case Token.ID:
						this.move();
						break;
					case Token.NUMBER:
						this.move();
						break;
					default:
						throw new Error('SyntaxError: missing ; before statement');
				}
				switch(this.look.type()) {
					case ';':
						this.move();
						break;
					case '\n':
						this.move();
						break;
					default:
						throw new Error('SyntaxError: missing ; before statement');
				}
			},
			assign: function() {
			},
			func: function() {
			},
			eof: function() {
				switch(this.look.type()) {
					case ';':
					case '\n':
						this.move();
						break;
					default:
						throw new Error('SyntaxError: missing ; before statement');
				}
			},
			match: function(type) {
				if(typeof type == 'string') {
					if(this.look.val() == type) {
						this.move();
					}
					else {
						throw new Error('SyntaxError: expect a ' + type);
					}
				}
				else if(typeof type == 'number') {
					if(this.look.type() == type) {
						this.move();
					}
					else {
						throw new Error('SyntaxError: expect a ' + Token.type(type));
					}
				}
			},
			move: function() {
				do {
					this.look = tokens.shift();
				} while(this.look.type() != Token.BLANK || this.look.type() != Token.TAB || this.look.type() != Token.COMMENT);
			},
			ignoreEnter: function() {
				while(this.look.type() == Token.LINE) {
					this.move();
				}
			}
		});
	return Parser;
});