define(function(require, exports) {
	var Class = require('../util/Class'),
		character = require('../util/character'),
		Lexer = require('../lexer/Lexer'),
		Token = require('../lexer/Token'),
		Parser = Class(function(lexer) {
			this.lexer = lexer;
			this.look = null;
			this.tokens = lexer.tokens();
			this.line = 1;
			this.index = 0;
			if(this.tokens.length) {
				this.move();
			}
		}).methods({
			program: function() {
				this.selements();
			},
			selement: function() {
				if(this.look.content() == 'function') {
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
				if(this.look.type() == Token.ID) {
					this.labstmt();
					return;
				}
				switch(this.look.content()) {
					case 'var':
						this.varstmt();
					break;
					case '{':
						this.block();
					break;
					case ';':
						this.emptstmt();
					break;
					case 'if':
						this.ifstmt();
					break;
					case 'do':
					case 'while':
					case 'for':
						this.itrtstmt();
					break;
					case 'continue':
						this.cntnstmt();
					break;
					case 'break':
						this.brkstmt();
					break;
					case 'return':
						this.retstmt();
					break;
					case 'with':
						this.withstmt();
					break;
					case 'switch':
						this.swchstmt();
					break;
					case 'throw':
						this.thrstmt();
					break;
					case 'try':
						this.trystmt();
					break;
					case 'debugger':
						this.debstmt();
					break;
					default:
						throw new Error('SyntaxError');
				}
			},
			stmts: function() {
				this.stmt();
				if(this.look != '}') {
					this.stmts();
				}
			},
			varstmt: function() {
				this.match('var'); 
				this.vardecls();
				this.match(';');
			},
			vardecl: function() {
				this.match(Token.ID);
				if(this.look.content() == '=') {
					this.assign();
				}
			},
			vardecls: function() {
				this.vardecl();
				while(this.look.content() == ',') {
					this.move();
					this.vardecl();
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
			block: function() {
				this.match('{');
				if(this.look.content() != '}') {
					this.stmts();
				}
				this.match('}');
			},
			emptstmt: function() {
				this.match(';');
			},
			ifstmt: function() {
				this.match('if');
				this.match('(');
				this.expr();
				this.match(')');
				this.stmt();
				if(this.look.content() == 'else') {
					this.match('else');
					this.stmt();
				}
			},
			itrtstmt: function() {
				switch(this.look.content()) {
					case 'do':
						this.move();
						this.stmt();
						this.match('while');
						this.match('(');
						this.expr();
						this.match(')');
						this.match(';');
					break;
					case 'while':
						this.move();
						this.match('(');
						this.expr();
						this.match(')');
						this.stmt();
					break;
					case 'for':
						this.move();
						this.match('(');
						if(this.look.content() == 'var') {
							this.move();
							this.varcl();
							if(this.look.content() == 'in') {
								this.expr();
							}
							else {
								if(this.look.content() != ';') {
									this.varcls();
								}
								this.match(';');
								if(this.look.content() != ';') {
									this.expr();
								}
								this.match(';');
								if(this.look.content() != ')') {
									this.expr();
								}
							}
						}
						else {
							if(this.look.content() != ';') {
								this.expr();
							}
							this.match(';');
							if(this.look.content() != ';') {
								this.expr();
							}
							this.match(';');
							if(this.look.content() != ')') {
								this.expr();
							}
						}
						this.match(')');
						this.stmt();
				}
			},
			cntnstmt: function() {
				this.match('continue', true);
				if(this.look.type() == Token.ID || this.look.type() == Token.LINE) {
					this.move();
				}
				this.match(';');
			},
			brkstmt: function() {
				this.match('break', true);
				if(this.look.type() == Token.ID || this.look.type() == Token.LINE) {
					this.move();
				}
				this.match(';');
			},
			retstmt: function() {
				this.match('return', true);
				if(this.look.content() == ';') {
					this.move();
				}
				else if(this.look.type() == Token.LINE) {
					this.move();
				}
				else {
					this.expr();
				}
				this.match(';');
			},
			withstmt: function() {
				this.match('with');
				this.match('(');
				this.expr();
				this.match(')');
				this.stmt();
			},
			swchstmt: function() {
				this.match('switch');
				this.match('(');
				this.expr();
				this.match(')');
				this.caseblock();
			},
			caseblock: function() {
				this.match('{');
				if(this.look.content() != '}') {
					if(this.look.content != 'default') {
						this.caseclauses();
					}
					else {
						this.dftclause();
					}
				}
				this.match('{');
			},
			caseclauses: function() {
				this.caseclause();
				if(this.look.content() != '}' && this.look.content() != 'default') {
					this.caseclauses();
				}
			},
			caseclause: function() {
				this.match('case');
				this.expr();
				this.match(':');
				if(this.look.content() != 'case' && this.look.content() != 'break' && this.look.content() != '}') {
					this.stmts();
				}
			},
			dftclause: function() {
				this.match('default');
				this.match(':');
				if(this.look.content() != '}') {
					this.stmts();
				}
			},
			labstmt: function() {
				this.match(Token.ID);
				this.match(':');
				this.stmt();
			},
			thrstmt: function() {
				this.match('throw', true);
				this.expr();
				this.match(';');
			},
			trystmt: function() {
				this.match('try');
				this.block();
				if(this.look.content() == 'catch') {
					this.cach();
					if(this.look.content() == 'finally') {
						this.finl();
					}
				}
				else {
					this.finl();
				}
			},
			cach: function() {
				this.match('catch');
				this.match('(');
				this.match(Token.ID);
				this.match(')');
				this.block();
			},
			finl: function() {
				this.match('finally');
				this.block();
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
				else if(this.look.content() == ',') {
					this.match(',');
					this.match(Token.ID);
				}
				this.fparams();
			},
			fnbody: function() {
				if(this.look.content() != '}') {
					this.selements();
				}
			},
			match: function(type, line, msg) {
				if(typeof line != 'boolean') {
					line = false;
					msg = line;
				}
				if(typeof type == 'string') {
					if(this.look.content() == type) {
						this.move(line);
					}
					else {
						throw new Error('SyntaxError: missing ' + type + ' line ' + this.line + (msg ? '\n' + msg : ''));
					}
				}
				else if(typeof type == 'number') {
					if(this.look.type() == type) {
						this.move(line);
					}
					else {
						throw new Error('SyntaxError: missing ' + Token.type(type) + ' line ' + this.line + (msg ? '\n' + msg : ''));
					}
				}
			},
			move: function(line) {
				do {
					if(this.tokens.length == 0) {
						this.look = null;
						break;
					}
					this.look = this.tokens.shift();
					if(line && this.look.type() == Token.LINE) {
						this.line++;
						break;
					}
					if(line && this.look.type() == Token.COMMENT) {
						var n = character.count(Token.content(), character.LINE);
						if(n > 0) {
							this.line += n;
							break;
						}
					}
					if(this.look.type() == Token.LINE) {
						this.line++;
					}
					else if(this.look.type() == Token.COMMENT) {
						this.line += character.count(Token.content(), character.LINE);
					}
					this.index++;
				} while([Token.BLANK, Token.TAB, Token.ENTER, Token.LINE, Token.COMMENT].indexOf(this.look.type()) != -1)
			}
		});
	return Parser;
});