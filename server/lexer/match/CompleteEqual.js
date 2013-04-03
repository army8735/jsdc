var Match = require('./Match'),
	Lexer = require('../Lexer'),
	character = require('../../util/character'),
	CompleteEqual = Match.extend(function(type, result, setPReg) {
		Match.call(this, type, setPReg);
		this.result = result;
	}).methods({
		match: function(c, code, index) {
			return code.substr(--index, this.result.length) == this.result;
		}
	});
module.exports = CompleteEqual;
