define(function(require, exports, module) {
	var Class = require('../util/Class'),
		character = require('../util/character'),
		Lexer = require('../lexer/Lexer'),
		Token = require('../lexer/Token'),
		Node = require('./Node'),
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
				var node = new Node('program');
				node.add(this.selements());
				return node;
			},
			selement: function() {
				var node = new Node('selement');
				if(this.look.content() == 'function') {
					node.add(this.fndecl());
				}
				else {
					node.add(this.stmt());
				}
				return node;
			},
			selements: function() {
				var node = new Node('selements');
				while(this.look) {
					node.add(this.selement());
				}
				return node;
			},
			stmt: function() {
				var node = new Node('stmt');
				if(this.look.type() == Token.ID) {
					node.add(this.labstmt());
					return node;
				}
				switch(this.look.content()) {
					case 'var':
						node.add(this.varstmt());
					break;
					case '{':
						node.add(this.block());
					break;
					case ';':
						node.add(this.emptstmt());
					break;
					case 'if':
						node.add(this.ifstmt());
					break;
					case 'do':
					case 'while':
					case 'for':
						node.add(this.iterstmt());
					break;
					case 'continue':
						node.add(this.cntnstmt());
					break;
					case 'break':
						node.add(this.brkstmt());
					break;
					case 'return':
						node.add(this.retstmt());
					break;
					case 'with':
						node.add(this.withstmt());
					break;
					case 'switch':
						node.add(this.swchstmt());
					break;
					case 'throw':
						node.add(this.thrstmt());
					break;
					case 'try':
						node.add(this.trystmt());
					break;
					case 'debugger':
						node.add(this.debstmt());
					break;
					default:
						throw new Error('SyntaxError');
				}
				return node;
			},
			stmts: function() {
				var node = new Node('stmts');
				node.add(this.stmt());
				while(this.look.content() != '}') {
					node.add(this.stmt());
				}
				return node;
			},
			varstmt: function() {
				var node = new Node('varstmt');
				node.add(
					this.match('var'),
					this.vardecls(),
					this.match(';')
				);
				return node;
			},
			vardecl: function() {
				var node = new Node('vardeclation');
				node.add(this.match(Token.ID));
				if(this.look.content() == '=') {
					node.add(this.assign());
				}
				return node;
			},
			vardecls: function() {
				var node = new Node('vardeclations');
				node.add(this.vardecl());
				while(this.look.content() == ',') {
					node.add(
						this.move(),
						this.vardecl()
					);
				}
				return node;
			},
			assign: function() {
				var node = new Node('assign');
				node.add(this.match('='));
				switch(this.look.type()) {
					case Token.ID:
					case Token.NUMBER:
						node.add(this.move());
					break;
					default:
						throw new Error('todo...');
				}
				return node;
			},
			block: function() {
				var node = new Node('block');
				node.add(this.match('{'));
				if(this.look.content() != '}') {
					node.add(this.stmts());
				}
				node.add(this.match('}'));
				return node;
			},
			emptstmt: function() {
				var node = new Node('emptystmt');
				node.add(this.match(';'));
				return node;
			},
			ifstmt: function() {
				var node = new Node('ifstmt');
				node.add(
					this.match('if'),
					this.match('('),
					this.expr(),
					this.match(')'),
					this.stmt()
				);
				if(this.look.content() == 'else') {
					node.add(
						this.match('else'),
						this.stmt()
					);
				}
				return node;
			},
			iterstmt: function() {
				var node = new Node('iteratorstmt');
				switch(this.look.content()) {
					case 'do':
						node.add(
							this.move(),
							this.stmt(),
							this.match('while'),
							this.match('('),
							this.expr(),
							this.match(')'),
							this.match(';')
						);
					break;
					case 'while':
						node.add(
							this.move(),
							this.match('('),
							this.expr(),
							this.match(')'),
							this.stmt()
						);
					break;
					case 'for':
						node.add(
							this.move(),
							this.match('(')
						);
						if(this.look.content() == 'var') {
							node.add(
								this.move(),
								this.varcl()
							);
							if(this.look.content() == 'in') {
								node.add(this.expr());
							}
							else {
								if(this.look.content() != ';') {
									node.add(this.varcls());
								}
								node.add(this.match(';'));
								if(this.look.content() != ';') {
									node.add(this.expr());
								}
								node.add(this.match(';'));
								if(this.look.content() != ')') {
									node.add(this.expr());
								}
							}
						}
						else {
							if(this.look.content() != ';') {
								node.add(this.expr());
							}
							node.add(this.match(';'));
							if(this.look.content() != ';') {
								node.add(this.expr());
							}
							node.add(this.match(';'));
							if(this.look.content() != ')') {
								node.add(this.expr());
							}
						}
						node.add(this.match(')'));
						node.add(this.stmt());
				}
			},
			cntnstmt: function() {
				var node = new Node('continuestmt');
				node.add(this.match('continue', true));
				if(this.look.type() == Token.ID || this.look.type() == Token.LINE) {
					node.add(this.move());
				}
				node.add(this.match(';'));
				return node;
			},
			brkstmt: function() {
				var node = new Node('breakstmt');
				node.add(this.match('break', true));
				if(this.look.type() == Token.ID || this.look.type() == Token.LINE) {
					node.add(this.move());
				}
				node.add(this.match(';'));
			},
			retstmt: function() {
				var node = new Node('returnstmt');
				node.add(this.match('return', true));
				if(this.look.content() == ';') {
					node.add(this.move());
				}
				else if(this.look.type() == Token.LINE) {
					node.add(this.move());
				}
				else {
					node.add(this.expr());
				}
				node.add(this.match(';'));
				return node;
			},
			withstmt: function() {
				var node = new Node('withstmt');
				node.add(
					this.match('with'),
					this.match('('),
					this.expr(),
					this.match(')'),
					this.stmt()
				);
			},
			swchstmt: function() {
				var node = new Node('switchstmt');
				node.add(
					this.match('switch'),
					this.match('('),
					this.expr(),
					this.match(')'),
					this.caseblock()
				);
			},
			caseblock: function() {
				var node = new Node('caseblock');
				node.add(this.match('{'));
				if(this.look.content() != '}') {
					if(this.look.content != 'default') {
						node.add(this.caseclauses());
					}
					else {
						node.add(this.dftclause());
					}
				}
				node.add(this.match('{'));
				return node;
			},
			caseclauses: function() {
				var node = new Node('caseclauses');
				node.add(this.caseclause());
				while(this.look.content() != '}' && this.look.content() != 'default') {
					node.add(this.caseclauses());
				}
			},
			caseclause: function() {
				var node = new Node('caseclause');
				node.add(
					this.match('case'),
					this.expr(),
					this.match(':')
				);
				if(this.look.content() != 'case' && this.look.content() != 'break' && this.look.content() != '}') {
					node.add(this.stmts());
				}
				return node;
			},
			dftclause: function() {
				var node = new Node('defaultclause');
				node.add(
					this.match('default'),
					this.match(':')
				);
				if(this.look.content() != '}') {
					node.add(this.stmts());
				}
				return node;
			},
			labstmt: function() {
				var node = new Node('labelstmt');
				node.add(
					this.match(Token.ID),
					this.match(':'),
					this.stmt()
				);
			},
			thrstmt: function() {
				var node = new Node('throwstmt');
				node.add(
					this.match('throw', true),
					this.expr(),
					this.match(';')
				);
			},
			trystmt: function() {
				var node = new Node('trystmt');
				node.add(
					this.match('try'),
					this.block()
				);
				if(this.look.content() == 'catch') {
					node.add(this.cach());
					if(this.look.content() == 'finally') {
						node.add(this.finl());
					}
				}
				else {
					node.add(this.finl());
				}
				return node;
			},
			cach: function() {
				var node = new Node('catch');
				node.add(
					this.match('catch'),
					this.match('('),
					this.match(Token.ID),
					this.match(')'),
					this.block()
				);
				return node;
			},
			finl: function() {
				var node = new Node('finally');
				node.add(
					this.match('finally'),
					this.block()
				);
				return node;
			},
			fndecl: function() {
				var node = new Node('functiondeclation');
				node.add(
					this.match('function'),
					this.match(Token.ID),
					this.match('(')
				);
				if(this.look.type() == Token.ID) {
					node.add(this.fnparams());
				}
				node.add(
					this.match(')'),
					this.match('{'),
					this.fnbody(),
					this.match('}')
				);
				return node;
			},
			fnparams: function() {
				var node = new Node('functionparams');
				node.add(this.fnparam());
				while(this.look.content() == ',') {
					node.add(
						this.match(','),
						this.fnparam()
					);
				}
				return node;
			},
			fnparam: function() {
				var node = new Node('functionparam');
				node.add(this.match(Token.ID));
				return node;
			},
			fnbody: function() {
				var node = new Node('funtionbody');
				if(this.look.content() != '}') {
					node.add(this.selements());
				}
				return node;
			},
			expr: function() {
			},
			match: function(type, line, msg) {
				if(typeof line != 'boolean') {
					line = false;
					msg = line;
				}
				if(typeof type == 'string') {
					if(this.look.content() == type) {
						var l = this.look;
						this.move(line);
						return l;
					}
					else {
						throw new Error('SyntaxError: missing ' + type + ' line ' + this.line + (msg ? '\n' + msg : ''));
					}
				}
				else if(typeof type == 'number') {
					if(this.look.type() == type) {
						var l = this.look;
						this.move(line);
						return l;
					}
					else {
						throw new Error('SyntaxError: missing ' + Token.type(type) + ' line ' + this.line + (msg ? '\n' + msg : ''));
					}
				}
			},
			move: function(line) {
				var l = this.look;
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
				} while([Token.BLANK, Token.TAB, Token.ENTER, Token.LINE, Token.COMMENT].indexOf(this.look.type()) != -1);
				return l;
			}
		});
	module.exports = Parser;
});