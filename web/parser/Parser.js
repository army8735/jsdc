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
				while(this.look) {
					node.add(this.element());
				}
				return node;
			},
			element: function() {
				if(this.look.content() == 'function') {
					return this.fndecl();
				}
				else {
					return this.stmt();
				}
			},
			stmt: function() {
				var node = new Node('stmt');
				if(!this.look) {
					this.error();
				}
				switch(this.look.content()) {
					case 'var':
						return this.varstmt();
					break;
					case '{':
						return this.block();
					break;
					case ';':
						return this.emptstmt();
					break;
					case 'if':
						return this.ifstmt();
					break;
					case 'do':
					case 'while':
					case 'for':
						return this.iterstmt();
					break;
					case 'continue':
						return this.cntnstmt();
					break;
					case 'break':
						return this.brkstmt();
					break;
					case 'return':
						return this.retstmt();
					break;
					case 'with':
						return this.withstmt();
					break;
					case 'switch':
						return this.swchstmt();
					break;
					case 'throw':
						return this.thrstmt();
					break;
					case 'try':
						return this.trystmt();
					break;
					case 'debugger':
						return this.debstmt();
					break;
					default:
						if(this.look.type() == Token.ID) {
							for(var i = 0, len = this.tokens.length; i < len; i++) {
								var token = this.tokens[i];
								if([Token.BLANK, Token.TAB, Token.COMMENT, Token.LINE, Token.ENTER].indexOf(token.type()) != -1) {
									if(token.content() == ':') {
										return this.labstmt();
									}
								}
							}
						}
						node.add(this.expr(), this.match(';'));
				}
				return node;
			},
			id: function() {
				var node = new Node('id');
				node.add(this.match(Token.ID));
				return node;
			},
			varstmt: function(noSem) {
				var node = new Node('varstmt');
				node.add(
					this.match('var'),
					this.vardecls()
				);
				if(!noSem) {
					this.match(';');
				}
				return node;
			},
			vardecl: function() {
				var node = new Node('vardecl');
				node.add(this.id());
				if(this.look && this.look.content() == '=') {
					node.add(this.assign());
				}
				return node;
			},
			vardecls: function() {
				var res = [this.vardecl()];
				while(this.look && this.look.content() == ',') {
					res.push(
						this.move(),
						this.vardecl()
					);
				}
				return res;
			},
			assign: function() {
				var node = new Node('assign');
				node.add(this.match('='));
				if(!this.look) {
					this.error();
				}
				node.add(this.assignexpr());
				return node;
			},
			block: function() {
				var node = new Node('block');
				node.add(this.match('{'));
				while(this.look && this.look.content() != '}') {
					node.add(this.stmt());
				}
				node.add(this.match('}', 'missing } in compound statement'));
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
							var node2 = this.varstmt(true);
							if(!this.look) {
								this.error('missing ; after for-loop initializer');
							}
							if(this.look.content() == 'in') {
								if(node2.leaves().length > 2) {
									this.error('invalid for/in left-hand side');
								}
								node.add(node2);
								node.add(
									this.move(),
									this.expr()
								);
							}
							else {
								node.add(node2);
								node.add(this.match(';'));
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
				if(this.look) {
					if(this.look.type() == Token.ID) {
						node.add(this.id());
					}
					else if(this.look.type() == Token.LINE) {
						node.add(this.move());
					}
				}
				node.add(this.match(';'));
				return node;
			},
			brkstmt: function() {
				var node = new Node('brkstmt');
				node.add(this.match('break', true));
				if(this.look) {
					if(this.look.type() == Token.ID) {
						node.add(this.id());
					}
					else if(this.look.type() == Token.LINE) {
						node.add(this.move());
					}
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
				while(this.look && this.look.content() != '}') {
					if(this.look.content() == 'case') {
						node.add(this.caseclause());
					}
					else if(this.look.content() == 'default') {
						node.add(this.dftclause());
					}
					else {
						this.error('invalid switch statement');
					}
				}
				node.add(this.match('}'));
				return node;
			},
			caseclause: function() {
				var node = new Node('caseclause');
				node.add(
					this.match('case'),
					this.expr(),
					this.match(':')
				);
				while(this.look && this.look.content() != 'case' && this.look.content() != 'default' && this.look.content() != '}') {
					node.add(this.stmt());
				}
				return node;
			},
			dftclause: function() {
				var node = new Node('dftclause');
				node.add(
					this.match('default'),
					this.match(':')
				);
				while(this.look && this.look.content() != '}') {
					node.add(this.stmt());
				}
				return node;
			},
			labstmt: function() {
				var node = new Node('labstmt');
				node.add(
					this.id(),
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
			debstmt: function() {
				var node = new Node('debstmt');
				node.add(this.match('debugger'), this.match(';'));
				return node;
			},
			cach: function() {
				var node = new Node('catch');
				node.add(
					this.match('catch'),
					this.match('('),
					this.id(),
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
					this.id(),
					this.match('(')
				);
				if(!this.look) {
					this.error();
				}
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
			fnexpr: function() {
				var node = new Node('fnexpr');
				node.add(this.match('function'));
				if(!this.look) {
					this.error();
				}
				if(this.look.type() == Token.ID) {
					node.add(this.id());
				}
				node.add(this.match('('));
				if(!this.look) {
					this.error();
				}
				if(this.look.type() == Token.ID) {
					node.add(this.fnparams());
				}
				node.add(
					this.match(')'),
					this.match('{'),
					this.fnbody(),
					this.match('}', 'missing } in compound statement')
				);
				return node;
			},
			fnparams: function() {
				var node = new Node('fnparams');
				node.add(this.id());
				while(this.look && this.look.content() == ',') {
					node.add(
						this.match(','),
						this.id()
					);
				}
				return node;
			},
			fnbody: function() {
				var node = new Node('fnbody');
				while(this.look && this.look.content() != '}') {
					node.add(this.element());
				}
				return node;
			},
			expr: function() {
				var node = new Node('expr'),
					assignexpr = this.assignexpr();
				if(this.look && this.look.content() == ',') {
					node.add(assignexpr);
					while(this.look && this.look.content() == ',') {
						node.add(this.assignexpr());
					}
				}
				else {
					return assignexpr;
				}
				return node;
			},
			assignexpr: function() {
				var node = new Node('assignexpr'),
					cndt = this.cndtexpr();
				if(this.look && ['*=', '/=', '%=', '+=', '-=', '<<=', '>>=', '>>>=', '&=', '^=', '|='].indexOf(this.look.content()) != -1) {
					node.add(cndt, this.assignexpr());
				}
				else {
					return cndt;
				}
				return node;
			},
			cndtexpr: function() {
				var node = new Node('cndtexpr'),
					logorexpr = this.logorexpr();
				if(this.look && this.look.content() == '?') {
					node.add(
						logorexpr,
						this.move(),
						this.assignexpr(),
						this.match(':'),
						this.assignexpr()
					);
				}
				else {
					return logorexpr;
				}
				return node;
			},
			logorexpr: function() {
				var node = new Node('logorexpr'),
					logandexpr = this.logandexpr();
				if(this.look && this.look.content() == '||') {
					node.add(logandexpr);
					while(this.look && this.look.content() == '||') {
						node.add(
							this.move(),
							this.logandexpr()
						);
					}
				}
				else {
					return logandexpr;
				}
				return node;
			},
			logandexpr: function() {
				var node = new Node('logandexpr'),
					bitorexpr = this.bitorexpr();
				if(this.look && this.look.content() == '&&') {
					node.add(bitorexpr);
					while(this.look && this.look.content() == '&&') {
						node.add(
							this.move(),
							this.bitorexpr()
						);
					}
				}
				else {
					return bitorexpr;
				}
				return node;
			},
			bitorexpr: function() {
				var node = new Node('bitorexpr'),
					bitxorexpr = this.bitxorexpr();
				if(this.look && this.look.content() == '|') {
					node.add(bitxorexpr);
					while(this.look && this.look.content() == '|') {
						node.add(
							this.move(),
							this.bitxorexpr()
						);
					}
				}
				else {
					return bitxorexpr;
				}
				return node;
			},
			bitxorexpr: function() {
				var node = new Node('bitxorexpr'),
					bitandexpr = this.bitandexpr();
				if(this.look && this.look.content() == '^') {
					node.add(bitandexpr);
					while(this.look && this.look.content() == '^') {
						node.add(
							this.move(),
							this.bitandexpr()
						);
					}
				}
				else {
					return bitandexpr;
				}
				return node;
			},
			bitandexpr: function() {
				var node = new Node('bitandexpr'),
					eqexpr = this.eqexpr();
				if(this.look && this.look.content() == '&') {
					node.add(eqexpr);
					while(this.look && this.look.content() == '&') {
						node.add(
							this.move(),
							this.eqexpr()
						);
					}
				}
				else {
					return eqexpr;
				}
				return node;
			},
			eqexpr: function() {
				var node = new Node('eqexpr'),
					reltexpr = this.reltexpr();
				if(this.look && ['==', '===', '!==', '!='].indexOf(this.look.content()) != -1) {
					node.add(reltexpr);
					while(this.look && ['==', '===', '!==', '!='].indexOf(this.look.content()) != -1) {
						node.add(
							this.move(),
							this.reltexpr()
						);
					}
				}
				else {
					return reltexpr;
				}
				return node;
			},
			reltexpr: function() {
				var node = new Node('reltexpr'),
					shiftexpr = this.shiftexpr();
				if(this.look && ['<', '>', '>=', '<=', 'in', 'instanceof'].indexOf(this.look.content()) != -1) {
					node.add(shiftexpr);
					while(this.look && ['<', '>', '>=', '<=', 'in', 'instanceof'].indexOf(this.look.content()) != -1) {
						node.add(
							this.move(),
							this.shiftexpr()
						);
					}
				}
				else {
					return shiftexpr;
				}
				return node;
			},
			shiftexpr: function() {
				var node = new Node('shiftexpr'),
					addexpr = this.addexpr();
				if(this.look && ['<<', '>>', '>>>'].indexOf(this.look.content()) != -1) {
					node.add(addexpr);
					while(this.look && ['<<', '>>', '>>>'].indexOf(this.look.content()) != -1) {
						node.add(
							this.move(),
							this.addexpr()
						);
					}
				}
				else {
					return addexpr;
				}
				return node;
			},
			addexpr: function() {
				var node = new Node('addexpr'),
					mtplexpr = this.mtplexpr();
				if(this.look && ['+', '-'].indexOf(this.look.content()) != -1) {
					node.add(mtplexpr);
					while(this.look && ['+', '-'].indexOf(this.look.content()) != -1) {
						node.add(
							this.move(),
							this.mtplexpr()
						);
					}
				}
				else {
					return mtplexpr;
				}
				return node;
			},
			mtplexpr: function() {
				var node = new Node('mtplexpr'),
					unaryexpr = this.unaryexpr();
				if(this.look && ['*', '/', '%'].indexOf(this.look.content()) != -1) {
					node.add(unaryexpr);
					while(this.look && ['*', '/', '%'].indexOf(this.look.content()) != -1) {
						node.add(
							this.move(),
							this.unaryexpr()
						);
					}
				}
				else {
					return unaryexpr;
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
						var mmbexpr = this.mmbexpr();
						if(this.look && ['++', '--'].indexOf(this.look.content()) != -1) {
							node.add(mmbexpr, this.move());
							return node;
						}
						else {
							return mmbexpr;
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
				else {
					return this.conscall();
				}
				node.add(this.conscall());
				return node;
			},
			conscall: function() {
				var node = new Node('conscall');
				node.add(this.id());
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
				if(!this.look) {
					this.error();
				}
				if(this.look.content() == 'function') {
					return this.fnexpr();
				}
				var prmrexpr = this.prmrexpr();
				if(this.look) {
					if(this.look.content() == '.') {
						node.add(
							prmrexpr,
							this.move(),
							this.mmbexpr()
						);
					}
					else if(this.look.content() == '[') {
						node.add(
							prmrexpr,
							this.move(),
							this.expr()
						);
					}
					else if(this.look.content() == '(') {
						node.add(prmrexpr, this.args());
					}
					else {
						return prmrexpr;
					}
				}
				else {
					return prmrexpr;
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
					case Token.REG:
					case Token.TEMPLATE:
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
								node.add(this.expr(), this.match(')'));
							break;
							case '[':
								node.add(this.arrltr());
							break;
							case '{':
								node.add(this.objltr());
							break;
							default:
								this.error();
						}
				}
				return node;
			},
			arrltr: function() {
				var node = new Node('arrltr');
				node.add(this.match('['));
				while(this.look && this.look.content() != ']') {
					if(this.look.content() == ',') {
						node.add(this.move());
					}
					else {
						node.add(this.assignexpr());
					}
				}
				node.add(this.match(']'));
				return node;
			},
			objltr: function() {
				var node = new Node('objltr');
				node.add(this.match('{'));
				while(this.look && this.look.content() != '}') {
					node.add(this.propts());
					if(this.look && this.look.content() == ',') {
						node.add(this.move());
					}
				}
				node.add(this.match('}'));
				return node;
			},
			propts: function() {
				var node = new Node('propts');
				node.add(this.proptassign());
				while(this.look && this.look.content() == ',') {
					node.add(this.move(), this.proptassign());
				}
				return node;
			},
			proptassign: function() {
				var node = new Node('proptassign');
				if(!this.look) {
					this.error();
				}
				if(this.look.content() == 'get') {
					node.add(
						this.move(),
						this.proptname(),
						this.match('('),
						this.match(')'),
						this.match('{'),
						this.fnbody(),
						this.match('}')
					);
				}
				else if(this.look.content() == 'set') {
					node.add(
						this.move(),
						this.proptname(),
						this.match('('),
						this.id(),
						this.match(')'),
						this.fnbody(),
						this.match('}')
					);
				}
				else {
					switch(this.look.type()) {
						case Token.ID:
						case Token.STRING:
						case Token.NUMBER:
							node.add(
								this.move(),
								this.match(':'),
								this.assignexpr()
							);
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
				msg = msg ? 'SyntaxError: ' + msg : 'SyntaxError: syntax error';
				throw new Error(msg + ' line ' + this.line + ' col ' + this.col);
			}
		});
	module.exports = Parser;
});