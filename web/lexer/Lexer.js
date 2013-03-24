define(function(require, exports, module) {
	var Class = require('../util/Class'),
		character = require('../util/character'),
		Token = require('./Token'),
		Lexer = Class(function(rule) {
			this.rule = rule; //当前语法规则
			this.code; //要解析的代码
			this.peek = ''; //向前看字符
			this.index = 0; //向前看字符字符索引
			this.isReg = Lexer.IS_REG; //当前/是否是perl风格正则表达式
			this.lanDepth = 0; //生成最终结果时需要记录的行深度
			this.tokens = null; //结果的token列表
			this.parentheseState = false; //(开始时标记之前终结符是否为if/for/while等关键字
			this.parentheseStack = []; //圆括号深度记录当前是否为if/for/while等语句内部
			this.cacheLine = 0; //行缓存值
			this.totalLine = 1; //总行数
			this.col = 0; //列
		}).methods({
			parse: function(code, start) {
				if(code !== undefined) {
					this.code = code;
				}
				if(start !== undefined) {
					this.totalLine = start;
				}
				this.tokens = [];
				this.scan();
				return this.tokens;
			},
			scan: function() {
				var perlReg = this.rule.perlReg(),
					length = this.code.length,
					count = 0;
				outer:
				while(this.index < length) {
					this.readch();
					//内嵌解析空白
					if(character.BLANK == this.peek) {
						this.tokens.push(new Token(Token.BLANK, this.peek));
						this.col++;
					}
					else if(character.TAB == this.peek) {
						this.tokens.push(new Token(Token.TAB, this.peek));
						this.col++;
					}
					//内嵌解析换行
					else if(character.LINE == this.peek) {
						this.totalLine++;
						this.col = 0;
						this.tokens.push(new Token(Token.LINE, this.peek));
						if(this.cacheLine > 0 && ++count >= this.cacheLine) {
							break;
						}
					}
					//忽略回车
					else if(character.ENTER == this.peek) {
					}
					//内嵌解析数字
					else if(character.isDigit(this.peek)) {
						this.dealNumber();
						if(perlReg) {
							this.isReg = Lexer.NOT_REG;
						}
					}
					else if(this.peek == character.DECIMAL && character.isDigit(this.code.charAt(this.index))) {
						this.dealDecimal();
						if(perlReg) {
							this.isReg = Lexer.NOT_REG;
						}
					}
					else if(perlReg && this.isReg == Lexer.IS_REG && this.peek == character.SLASH && !{ '/': true, '*': true }[this.code.charAt(this.index)]) {
						this.dealReg(length);
						this.isReg = Lexer.NOT_REG;
					}
					//依次遍历匹配规则，命中则继续
					else {
						for(var i = 0, matches = this.rule.matches(), len = matches.length; i < len; i++) {
							var match = matches[i];
							if(match.match(this.peek, this.code, this.index)) {
								var token = new Token(match.tokenType(), match.content(), match.val()),
									error = match.error(),
									matchLen = match.content().length;
								if(token.type() == Token.ID && this.rule.keyWords()[token.val()]) {
									token.type(Token.KEYWORD);
								}
								this.tokens.push(token);
								this.index += matchLen - 1;
								var n = character.count(token.val(), '\n');
								count += n;
								this.totalLine += n;
								if(n) {
									var i = match.content().lastIndexOf('\n');
									this.col = match.content().length - i;
								}
								else {
									this.col += matchLen;
								}
								if(error) {
									this.error(error, this.code.slice(this.index - matchLen, this.index));
								}
								//支持perl正则需判断关键字、圆括号对除号语义的影响
								if(perlReg && match.perlReg() != Lexer.IGNORE) {
									if(match.perlReg() == Lexer.SPECIAL) {
										this.isReg = !!this.rule.keyWords()[match.content()];
									}
									else {
										this.isReg = match.perlReg();
									}
									if(match.tokenType() == Token.ID) {
										this.parentheseState = !!this.rule.keyWords()[match.content()];
									}
									else if(this.peek == character.LEFT_PARENTHESE) {
										this.parentheseStack.push(this.parentheseState);
										this.parentheseState = false;
									}
									else if(this.peek == character.RIGHT_PARENTHESE) {
										this.isReg = this.parentheseStack.pop() ? Lexer.IS_REG : Lexer.NOT_REG;
									}
									else {
										this.parentheseState = false;
									}
								}
								continue outer;
							}
						}
						//如果有未匹配的，说明规则不完整，加入other类型并抛出警告
						this.error('unknow token');
					}
				}
			},
			readch: function() {
				this.peek = this.code.charAt(this.index++);
				this.col++;
			},
			dealNumber: function() {
				var lastIndex = this.index - 1;
				//以0开头需判断是否2、16进制
				if(this.peek == '0') {
					this.readch();
					//0后面是x或者X为16进制
					if(this.peek.toUpperCase() == 'X') {
						do {
							this.readch();
						} while(character.isDigit16(this.peek) || this.peek == character.DECIMAL);
						if(this.peek.toUpperCase() == 'H') {
							this.readch();
						}
						this.tokens.push(new Token(Token.NUMBER, this.code.slice(lastIndex, --this.index)));
					}
					//0后面是b或者B是2进制
					else if(this.peek.toUpperCase() == 'B') {
						do {
							this.readch();
						} while(character.isDigit2(this.peek) || this.peek == character.DECIMAL);
						this.tokens.push(new Token(Token.NUMBER, this.code.slice(lastIndex, --this.index)));
					}
					//或者8进制
					else if(character.isDigit8(this.peek)){
						do {
							this.readch();
						} while(character.isDigit8(this.peek) || this.peek == character.DECIMAL);
						this.tokens.push(new Token(Token.NUMBER, this.code.slice(lastIndex, --this.index)));
					}
					//小数
					else if(this.peek == character.DECIMAL) {
						this.dealDecimal(lastIndex);
					}
					//就是个0
					else {
						this.tokens.push(new Token(Token.NUMBER, '0'));
						this.index--;
					}
					return;
				}
				//先处理整数部分
				do {
					this.readch();
				} while(character.isDigit(this.peek) || this.peek == '_');
				//整数后可能跟的类型L字母
				if(this.peek.toUpperCase() == 'L') {
					this.tokens.push(new Token(Token.NUMBER, this.code.slice(lastIndex, this.index)));
					return;
				}
				//可能小数部分
				if(this.peek == character.DECIMAL) {
					this.dealDecimal(lastIndex);
					return;
				}
				//指数部分
				if(this.peek.toUpperCase() == 'E') {
					this.readch();
					//+-号
					if(this.peek == '+' || this.peek == '-') {
						this.readch();
					}
					if(!character.isDigit(this.peek)) {
						this.error('SyntaxError: missing exponent', this.code.slice(lastIndex, this.index));
					}
					//指数后数字位
					while(character.isDigit(this.peek)) {
						this.readch();
					}
				}
				this.tokens.push(new Token(Token.NUMBER, this.code.slice(lastIndex, --this.index)));
				this.col += this.index - lastIndex;
			},
			dealDecimal: function(last) {
				var lastIndex = this.index - 1;
				if(last !== undefined) {
					lastIndex = last;
				}
				do {
					this.readch();
				} while(character.isDigit(this.peek));
				//小数后可能跟的类型字母D、F
				if(this.peek.toUpperCase() == 'D' || this.peek.toUpperCase() == 'F') {
					this.tokens.push(new Token(Token.NUMBER, this.code.slice(lastIndex, this.index)));
					return;
				}
				//指数部分
				if(this.peek.toUpperCase() == 'E') {
					this.readch();
					//+-号
					if(this.peek == '+' || this.peek == '-') {
						this.readch();
					}
					if(!character.isDigit(this.peek)) {
						this.error('SyntaxError: missing exponent', this.code.slice(lastIndex, this.index));
					}
					//指数后数字位
					while(character.isDigit(this.peek)) {
						this.readch();
					}
				}
				this.tokens.push(new Token(Token.NUMBER, this.code.slice(lastIndex, --this.index)));
				this.col += this.index - lastIndex;
			},
			dealReg: function(length) {
				var lastIndex = this.index - 1,
					res = false;
				outer:
				do {
					this.readch();
					if(this.peek == character.LINE) {
						break;
					}
					else if(this.peek == character.BACK_SLASH) {
						this.index++;
					}
					else if(this.peek == character.LEFT_BRACKET) {
						do {
							this.readch();
							if(this.peek == character.LINE) {
								break outer;
							}
							else if(this.peek == character.BACK_SLASH) {
								this.index++;
							}
							else if(this.peek == character.RIGHT_BRACKET) {
								continue outer;
							}
						} while(this.index < length);
					}
					else if(this.peek == character.SLASH) {
						res = true;
						var hash = {};
						do {
							this.readch();
							if(character.isLetter(this.peek)) {
								if(hash[this.peek] || (this.peek != 'g' && this.peek != 'i' && this.peek != 'm')) {
									this.error('SyntaxError: invalid regular expression flag ' + this.peek, this.code.slice(lastIndex, this.index));
									break outer;
								}
								hash[this.peek] = true;
							}
							else {
								break outer;
							}
						} while(this.index < length);
					}
				} while(this.index < length);
				if(!res) {
					this.error('SyntaxError: unterminated regular expression literal', this.code.slice(lastIndex, this.index - 1));
				}
				this.tokens.push(new Token(Token.REG, this.code.slice(lastIndex, --this.index)));
				this.col += this.index - lastIndex;
			},
			cache: function(i) {
				if(i !== undefined && i !== null) {
					this.cacheLine = i;
				}
				return this.cacheLine;
			},
			finish: function() {
				return this.index >= this.code.length;
			},
			line: function() {
				return this.totalLine;
			},
			error: function(s, str) {
				if(str === undefined) {
					str = this.code.substr(this.index - 1, 20);
				}
				if(Lexer.mode() === Lexer.STRICT) {
					throw new Error(s + ', line ' + this.line() + ' col ' + this.col + '\n' + str);
				}
				else if(Lexer.mode() === Lexer.LOOSE && window.console) {
					if(console.warn) {
						console.warn(s + ', line ' + this.line() + ' col ' + this.col + '\n' + str);
					}
					else if(console.error) {
						console.error(s + ', line ' + this.line() + ' col ' + this.col + '\n' + str);
					}
					else if(console.log) {
						console.log(s + ', line ' + this.line() + ' col ' + this.col + '\n' + str);
					}
				}
			}
		}).statics({
			IGNORE: 0,
			IS_REG: 1,
			NOT_REG: 2,
			SPECIAL: 3,
			STRICT: 0,
			LOOSE: 1,
			mode: function(i) {
				if(i !== undefined) {
					cmode = i;
				}
				return cmode;
			}
		}),
		cmode = Lexer.LOOSE;
	module.exports = Lexer;
});