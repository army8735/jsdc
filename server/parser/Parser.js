var Class = require('../util/Class'),
	character = require('../util/character'),
	Lexer = require('../lexer/Lexer'),
	Token = require('../lexer/Token'),
	Node = require('./Node'),
	S = {},
	SS = {};
S[Token.BLANK] = S[Token.TAB] = S[Token.COMMENT] = S[Token.LINE] = S[Token.ENTER] = true;
SS[Token.BLANK] = SS[Token.TAB] = SS[Token.ENTER] = true;
var Parser = Class(function(lexer) {
		this.lexer = lexer;
		this.look = null;
		this.tokens = null;
		this.lastLine = 1;
		this.lastCol = 1;
		this.line = 1;
		this.col = 1;
		this.index = 0;
		this.length = 0;
		this.inFor = false;
		this.ignores = {};
		this.hasMoveLine = false;
	}).methods({
		program: function() {
			this.tokens = this.lexer.tokens();
			this.length = this.tokens.length;
			if(this.tokens.length) {
				this.move();
			}
			var node = new Node(Node.PROGRAM);
			while(this.look) {
				node.add(this.element());
			}
			return node;
		},
		element: function(allowSuper) {
			if(this.look.content() == 'function') {
				return this.fndecl();
			}
			else if(this.look.content() == 'class') {
				return this.classdecl();
			}
			else {
				return this.stmt(allowSuper);
			}
		},
		stmt: function(allowSuper) {
			var node = new Node(Node.STMT);
			if(!this.look) {
				this.error();
			}
			switch(this.look.content()) {
				case 'let':
					return this.letstmt();
				case 'const':
					return this.cststmt();
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
				case 'super':
					if(!allowSuper) {
						this.error('super must in a class');
					}
					return this.superstmt();
				case 'import':
					return this.imptstmt();
				default:
					if(this.look.type() == Token.ID) {
						for(var i = this.index; i < this.length; i++) {
							var token = this.tokens[i];
							if(S[token.type()]) {
								if(token.content() == ':') {
									return this.labstmt();
								}
								else {
									break;
								}
							}
							else {
								break;
							}
						}
					}
					node.add(this.expr(), this.match(';'));
			}
			return node;
		},
		cststmt: function(noSem) {
			var node = new Node(Node.CSTSTMT);
			node.add(
				this.match('const'),
				this.vardecl()
			);
			while(this.look && this.look.content() == ',') {
				node.add(
					this.match(),
					this.vardecl()
				);
			}
			if(!noSem) {
				node.add(this.match(';'));
			}
			return node;
		},
		letstmt: function(noSem) {
			var node = new Node(Node.LETSTMT);
			node.add(
				this.match('let'),
				this.vardecl()
			);
			while(this.look && this.look.content() == ',') {
				node.add(
					this.match(),
					this.vardecl()
				);
			}
			if(!noSem) {
				node.add(this.match(';'));
			}
			return node;
		},
		varstmt: function(noSem) {
			var node = new Node(Node.VARSTMT);
			node.add(
				this.match('var'),
				this.vardecl()
			);
			while(this.look && this.look.content() == ',') {
				node.add(
					this.match(),
					this.vardecl()
				);
			}
			if(!noSem) {
				node.add(this.match(';'));
			}
			return node;
		},
		vardecl: function() {
			var node = new Node(Node.VARDECL);
			if(!this.look) {
				this.error('missing variable name');
			}
			if(this.look.content() == '[') {
				node.add(this.arrltr());
			}
			else {
				node.add(this.match(Token.ID, 'missing variable name'));
			}
			if(this.look && this.look.content() == '=') {
				node.add(this.assign());
			}
			return node;
		},
		assign: function() {
			var node = new Node(Node.ASSIGN);
			node.add(this.match('='));
			if(!this.look) {
				this.error();
			}
			node.add(this.assignexpr());
			return node;
		},
		block: function() {
			var node = new Node(Node.BLOCK);
			node.add(this.match('{'));
			while(this.look && this.look.content() != '}') {
				node.add(this.stmt());
			}
			node.add(this.match('}', 'missing } in compound statement'));
			return node;
		},
		emptstmt: function() {
			var node = new Node(Node.EMPTSTMT);
			node.add(this.match(';'));
			return node;
		},
		ifstmt: function() {
			var node = new Node(Node.IFSTMT);
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
			var node = new Node(Node.ITERSTMT);
			if(!this.look) {
				this.error();
			}
			switch(this.look.content()) {
				case 'do':
					node.add(
						this.match(),
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
						this.match(),
						this.match('('),
						this.expr(),
						this.match(')'),
						this.stmt()
					);
				break;
				case 'for':
					this.inFor = true;
					node.add(
						this.match(),
						this.match('(')
					);
					if(!this.look) {
						this.error();
					}
					if(this.look.content() == 'var' || this.look.content() == 'let') {
						var node2 = this.look.content() == 'var' ? this.varstmt(true) : this.letstmt(true);
						if(!this.look) {
							this.error('missing ; after for-loop initializer');
						}
						if(this.look.content() == 'in') {
							if(node2.leaves().length > 2) {
								this.error('invalid for/in left-hand side');
							}
							node.add(node2);
							node.add(
								this.match(),
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
						if(this.look.content() == 'in') {
							this.error();
						}
						var hasIn = false;
						for(var i = this.index; i < this.length; i++) {
							var t = this.tokens[i];
							if(t.content() == 'in') {
								hasIn = true;
								break;
							}
							else if(t.content() == ')') {
								break;
							}
						}
						if(hasIn) {
							node.add(this.expr(true), this.match('in'), this.expr());
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
					}
					this.inFor = false;
					node.add(this.match(')'));
					node.add(this.stmt());
			}
			return node;
		},
		cntnstmt: function() {
			var node = new Node(Node.CNTNSTMT);
			node.add(this.match('continue', true));
			if(this.look && this.look.type() == Token.ID) {
				node.add(this.match());
			}
			node.add(this.match(';'));
			return node;
		},
		brkstmt: function() {
			var node = new Node(Node.BRKSTMT);
			node.add(this.match('break', true));
			if(this.look && this.look.type() == Token.ID) {
				node.add(this.match());
			}
			node.add(this.match(';'));
			return node;
		},
		retstmt: function() {
			var node = new Node(Node.RETSTMT);
			node.add(this.match('return', true));
			if(this.look) {
				if(this.look.content() == ';' || this.look.type() == Token.LINE) {
					node.add(this.match(';'));
				}
				else {
					node.add(this.expr(), this.match(';'));
				}
			}
			else {
				node.add(this.match(';'));
			}
			return node;
		},
		withstmt: function() {
			var node = new Node(Node.WITHSTMT);
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
			var node = new Node(Node.SWCHSTMT);
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
			var node = new Node(Node.CASEBLOCK);
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
			var node = new Node(Node.CASECLAUSE);
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
			var node = new Node(Node.DFTCLAUSE);
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
			var node = new Node(Node.LABSTMT);
			node.add(
				this.match(Token.ID),
				this.match(':'),
				this.stmt()
			);
			return node;
		},
		thrstmt: function() {
			var node = new Node(Node.THRSTMT);
			node.add(
				this.match('throw', true),
				this.expr(),
				this.match(';')
			);
			return node;
		},
		trystmt: function() {
			var node = new Node(Node.TRYSTMT);
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
			var node = new Node(Node.DEBSTMT);
			node.add(this.match('debugger'), this.match(';'));
			return node;
		},
		cach: function() {
			var node = new Node(Node.CACH);
			node.add(
				this.match('catch'),
				this.match('('),
				this.match(Token.ID, 'missing identifier in catch'),
				this.match(')'),
				this.block()
			);
			return node;
		},
		finl: function() {
			var node = new Node(Node.FINL);
			node.add(
				this.match('finally'),
				this.block()
			);
			return node;
		},
		superstmt: function() {
			var node = new Node(Node.SUPERSTMT);
			node.add(this.match('super'));
			if(!this.look) {
				this.error();
			}
			if(this.look.content() == '.') {
				while(this.look && this.look.content() == '.') {
					node.add(this.match());
					if(!this.look) {
						this.error();
					}
					if(this.look.content() == 'super') {
						node.add(this.match());
					}
					else {
						break;
					}
				}
				if(this.look.content() != '(') {
					node.add(this.match(Token.ID));
					while(this.look && this.look.content() == '.') {
						node.add(this.match(), this.match(Token.ID));
					}
				}
			}
			node.add(
				this.args(),
				this.match(';')
			);
			return node;
		},
		imptstmt: function() {
			var node = new Node(Node.IMPTSTMT);
			return node;
		},
		fndecl: function() {
			var node = new Node(Node.FNDECL);
			node.add(
				this.match('function'),
				this.match(Token.ID, 'function statement requires a name'),
				this.match('(')
			);
			if(!this.look) {
				this.error('missing formal parameter');
			}
			if(this.look.content() != ')') {
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
			var node = new Node(Node.FNEXPR);
			node.add(this.match('function'));
			if(!this.look) {
				this.error('missing formal parameter');
			}
			if(this.look.type() == Token.ID) {
				node.add(this.match());
			}
			node.add(this.match('('));
			if(!this.look) {
				this.error();
			}
			if(this.look.content() != ')') {
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
			var node = new Node(Node.FNPARAMS);
			node.add(this.match(Token.ID, 'missing formal parameter'));
			while(this.look && this.look.content() == ',') {
				node.add(this.match());
				if(!this.look) {
					this.error('missing formal parameter');
				}
				if(this.look.type() == Token.ID) {
					node.add(this.match());
					if(this.look && this.look.content() == '=') {
						node.add(this.bindelement());
					}
				}
				else if(this.look.content() == '...') {
					node.add(this.restparam());
				}
				else {
					this.error('missing formal parameter');
				}
			}
			return node;
		},
		bindelement: function() {
			var node = new Node(Node.BINDELEMENT);
			node.add(this.match('='), this.assignexpr());
			return node;
		},
		restparam: function() {
			var node = new Node(Node.RESTPARAM);
			node.add(this.match('...'), this.match(Token.ID));
			return node;
		},
		fnbody: function(allowSuper) {
			var node = new Node(Node.FNBODY);
			while(this.look && this.look.content() != '}') {
				node.add(this.element(allowSuper));
			}
			return node;
		},
		classdecl: function() {
			var node = new Node(Node.CLASSDECL);
			node.add(this.match('class'), this.match(Token.ID));
			if(!this.look) {
				this.error();
			}
			if(this.look.content() == 'extends') {
				node.add(this.heratige());
			}
			node.add(
				this.match('{'),
				this.classbody(),
				this.match('}')
			);
			return node;
		},
		heratige: function() {
			var node = new Node(Node.HERITAGE);
			node.add(this.match('extends'), this.match(Token.ID));
			return node;
		},
		classbody: function() {
			var node = new Node(Node.CLASSBODY),
				methods = {},
				hasStatic = false;
			while(this.look && this.look.content() != '}') {
				if(this.look.content() == ';') {
					node.add(this.match());
					continue;
				}
				hasStatic = false;
				if(this.look.content() == 'static') {
					node.add(this.match());
					hasStatic = true;
				}
				if(!this.look) {
					this.error();
				}
				node.add(this.method(hasStatic, methods));
			}
			return node;
		},
		method: function(hasStatic, methods, statics) {
			var node = new Node(Node.METHOD);
			if(this.look.content() == 'get') {
				node.add(this.match(), this.getfn());
			}
			else if(this.look.content() == 'set') {
				node.add(this.match(), this.setfn());
			}
			else {
				node.add(this.match(Token.ID));
				var id = node.leaves()[0].token().content();
				if(methods.hasOwnProperty(id)) {
					this.error('duplicate method decl in class');
				}
				methods[id] = true;
				node.add(this.match('('));
				if(this.look.content() != ')') {
					node.add(this.fnparams());
				}
				node.add(
					this.match(')'),
					this.match('{'),
					this.fnbody(true),
					this.match('}', 'missing } in compound statement')
				);
			}
			return node;
		},
		expr: function(noIn) {
			var node = new Node(Node.EXPR),
				assignexpr = this.assignexpr(noIn);
			if(this.look && this.look.content() == ',') {
				node.add(assignexpr);
				while(this.look && this.look.content() == ',') {
					node.add(this.match(), this.assignexpr(noIn));
				}
			}
			else {
				return assignexpr;
			}
			return node;
		},
		assignexpr: function(noIn) {
			var node = new Node(Node.ASSIGNEXPR),
				cndt = this.cndtexpr(noIn);
			if(this.look && ['*=', '/=', '%=', '+=', '-=', '<<=', '>>=', '>>>=', '&=', '^=', '|=', '='].indexOf(this.look.content()) != -1) {
				node.add(cndt, this.match(), this.assignexpr(noIn));
			}
			else {
				return cndt;
			}
			return node;
		},
		cndtexpr: function(noIn) {
			var node = new Node(Node.CNDTEXPR),
				logorexpr = this.logorexpr(noIn);
			if(this.look && this.look.content() == '?') {
				node.add(
					logorexpr,
					this.match(),
					this.assignexpr(noIn),
					this.match(':'),
					this.assignexpr(noIn)
				);
			}
			else {
				return logorexpr;
			}
			return node;
		},
		logorexpr: function(noIn) {
			var node = new Node(Node.LOGOREXPR),
				logandexpr = this.logandexpr(noIn);
			if(this.look && this.look.content() == '||') {
				node.add(logandexpr);
				while(this.look && this.look.content() == '||') {
					node.add(
						this.match(),
						this.logandexpr(noIn)
					);
				}
			}
			else {
				return logandexpr;
			}
			return node;
		},
		logandexpr: function(noIn) {
			var node = new Node(Node.LOGANDEXPR),
				bitorexpr = this.bitorexpr(noIn);
			if(this.look && this.look.content() == '&&') {
				node.add(bitorexpr);
				while(this.look && this.look.content() == '&&') {
					node.add(
						this.match(),
						this.bitorexpr(noIn)
					);
				}
			}
			else {
				return bitorexpr;
			}
			return node;
		},
		bitorexpr: function(noIn) {
			var node = new Node(Node.BITOREXPR),
				bitxorexpr = this.bitxorexpr(noIn);
			if(this.look && this.look.content() == '|') {
				node.add(bitxorexpr);
				while(this.look && this.look.content() == '|') {
					node.add(
						this.match(),
						this.bitxorexpr(noIn)
					);
				}
			}
			else {
				return bitxorexpr;
			}
			return node;
		},
		bitxorexpr: function(noIn) {
			var node = new Node(Node.BITXOREXPR),
				bitandexpr = this.bitandexpr(noIn);
			if(this.look && this.look.content() == '^') {
				node.add(bitandexpr);
				while(this.look && this.look.content() == '^') {
					node.add(
						this.match(),
						this.bitandexpr(noIn)
					);
				}
			}
			else {
				return bitandexpr;
			}
			return node;
		},
		bitandexpr: function(noIn) {
			var node = new Node(Node.BITANDEXPR),
				eqexpr = this.eqexpr(noIn);
			if(this.look && this.look.content() == '&') {
				node.add(eqexpr);
				while(this.look && this.look.content() == '&') {
					node.add(
						this.match(),
						this.eqexpr(noIn)
					);
				}
			}
			else {
				return eqexpr;
			}
			return node;
		},
		eqexpr: function(noIn) {
			var node = new Node(Node.EQEXPR),
				reltexpr = this.reltexpr(noIn);
			if(this.look && ['==', '===', '!==', '!='].indexOf(this.look.content()) != -1) {
				node.add(reltexpr);
				while(this.look && ['==', '===', '!==', '!='].indexOf(this.look.content()) != -1) {
					node.add(
						this.match(),
						this.reltexpr(noIn)
					);
				}
			}
			else {
				return reltexpr;
			}
			return node;
		},
		reltexpr: function(noIn) {
			var node = new Node(Node.RELTEXPR),
				shiftexpr = this.shiftexpr();
			if(this.look && (['<', '>', '>=', '<=', 'instanceof'].indexOf(this.look.content()) != -1 || (!noIn && this.look.content() == 'in'))) {
				node.add(shiftexpr);
				while(this.look && (['<', '>', '>=', '<=', 'instanceof'].indexOf(this.look.content()) != -1 || (!noIn && this.look.content() == 'in'))) {
					node.add(
						this.match(),
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
			var node = new Node(Node.SHIFTEXPR),
				addexpr = this.addexpr();
			if(this.look && ['<<', '>>', '>>>'].indexOf(this.look.content()) != -1) {
				node.add(addexpr);
				while(this.look && ['<<', '>>', '>>>'].indexOf(this.look.content()) != -1) {
					node.add(
						this.match(),
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
			var node = new Node(Node.ADDEXPR),
				mtplexpr = this.mtplexpr();
			if(this.look && ['+', '-'].indexOf(this.look.content()) != -1) {
				node.add(mtplexpr);
				while(this.look && ['+', '-'].indexOf(this.look.content()) != -1) {
					node.add(
						this.match(),
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
			var node = new Node(Node.MTPLEXPR),
				unaryexpr = this.unaryexpr();
			if(this.look && ['*', '/', '%'].indexOf(this.look.content()) != -1) {
				node.add(unaryexpr);
				while(this.look && ['*', '/', '%'].indexOf(this.look.content()) != -1) {
					node.add(
						this.match(),
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
			var node = new Node(Node.UNARYEXPR);
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
						this.match(),
						this.unaryexpr()
					);
				break;
				case 'new':
					node.add(
						this.match(),
						this.constor()
					);
				break;
				default:
					var mmbexpr = this.mmbexpr();
					if(this.look && ['++', '--'].indexOf(this.look.content()) != -1) {
						node.add(mmbexpr, this.match());
						return node;
					}
					else {
						return mmbexpr;
					}
			}
			return node;
		},
		constor: function() {
			var node = new Node(Node.CONSTOR);
			if(!this.look) {
				this.error();
			}
			if(this.look.content() == 'this') {
				node.add(
					this.match(),
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
			var node = new Node(Node.CONSCALL);
			node.add(this.match(Token.ID, this.look.content() + ' is not a constructor'));
			if(this.look) {
				if(this.look.content() == '(') {
					node.add(this.args());
				}
				else if(this.look.content() == '.') {
					node.add(
						this.match(),
						this.conscall()
					);
					while(this.look && this.look.content() == '.') {
						node.add(
							this.match(),
							this.conscall()
						);
					}
				}
			}
			return node;
		},
		mmbexpr: function() {
			var node = new Node(Node.MMBEXPR);
			if(!this.look) {
				this.error();
			}
			var prmrexpr = this.prmrexpr();
			function goOn() {
				while(this.look && ['.', '[', '('].indexOf(this.look.content()) != -1) {
					if(this.look.content() == '.') {
						node.add(this.match(), this.mmbexpr());
					}
					else if(this.look.content() == '[') {
						node.add(
							this.match(),
							this.expr(),
							this.match(']')
						);
					}
					else {
						node.add(this.args());
					}
				}
			}
			if(this.look) {
				if(this.look.content() == '.') {
					node.add(
						prmrexpr,
						this.match(),
						this.mmbexpr()
					);
					goOn.call(this);
				}
				else if(this.look.content() == '[') {
					node.add(
						prmrexpr,
						this.match(),
						this.expr(),
						this.match(']')
					);
					goOn.call(this);
				}
				else if(this.look.content() == '(') {
					node.add(prmrexpr, this.args());
					goOn.call(this);
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
			var node = new Node(Node.PRMREXPR);
			if(!this.look) {
				this.error();
			}
			switch(this.look.type()) {
				case Token.ID:
				case Token.NUMBER:
				case Token.STRING:
				case Token.REG:
				case Token.TEMPLATE:
					node.add(this.match());
				break;
				default:
					switch(this.look.content()) {
                           case 'function':
                               return this.fnexpr();
						case 'this':
						case 'null':
						case 'true':
						case 'false':
							return this.match();
						break;
						case '(':
							node.add(this.match(), this.expr(), this.match(')'));
						break;
						case '[':
							return this.arrltr();
						break;
						case '{':
							return this.objltr();
						break;
						default:
							this.error();
					}
			}
			return node;
		},
		arrltr: function() {
			var node = new Node(Node.ARRLTR);
			node.add(this.match('['));
			while(this.look && this.look.content() != ']') {
				if(this.look.content() == ',') {
					node.add(this.match());
				}
				else {
					node.add(this.assignexpr());
				}
			}
			node.add(this.match(']'));
			return node;
		},
		objltr: function() {
			var node = new Node(Node.OBJLTR);
			node.add(this.match('{'));
			while(this.look && this.look.content() != '}') {
				node.add(this.proptassign());
				if(this.look && this.look.content() == ',') {
					node.add(this.match());
				}
			}
			node.add(this.match('}'));
			return node;
		},
		proptassign: function() {
			var node = new Node(Node.PROPTASSIGN);
			if(!this.look) {
				this.error();
			}
			if(this.look.content() == 'get') {
				node.add(this.match());
				if(!this.look) {
					this.error();
				}
				if(this.look.content() == ':') {
					node.add(this.match(), this.assignexpr());
				}
				else {
					node.add(this.getfn());
				}
			}
			else if(this.look.content() == 'set') {
				node.add(this.match());
				if(!this.look) {
					this.error();
				}
				if(this.look.content() == ':') {
					node.add(this.match(), this.assignexpr());
				}
				else {
					node.add(this.setfn());
				}
			}
			else {
				switch(this.look.type()) {
					case Token.ID:
					case Token.STRING:
					case Token.NUMBER:
						node.add(
							this.match(),
							this.match(':'),
							this.assignexpr()
						);
					break;
					default:
						this.error('invalid property id');
				}
			}
			return node;
		},
		getfn: function() {
			var node = new Node(Node.GETFN);
			node.add(
				this.proptname(),
				this.match('('),
				this.match(')'),
				this.match('{'),
				this.fnbody(),
				this.match('}')
			);
			return node;
		},
		setfn: function() {
			var node = new Node(Node.SETFN);
			node.add(
				this.proptname(),
				this.match('('),
				this.propsets(),
				this.match(')'),
				this.match('{'),
				this.fnbody(),
				this.match('}')
			);
			return node;
		},
		proptname: function() {
			var node = new Node(Node.PROPTNAME);
			if(this.look) {
				switch(this.look.type()) {
					case Token.ID:
					case Token.NUMBER:
					case Token.STRING:
						node.add(this.match());
					break;
					default:
						this.error('missing name after . operator');
				}
			}
			return node;
		},
		propsets: function() {
			var node = new Node(Node.PROPTSETS);
			node.add(this.match(Token.ID, 'setter functions must have one argument'));
			return node;
		},
		args: function() {
			var node = new Node(Node.ARGS);
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
			var node = new Node(Node.ARGLIST);
			node.add(this.assignexpr());
			while(this.look && this.look.content() == ',') {
				node.add(this.match(), this.assignexpr());
			}
			return node;
		},
		assignoprt: function() {
			var node = new Node(Node.ASSIGNOPRT);
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
						this.match(),
						this.assignexpr()
					);
				break;
				default:
					this.error();
			}
			return node;
		},
		match: function(type, line, msg) {
			if(typeof type == 'boolean') {
				msg = line;
				line = type;
				type = undefined;
			}
			if(typeof line != 'boolean') {
				line = false;
				msg = line;
			}
			//未定义为所有
			if(character.isUndefined(type)) {
				if(this.look) {
					var l = this.look;
					this.move(line);
					return new Node(Node.TOKEN, l);
				}
				else {
					this.error('syntax error' + (msg || ''));
				}
			}
			//或者根据token的type或者content匹配
			else if(typeof type == 'string') {
				//特殊处理，不匹配有换行或者末尾时自动补全，还有受限行
				if(type == ';' && !this.inFor && (!this.look || (this.look.content() != type && this.hasMoveLine) || this.look.content() == '}' || this.look.type() == Token.LINE)) {
					if(this.look && this.look.type() == Token.LINE) {
						this.move();
					}
					return new Node(Node.TOKEN, new Token(Token.VIRTUAL, ';'));
				}
				else if(this.look && this.look.content() == type) {
					var l = this.look;
					this.move(line);
					return new Node(Node.TOKEN, l);
				}
				else {
					this.error('missing ' + type + (msg || ''));
				}
			}
			else if(typeof type == 'number') {
				if(this.look && this.look.type() == type) {
					var l = this.look;
					this.move(line);
					return new Node(Node.TOKEN, l);
				}
				else {
					this.error('missing ' + Token.type(type) + (msg || ''));
				}
			}
		},
		move: function(line) {
			this.lastLine = this.line;
			this.lastCol = this.col;
			//遗留下来的换行符
			this.hasMoveLine = false;
			do {
				this.look = this.tokens[this.index++];
				if(!this.look) {
					return;
				}
				//存下忽略的token
				if(S[this.look.type()]) {
					this.ignores[this.index - 1] = this.look;
				}
				//包括line
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
					this.hasMoveLine = true;
					this.line++;
					this.col = 1;
				}
				else if(this.look.type() == Token.COMMENT) {
					var s = this.look.content(),
						n = character.count(this.look.content(), character.LINE);
					if(n > 0) {
						this.hasMoveLine = true;
						this.line += n;
						var i = s.lastIndexOf(character.LINE);
						this.col += s.length - i - 1;
					}
				}
				else {
					this.col += this.look.content().length;
					if(!SS[this.look.type()]) {
						break;
					}
				}
			} while(this.index <= this.length);
		},
		error: function(msg) {
			msg = 'SyntaxError: ' + (msg || ' syntax error');
			throw new Error(msg + ' line ' + this.lastLine + ' col ' + this.lastCol);
		},
		ignore: function() {
			return this.ignores;
		}
	});
module.exports = Parser;
