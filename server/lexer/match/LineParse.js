var Match = require('./Match'),
	Lexer = require('../Lexer'),
	Token = require('../Token'),
	character = require('../../util/character'),
	LineParse = Match.extend(function(type, begin, end, mutiline, setPReg) {
		if(character.isUndefined(mutiline)) {
			mutiline = false;
		}
		Match.call(this, type, setPReg);
		this.begin = begin;
		this.end = end;
		this.msg = null;
		this.mutiline = mutiline;
	}).methods({
		match: function(c, code, index) {
			this.msg = null;
			if(this.begin == code.charAt(index - 1)) {
				var len = code.length,
					lastIndex = index - 1,
					res = false;
				while(index < len) {
					var c = code.charAt(index++);
					//ЧЄТе
					if(c == character.BACK_SLASH) {
						if(code.charAt(index++) == character.ENTER) {
							index++;
						}
					}
					else if(c == character.LINE && !this.mutiline) {
						break;
					}
					else if(c == this.end) {
						res = true;
						break;
					}
				}
				if(!res) {
					this.msg = 'SyntaxError: unterminated ' + Token.type(this.type).toLowerCase() + ' literal';
				}
				this.result = code.slice(lastIndex, index);
				return true;
			}
			return false;
		},
		error: function() {
			return this.msg;
		},
		val: function() {
			return this.content().slice(this.begin.length, -this.end.length);
		}
	});
module.exports = LineParse;
