var Class = require('../util/Class'),
	Node = Class(function(type, token) {
		this.type = type;
		if(token) {
			this.children = token;
		}
		else {
			this.children = [];
		}
	}).methods({
		name: function() {
			return this.type;
		},
		leaves: function() {
			return this.children;
		},
		add: function() {
			var self = this,
				args = Array.prototype.slice.call(arguments, 0);
			args.forEach(function(node) {
				if(Array.isArray(node)) {
					self.children = self.children.concat(node);
				}
				else {
					self.children.push(node);
				}
			});
		}
	});
module.exports = Node;
