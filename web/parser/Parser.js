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
			this.col = 1;
			this.index = 0;
			if(this.tokens.length) {
				this.move();
			}
		}).methods({
			program: function() {
				var node = new Node('program');
				if(this.look) {
					node.add(this.selements());
				}
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
				node.add(this.selement());
				while(this.look && ['var', '{', ';', 'if', 'do', 'while', 'for', 'continue', 'break', 'return', 'with', 'switch', 'throw', 'try', 'debugger', 'function'].indexOf(this.look.content()) != -1) {
					node.add(this.selement());
				}
				return node;
			},
			stmt: function() {
				var node = new Node('stmt');
				if(!this.look) {
					this.error();
				}
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
						this.error();
				}
				return node;
			},
			stmts: function() {
				var node = new Node('stmts');
				node.add(this.stmt());
				while(this.look && ['var', '{', ';', 'if', 'else', 'do', 'while', 'for', 'continue', 'break', 'return', 'with', 'switch', 'throw', 'try', 'debugger'].indexOf(this.look.content()) != -1) {
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
				var node = new Node('vardecl');
				node.add(this.match(Token.ID));
				if(this.look && this.look.content() == '=') {
					node.add(this.assign());
				}
				return node;
			},
			vardecls: function() {
				var node = new Node('vardecls');
				node.add(this.vardecl());
				while(this.look && this.look.content() == ',') {
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
				if(!this.look) {
					this.error();
				}
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
				if(this.look && this.look.content() != '}') {
					node.add(this.stmts());
				}
				node.add(this.match('}'));
				return node;
			},
			emptstmt: function() {
				var node = new Node('emptstmt');
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
				if(this.look && this.look.content() == 'else') {
					node.add(
						this.match('else'),
						this.stmt()
					);
				}
				return node;
			},
			iterstmt: function() {
				var node = new Node('iterstmt');
				if(!this.look) {
					this.error();
				}
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
						if(!this.look) {
							this.error();
						}
						if(this.look.content() == 'var') {
							node.add(
								this.move(),
								this.vardecl()
							);
							if(!this.look) {
								this.error();
							}
							if(this.look.content() == 'in') {
								node.add(this.expr());
							}
							else {
								if(this.look.content() == ',') {
									node.add(
										this.move(),
										this.vardecls()
									);
								}
								if(!this.look) {
									this.error();
								}
								if(this.look.content() != ';') {
									node.add(this.expr());
								}
								node.add(this.match(';'));
								if(!this.look) {
									this.error();
								}
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
							if(!this.look) {
								this.error();
							}
							if(this.look.content() != ';') {
								node.add(this.expr());
							}
							if(!this.look) {
								this.error();
							}
							node.add(this.match(';'));
							if(!this.look) {
								this.error();
							}
							if(this.look.content() != ')') {
								node.add(this.expr());
							}
						}
						node.add(this.match(')'));
						node.add(this.stmt());
				}
				return node;
			},
			cntnstmt: function() {
				var node = new Node('cntnstmt');
				node.add(this.match('continue', true));
				if(this.look && (this.look.type() == Token.ID || this.look.type() == Token.LINE)) {
					node.add(this.move());
				}
				node.add(this.match(';'));
				return node;
			},
			brkstmt: function() {
				var node = new Node('brkstmt');
				node.add(this.match('break', true));
				if(this.look && (this.look.type() == Token.ID || this.look.type() == Token.LINE)) {
					node.add(this.move());
				}
				node.add(this.match(';'));
				return node;
			},
			retstmt: function() {
				var node = new Node('retstmt');
				node.add(this.match('return', true));
				if(this.look) {
					if(this.look.content() == ';') {
						node.add(this.move());
					}
					else if(this.look.type() == Token.LINE) {
						node.add(this.move());
					}
					else {
						node.add(this.expr());
					}
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
				return node;
			},
			swchstmt: function() {
				var node = new Node('swchstmt');
				node.add(
					this.match('switch'),
					this.match('('),
					this.expr(),
					this.match(')'),
					this.caseblock()
				);
				return node;
			},
			caseblock: function() {
				var node = new Node('caseblock');
				node.add(this.match('{'));
				if(this.look && this.look.content() != '}') {
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
				while(this.look && this.look.content() != '}' && this.look.content() != 'default') {
					node.add(this.caseclauses());
				}
				return node;
			},
			caseclause: function() {
				var node = new Node('caseclause');
				node.add(
					this.match('case'),
					this.expr(),
					this.match(':')
				);
				if(this.look && this.look.content() != 'case' && this.look.content() != 'break' && this.look.content() != '}') {
					node.add(this.stmts());
				}
				return node;
			},
			dftclause: function() {
				var node = new Node('dftclause');
				node.add(
					this.match('default'),
					this.match(':')
				);
				if(this.look && this.look.content() != '}') {
					node.add(this.stmts());
				}
				return node;
			},
			labstmt: function() {
				var node = new Node('labstmt');
				node.add(
					this.match(Token.ID),
					this.match(':'),
					this.stmt()
				);
				return node;
			},
			thrstmt: function() {
				var node = new Node('thrstmt');
				node.add(
					this.match('throw', true),
					this.expr(),
					this.match(';')
				);
				return node;
			},
			trystmt: function() {
				var node = new Node('trystmt');
				node.add(
					this.match('try'),
					this.block()
				);
				if(this.look && this.look.content() == 'catch') {
					node.add(this.cach());
					if(this.look && this.look.content() == 'finally') {
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
				var node = new Node('finl');
				node.add(
					this.match('finally'),
					this.block()
				);
				return node;
			},
			fndecl: function() {
				var node = new Node('fndecl');
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
				var node = new Node('fnparams');
				node.add(this.fnparam());
				while(this.look && this.look.content() == ',') {
					node.add(
						this.match(','),
						this.fnparam()
					);
				}
				return node;
			},
			fnparam: function() {
				var node = new Node('fnparam');
				node.add(this.match(Token.ID));
				return node;
			},
			fnbody: function() {
				var node = new Node('fnbody');
				if(this.look && this.look.content() != '}') {
					node.add(this.selements());
				}
				return node;
			},
			expr: function() {
				var node = new Node('expr');
				node.add(this.assignexpr());
				while(this.look && this.look.content() == ',') {
					node.add(this.assignexpr());
				}
				return node;
			},
			assignexpr: function() {
				var node = new Node('assignexpr');
				node.add(this.cndtexpr());
				if(this.look && ['*=', '/=', '%=', '+=', '-=', '<<=', '>>=', '>>>=', '&=', '^=', '|='].indexOf(this.look.content()) != -1) {
					node.add(this.assignexpr());
				}
				return node;
			},
			cndtexpr: function() {
				var node = new Node('cndtexpr');
				node.add(this.logorexpr());
				if(this.look && this.look.content() == '?') {
					node.add(
						this.move(),
						this.assignexpr(),
						this.match(':'),
						this.assignexpr()
					);
				}
				return node;
			},
			logorexpr: function() {
				var node = new Node('logorexpr');
				node.add(this.logandexpr());
				while(this.look && this.look.content() == '||') {
					node.add(
						this.move(),
						this.logandexpr()
					);
				}
				return node;
			},
			logandexpr: function() {
				var node = new Node('logandexpr');
				node.add(this.bitorexpr());
				while(this.look && this.look.content() == '&&') {
					node.add(
						this.move(),
						this.bitorexpr()
					);
				}
				return node;
			},
			bitorexpr: function() {
				var node = new Node('bitorexpr');
				node.add(this.bitxorexpr());
				while(this.look && this.look.content() == '|') {
					node.add(
						this.move(),
						this.bitxorexpr()
					);
				}
				return node;
			},
			bitxorexpr: function() {
				var node = new Node('bitxorexpr');
				node.add(this.bitandexpr());
				while(this.look && this.look.content() == '^') {
					node.add(
						this.move(),
						this.bitandexpr()
					);
				}
				return node;
			},
			bitandexpr: function() {
				var node = new Node('bitandexpr');
				node.add(this.eqexpr());
				while(this.look && this.look.content() == '&') {
					node.add(
						this.move(),
						this.eqexpr()
					);
				}
				return node;
			},
			eqexpr: function() {
				var node = new Node('eqexpr');
				node.add(this.reltexpr());
				while(this.look && ['==', '===', '!==', '!='].indexOf(this.look.content()) != -1) {
					node.add(
						this.move(),
						this.reltexpr()
					);
				}
				return node;
			},
			reltexpr: function() {
				var node = new Node('reltexpr');
				node.add(this.shiftexpr());
				while(this.look && ['<', '>', '>=', '<=', 'in', 'instanceof'].indexOf(this.look.content()) != -1) {
					node.add(
						this.move(),
						this.shiftexpr()
					);
				}
				return node;
			},
			shiftexpr: function() {
				var node = new Node('shiftexpr');
				node.add(this.addexpr());
				while(this.look && ['<<', '>>', '>>>'].indexOf(this.look.content()) != -1) {
					node.add(
						this.move(),
						this.addexpr()
					);
				}
				return node;
			},
			addexpr: function() {
				var node = new Node('addexpr');
				node.add(this.mtplexpr());
				while(this.look && ['+', '-'].indexOf(this.look.content()) != -1) {
					node.add(
						this.move(),
						this.mtplexpr()
					);
				}
				return node;
			},
			mtplexpr: function() {
				var node = new Node('mtplexpr');
				node.add(this.unaryexpr());
				while(this.look && ['*', '/', '%'].indexOf(this.look.content()) != -1) {
					node.add(
						this.move(),
						this.unaryexpr()
					);
				}
				return node;
			},
			unaryexpr: function() {
				var node = new Node('unaryexpr');
				if(!this.look) {
					this.error();
				}
				switch(this.look.content()) {
					case 'delete':
					case 'void':
					case 'typeof':
					case '++':
					case '--':
					case '+':
					case '-':
					case '~':
					case '!':
						node.add(
							this.move(),
							this.unaryexpr()
						);
					break;
					case 'new':
						node.add(
							this.move(),
							this.constor()
						)
					break;
					default:
						node.add(this.mmbexpr());
						if(this.look && ['++', '--'].indexOf(this.look.content()) != -1) {
							node.add(this.move());
						}
				}
				return node;
			},
			constor: function() {
				var node = new Node('constor');
				if(!this.look) {
					this.error();
				}
				if(this.look.content() == 'this') {
					node.add(
						this.move(),
						this.match('.')
					);
				}
				node.add(this.conscall());
				return node;
			},
			conscall: function() {
				var node = new Node('conscall');
				node.add(this.match(Token.ID));
				if(this.look) {
					if(this.look.content() == '(') {
						node.add(this.args());
					}
					else if(this.look.content() == '.') {
						node.add(
							this.move(),
							this.conscall()
						);
					}
				}
				return node;
			},
			mmbexpr: function() {
				var node = new Node('mmbexpr');
				node.add(this.prmrexpr());
				if(this.look) {
					if(this.look.content() == '.') {
						node.add(
							this.move(),
							this.mmbexpr()
						);
					}
					else if(this.look.content() == '[') {
						node.add(
							this.move(),
							this.expr()
						);
					}
					else if(this.look.content() == '(') {
						node.add(this.args());
					}
				}
				return node;
			},
			prmrexpr: function() {
				var node = new Node('prmrexpr');
				if(!this.look) {
					this.error();
				}
				switch(this.look.type()) {
					case Token.ID:
					case Token.NUMBER:
					case Token.STRING:
						node.add(this.move());
					break;
					default:
						switch(this.look.content()) {
							case 'this':
							case 'null':
							case 'true':
							case 'false':
								node.add(this.move());
							break;
							case '(':
								node.add(this.expr());
							break;
							default:
								this.error();
						}
				}
				return node;
			},
			args: function() {
				var node = new Node('args');
				node.add(this.match('('));
				if(!this.look) {
					this.error();
				}
				if(this.look.content() != ')') {
					node.add(this.arglist());
				}
				node.add(this.match(')'));
				return node;
			},
			arglist: function() {
				var node = new Node('arglist');
				node.add(this.assignexpr());
				while(this.look && this.look.content() == ',') {
					node.add(this.assignexpr());
				}
				return node;
			},
			assignoprt: function() {
				var node = new Node('assignoprt');
				switch(this.look.content()) {
					case '*=':
					case '/=':
					case '%=':
					case '+=':
					case '-=':
					case '<<=':
					case '>>=':
					case '>>>=':
					case '&=':
					case '^=':
					case '|=':
						node.add(
							this.move(),
							this.assignexpr()
						);
					break;
					default:
						this.error();
				}
				return node;
			},
			match: function(type, line, msg) {
				if(typeof line != 'boolean') {
					line = false;
					msg = line;
				}
				if(typeof type == 'string') {
					if(this.look && this.look.content() == type) {
						var l = this.look;
						this.move(line);
						return new Node('Token', l);
					}
					else {
						throw new Error('SyntaxError: missing ' + type + ' line ' + this.line + ' col ' + this.col + (msg ? '\n' + msg : ''));
					}
				}
				else if(typeof type == 'number') {
					if(this.look && this.look.type() == type) {
						var l = this.look;
						this.move(line);
						return new Node('Token', l);
					}
					else {
						throw new Error('SyntaxError: missing ' + Token.type(type) + ' line ' + this.line + ' col ' + this.col + (msg ? '\n' + msg : ''));
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
						this.col = 1;
						break;
					}
					if(line && this.look.type() == Token.COMMENT) {
						var s = this.look.content(),
							n = character.count(this.look.content(), character.LINE);
						if(n > 0) {
							this.line += n;
							var i = s.lastIndexOf(character.LINE);
							this.col += s.length - i - 1;
							break;
						}
					}
					if(this.look.type() == Token.LINE) {
						this.line++;
						this.col = 1;
					}
					else if(this.look.type() == Token.COMMENT) {
						var s = this.look.content(),
							n = character.count(this.look.content(), character.LINE);
						if(n > 0) {
							this.line += n;
							var i = s.lastIndexOf(character.LINE);
							this.col += s.length - i - 1;
						}
					}
					else {
						this.col += this.look.content().length;
					}
					this.index++;
				} while([Token.BLANK, Token.TAB, Token.ENTER, Token.LINE, Token.COMMENT].indexOf(this.look.type()) != -1);
				return new Node('Token', l);
			},
			error: function(msg) {
				msg = msg || 'SyntaxError: syntax error';
				throw new Error(msg + ' line ' + this.line + ' col ' + this.col);
			}
		});
	module.exports = Parser;
});