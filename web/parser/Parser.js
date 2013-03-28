define(function(require, exports) {
	var Class = require('../util/Class'),
		character = require('../util/character'),
		Lexer = require('../lexer/Lexer'),
		Token = require('../lexer/Token'),
		Parser = Class(function(lexer) {
			this.lexer = lexer;
			this.look = null;
			this.tokens = lexer.tokens();
			this.count = 1;
			this.index = 0;
			if(this.tokens.length) {
				this.move();
			}
		}).methods({
			program: function() {
				this.selements();
			},
			selement: function() {
				if(this.look.val() == 'function') {
					this.fndecl();
				}
				else {
					this.stmt();
				}
			},
			selements: function() {
				if(this.look) {
					this.selement();
					this.selements();
				}
			},
			stmt: function() {
				switch(this.look.val()) {
					case 'var':
						this.varstmt();
					break;
					case '{':
						this.block();
					break;
					default:
						throw new Error('todo...');
				}
			},
			stmts: function() {
			},
			block: function() {
				this.match('{');
				throw new Error('todo...');
			},
			condition: function() {
				this.match('if');
				this.match('(');
			},
			varstmt: function() {
				this.match('var'); 
				this.vardecl();
				this.vardecls();
				this.match(';');
			},
			vardecl: function() {
				this.match(Token.ID);
				if(this.look.val() == '=') {
					this.assign();
				}
			},
			vardecls: function() {
				if(this.look.val() == ',') {
					this.move();
					this.vardecl();
					this.vardecls();
				}
			},
			assign: function() {
				this.match('=');
				switch(this.look.type()) {
					case Token.ID:
					case Token.NUMBER:
						this.move();
					break;
					default:
						throw new Error('todo...');
				}
			},
			fndecl: function() {
				this.match('function');
				this.match(Token.ID);
				this.match('(');
				if(this.look.type() == Token.ID) {
					this.fparams();
				}
				this.match(')');
				this.match('{');
				this.fnbody();
				this.match('}');
			},
			fparams: function() {
				if(this.look.type() == Token.ID) {
					this.match(Token.ID);
				}
				else if(this.look.val() == ',') {
					this.match(',');
					this.match(Token.ID);
				}
				this.fparams();
			},
			fnbody: function() {
				if(this.look.val() != '}') {
					this.selements();
				}
			},
			match: function(type, msg) {
				if(typeof type == 'string') {
					if(this.look.val() == type) {
						this.move();
					}
					else {
						throw new Error('SyntaxError: missing ' + type + (msg ? ' ' + msg : ''));
					}
				}
				else if(typeof type == 'number') {
					if(this.look.type() == type) {
						this.move();
					}
					else {
						throw new Error('SyntaxError: missing ' + Token.type(type) + (msg ? ' ' + msg : ''));
					}
				}
			},
			move: function() {
				do {
					if(this.tokens.length == 0) {
						this.look = null;
						break;
					}
					this.look = this.tokens.shift();
					if(this.look.type() == Token.LINE) {
						this.count++;
					}
					else if(this.look.type() == Token.COMMENT) {
						this.count += character.count(Token.val(), character.LINE);
					}
					this.index++;
				} while([Token.BLANK, Token.TAB, Token.ENTER, Token.LINE, Token.COMMENT].indexOf(this.look.type()) != -1)
			}
		});
	return Parser;
});