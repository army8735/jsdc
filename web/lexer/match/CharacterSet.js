define(function(require, exports, module) {
	var Match = require('./Match'),
		Lexer = require('../Lexer'),
		character = require('../../util/character');
	function is(c, arr) {
		var res = false;
		for(var i = 0, len = arr.length; i < len; i++) {
			if (res) {
				break;
			}
			switch(arr[i]) {
				case CharacterSet.LETTER:
					res = character.isLetter(c);
				break;
				case CharacterSet.UNDERLINE:
					res = character.UNDERLINE == c;
				break;
				case CharacterSet.DIGIT:
					res = character.isDigit(c);
				break;
				case CharacterSet.DOLLAR:
					res = character.DOLLAR == c;
				break;
				case CharacterSet.AT:
					res = character.AT == c;
				break;
				case CharacterSet.SHARP:
					res = character.SHARP == c;
				break;
				case CharacterSet.MINUS:
					res = character.MINUS == c;
				break;
				case CharacterSet.DIGIT16:
					res = character.isDigit16(c);
				break;
			}
		}
		return res;
	}
	var CharacterSet = Match.extend(function(type, begins, bodies, setPReg, special, parenthese) {
		Match.call(this, type, setPReg, special, parenthese);
		this.begins = begins;
		this.bodies = bodies;
	}).methods({
		match: function(c, code, index) {
			if(is(c, this.begins)) {
				this.result = c;
				var lastIndex = index;
				while(index <= code.length) {
					var res = is(code.charAt(index++), this.bodies);
					if(!res) {
						break;
					}
				}
				this.result += code.slice(lastIndex, index - 1);
				return true;
			}
			return false;
		}
	}).statics({
		LETTER: 0,
		UNDERLINE: 1,
		DIGIT: 2,
		DOLLAR: 3,
		AT: 4,
		SHARP: 5,
		MINUS: 6,
		DIGIT16: 7
	});
	module.exports = CharacterSet;
});