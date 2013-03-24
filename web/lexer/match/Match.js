define(function(require, exports, module) {
	var Class = require('../../util/Class'),
		Lexer = require('../Lexer');
	module.exports = Class(function(type, setPReg) {
		this.type = type;
		if(setPReg === undefined) {
			setPReg = Lexer.IGNORE;
		}
		this.setPReg = setPReg;
		this.result = null;
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