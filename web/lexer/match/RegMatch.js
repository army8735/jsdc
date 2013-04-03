define(function(require, exports, module) {
	var Match = require('./Match'),
		RegMatch = Match.extend(function(type, reg, valid, setPReg, special, parenthese) {
			if(typeof valid == 'number') {
				parenthese = special;
				special = setPReg;
				setPReg = valid;
				valid = null;
			}
			Match.call(this, type, setPReg, special, parenthese);
			this.reg = reg;
			this.valid = valid;
		}).methods({
			match: function(c, code, index) {
				var self = this,
					res = self.reg.exec(code.slice(index - 1));
				self.msg = null;
				if(res) {
					self.result = res[0];
					if(self.valid) {
						for(var i = 0, keys = Object.keys(self.valid), len = keys.length; i < len; i++) {
							if(self.valid[keys[i]].test(self.result)) {
								self.msg = keys[i];
								break;
							}
						}
					}
					return true;
				}
				return false;
			},
			error: function() {
				return this.msg;
			}
		});
	module.exports = RegMatch;
});