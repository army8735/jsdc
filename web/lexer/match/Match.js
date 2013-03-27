define(function(require, exports, module) {
	var Class = require('../../util/Class'),
		character = require('../../util/character'),
		Lexer = require('../Lexer');
	module.exports = Class(function(type, setPReg, special, parenthese) {
		this.type = type;
		if(character.isUndefined(setPReg)) {
			setPReg = Lexer.IGNORE;
		}
		this.setPReg = setPReg;
		this.result = null;
		if(setPReg) {
			if(character.isUndefined(special)) {
				special = function() {
					return Lexer.IGNORE;
				};
			}
			if(character.isUndefined(parenthese)) {
				parenthese = function() {
					return false;
				};
			}
		}
		this.special = special;
		this.parenthese = parenthese;
	}).methods({
		tokenType: function() {
			return this.type;
		},
		perlReg: function() {
			return this.setPReg;
		},
		val: function() {
			return this.content();
		},
		content: function() {
			return this.result;
		},
		match: function(c, code, index) {
			//需被实现
			return false;
		},
		error: function() {
			return false;
		}
	});
});