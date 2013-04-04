var Lexer = require('./lexer/Lexer'),
	EcmascriptRule = require('./lexer/rule/EcmascriptRule'),
	Token = require('./lexer/Token'),
	Parser = require('./parser/Parser'),
	Node = require('./parser/Node'),
	character = require('./util/character'),
	env,
	preHash,
	index,
	res,
	node;

function init() {
	index = 0;
	preHash = {};
	res = '';
	env = [0];
}
function join(node, ignore) {
	var isToken = node.name() == Node.TOKEN,
		isVirtual = isToken && node.leaves().type() == Token.VIRTUAL;
	if(isToken) {
		if(!isVirtual) {
			var token = node.leaves();
			if(token.content() != 'var') {
				if(token.content() == 'let') {
					res += 'var';
				}
				else {
					res += token.content();
				}
			}
			while(ignore[++index]) {
				res += ignore[index].content();
			}
		}
	}
	else {
		if(node.name() == Node.VARDECL) {
			preVar(node);
		}
		else if(node.name() == Node.FNBODY) {
			env.push(res.length);
		}
		else if(node.name() == Node.BLOCK) {
			var blockHasLet = false;
			node.leaves().forEach(function(leaf) {
				if(!blockHasLet && leaf.name() == Node.LETSTMT) {
					hasLet = true;
				}
			});
		}
		else if(node.name() == Node.ITERSTMT && node.leaves()[0].leaves().content() == 'for') {
			var forHasLet = node.leaves()[2].name() == Node.LETSTMT;
			if(forHasLet) {
				forstmt(true, res.length);
			}
		}
		node.leaves().forEach(function(leaf, i) {
			if(blockHasLet && i == 1) {
				block(true, res.length);
			}
			join(leaf, ignore, index);
		});
		if(node.name() == Node.FNBODY) {
			env.pop();
		}
		else if(node.name() == Node.BLOCK && blockHasLet) {
			block(false, res.length - 1);
		}
		else if(node.name() == Node.ITERSTMT && forHasLet) {
			forstmt(false, res.length);
		}
	}
}
function preVar(vardecl) {
	var vn = vardecl.leaves()[0].leaves().content(),
		index = env[env.length - 1];
	preHash[index] = preHash[index] || {};
	if(preHash[index][vn]) {
		return;
	}
	preHash[index][vn] = true;
	var prefix = res.slice(0, index),
		suffix = res.slice(index);
	res = prefix + 'var ' + vn + ';' + suffix;
}
function block(startOrEnd, index) {
	var prefix = res.slice(0, index),
		suffix = res.slice(index);
	if(startOrEnd) {
		res = prefix + '(function() {' + suffix;
	}
	else {
		res = prefix + '}).call(this);' + suffix;
	}
}
function forstmt(startOrEnd, index) {
	var prefix = res.slice(0, index),
		suffix = res.slice(index);
	if(startOrEnd) {
		res = prefix + '(function() {' + suffix;
	}
	else {
		res = prefix + '}).call(this);' + suffix;
	}
}

exports.parse = function(code) {
	var lexer = new Lexer(new EcmascriptRule());
	lexer.parse(code);
	var parser = new Parser(lexer);
	var ignore = {};
	try {
		node = parser.program();
		ignore = parser.ignore();
	} catch(e) {
		if(console) {
			console.error(e);
		}
		return e.toString();
	}
	init();
	join(node, ignore);
	return character.escapeHTML(res);
};
exports.tree = function() {
	return node;
};
