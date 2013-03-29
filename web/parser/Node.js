define(function(require, exports, module) {
	var Class = require('../util/Class'),
		Node = Class(function(tag) {
			this.tag = tag;
			this.children = null;
		}).methods({
			leaves: function() {
				return this.children;
			},
			add: function(arguments) {
				this.children = this.children || [];
				var args = Array.prototype.slice.call(arguments, 0);
				args.forEach(function(node) {
					this.children.push(node);
				});
			}
		});
	module.exports = Node;
});