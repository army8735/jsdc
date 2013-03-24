define(function(require, exports, module) {
	var Class = require('../../util/Class'),
		Rule = Class(function(words, pReg) {
			var self = this;
			self.kw = {};
			words.forEach(function(o) {
				self.kw[o] = true;
			});
			self.pReg = pReg || false;
			self.matchList = [];
		}).methods({
			perlReg: function() {
				return this.pReg;
			},
			addMatch: function(match) {
				this.matchList.push(match);
				return this;
			},
			matches: function() {
				return this.matchList;
			},
			keyWords: function() {
				return this.kw;
			}
		});
	module.exports = Rule;
});