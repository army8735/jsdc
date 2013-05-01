define(function(require, exports, module) {
	var Class = require('../util/Class'),
		character = require('../util/character'),
		Lexer = require('../lexer/Lexer'),
		EcmascriptRule = require('../lexer/rule/EcmascriptRule'),
		Token = require('../lexer/Token'),
		Node = require('./Node'),
		table = require('./table'),
		ParserR = Class(function(lexer) {
			this.lexer = lexer;
			this.look = null;
			this.lastLine = 1;
			this.lastCol = 1;
			this.line = 1;
			this.col = 1;
			this.index = 0;
			this.length = 0;
			this.inFor = false;
			this.ignores = {};
			this.hasMoveLine = false;
			this.states = [];
			this.signs = [];
		}).methods({
			program: function() {
				this.tokens = this.lexer.tokens();
				this.length = this.tokens.length;
				this.states.push(0);
				this.move();
				this.next();console.log(this.signs)
				return this.signs[0];
			},
			next: function() {
				while(true) {
					var row = this.states[this.states.length - 1],
						col;
					//没有说明到了末尾
					if(!this.look) {
						col = table.actionLen - 1;
					}
					else {
						col = table.actionHash[this.look.val()];
					}
					var action = table.actionTable[row][col];console.log(action, row, col, this.look)
					if(!action) {
						this.error();
					}
					else if(action == 'acc') {
						break;
					}
					//s开头状态进栈
					else if(action.charAt(0) == 's') {
						this.shift();
						this.states.push(parseInt(action.slice(1)));
					}
					//r开头规约操作
					else {
						this[action]();
					}
				}
			},
			shift: function(line) {
				this.signs.push(this.look);
				this.move(line);
			},
			r1: function() {
				var program = new Node(Node.PROGRAM);
				if(this.signs.length) {
					program.add(this.signs[0]);
					this.signs[0] = program;
				}
				else {
					this.signs.push(program);
				}
				this.states.push(1);
			},
			r23: function() {
				var token = new Node(Node.TOKEN, this.signs.pop());
				this.signs.push(new Node(Node.EMPTSTMT, token));
				this.states.pop();
				var gt = table.gotoTable[this.states[this.states.length - 1]][6];
				this.states.push(gt);
			},
			r8: function() {
				this.signs.push(new Node(Node.STMT, this.signs.pop()));
				this.states.pop();
				var gt = table.gotoTable[this.states[this.states.length - 1]][5];
				this.states.push(gt);
			},
			r5: function() {
				this.signs.push(new Node(Node.ELEM, this.signs.pop()));
				this.states.pop();
				var gt = table.gotoTable[this.states[this.states.length - 1]][2];
				this.states.push(gt);
			},
			r3: function() {
				this.states.pop();
				var elem = this.signs.pop();
				if(this.signs[this.signs.length - 1] instanceof Node && this.signs[this.signs.length - 1].name() == Node.ELEMS) {
					this.signs[this.signs.length - 1].add(elem);
				}
				else {
					this.signs.push(new Node(Node.ELEMS, elem));
				}
			},
			r24: function() {
				this.states.pop();
				for(var i = this.signs.length - 1; i >= 0; i--) {
					if(this.signs[i] instanceof Token && this.signs[i].content() == '{') {
						var block = new Node(Node.BLOCK);
						block.add(
							new Node(Node.TOKEN, this.signs[i]),
							this.signs.slice(i + 1, this.signs.length - 1),
							new Node(Node.TOKEN, this.signs.pop())
						);
						this.signs.splice(i);
						this.signs.push(block);
						this.states.pop();
						var gt = table.gotoTable[this.states[this.states.length - 1]][7];
						this.states.push(gt);
						break;
					}
				}
			},
			r9: function() {
				this.signs.push(new Node(Node.STMT, this.signs.pop()));
				this.states.pop();
				var gt = table.gotoTable[this.states[this.states.length - 1]][5];
				this.states.push(gt);
			},
			r28: function() {
				var id = new Node(Node.TOKEN, this.signs.pop());
				var vardecl = new Node(Node.VARDECL, id);
				this.signs.push(vardecl);
				this.states.pop();
				var gt = table.gotoTable[this.states[this.states.length - 1]][22];
				this.states.push(gt);
			},
			r25: function() {
				var varstmt = new Node(Node.VARSTMT);
				varstmt.add(
					new Node(Node.TOKEN, this.signs[this.signs.length - 3]),
					this.signs[this.signs.length - 2],
					new Node(Node.TOKEN, this.signs[this.signs.length - 1])
				);
				this.signs.splice(this.signs.length - 3, 3);
				this.signs.push(varstmt);
				this.states.splice(this.states.length - 3, 3);
				var gt = table.gotoTable[this.states[this.states.length - 1]][8];
				this.states.push(gt);
			},
			r10: function() {
				this.signs.push(new Node(Node.STMT, this.signs.pop()));
				this.states.pop();
				var gt = table.gotoTable[this.states[this.states.length - 1]][5];
				this.states.push(gt);
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
					if([Token.BLANK, Token.TAB, Token.ENTER, Token.LINE, Token.COMMENT].indexOf(this.look.type()) != -1) {
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
						if([Token.BLANK, Token.TAB, Token.ENTER].indexOf(this.look.type()) == -1) {
							break;
						}
					}
				} while(this.index <= this.length);
				return this;
			},
			error: function(msg) {
				msg = 'SyntaxError: ' + (msg || ' syntax error');
				throw new Error(msg + ' line ' + this.lastLine + ' col ' + this.lastCol);
			},
			ignore: function() {
				return this.ignores;
			}
		});
	module.exports = ParserR;
});