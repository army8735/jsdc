var Lexer = require('./lexer/Lexer'),
	EcmascriptRule = require('./lexer/rule/EcmascriptRule'),
	Token = require('./lexer/Token'),
	Parser = require('./parser/Parser'),
	Node = require('./parser/Node'),
	character = require('./util/character'),
	env,
	temp,
	bindId,
	bind,
	preHash,
	index,
	res,
	node;

function init() {
	index = 0;
	preHash = {};
	res = '';
	env = [0];
	temp = '';
	bind = '';
}
function join(node, ignore) {
	var isToken = node.name() == Node.TOKEN,
		isVirtual = isToken && node.leaves().type() == Token.VIRTUAL;
	if(isToken) {
		if(!isVirtual) {
			var token = node.leaves();
			if(token.content() != 'var') {
				if(token.content() == 'let' || token.content() == 'const') {
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
		//var前置最近作用域顶部
		if(node.name() == Node.VARSTMT) {
			preVar(node);
		}
		//记录作用域索引入栈并将默认参数赋值添加至此
		else if(node.name() == Node.FNBODY) {
			var i = res.lastIndexOf('{') + 1;
			res = res.slice(0, i) + bind + res.slice(i);
			env.push(i);
		}
		//检测block子节点是否有let或const
		else if(node.name() == Node.BLOCK) {
			var blockHasLet = false;
			node.leaves().forEach(function(leaf) {
				if(!blockHasLet && leaf.name() == (Node.LETSTMT || leaf.name() == Node.CSTSTMT)) {
					hasLet = true;
				}
			});
		}
		//for语句中是否有let
		else if(node.name() == Node.ITERSTMT && node.leaves()[0].leaves().content() == 'for') {
			var forHasLet = node.leaves()[2].name() == Node.LETSTMT;
			if(forHasLet) {
				forstmt(true, res.length);
			}
		}
		//记录fnparams里的默认赋值
		else if(node.name() == Node.FNPARAMS) {
			bindelement(node);
		}
		//默认赋值前缓存当前结果，之后互换
		else if(node.name() == Node.BINDELEMENT) {
			temp = res;
		}
		//递归子节点
		node.leaves().forEach(function(leaf, i) {
			if(blockHasLet && i == 1) {
				block(true, res.length);
			}
			join(leaf, ignore, index);
		});
		//fnbody结束后作用域出栈
		if(node.name() == Node.FNBODY) {
			env.pop();
		}
		//block结束后如有let和const需用匿名function包裹模拟块级作用域
		else if(node.name() == Node.BLOCK && blockHasLet) {
			block(false, res.length - 1);
		}
		//for结束后如有let也需包裹模拟
		else if(node.name() == Node.ITERSTMT && forHasLet) {
			forstmt(false, res.length);
		}
		//默认参数结束后
		else if(node.name() == Node.BINDELEMENT) {
			var id = bindId.shift();
			bind += 'if(typeof ' + id + ' == "undefined") ' + id + res.slice(temp.length) + ';';
			res = temp;
		}
	}
}
function preVar(varstmt) {
	var index = env[env.length - 1];
	preHash[index] = preHash[index] || {};
	for(var i = 1, leaves = varstmt.leaves(), len = leaves.length; i < len; i += 2) {
		var vn = leaves[i].leaves()[0].leaves().content();
		if(preHash[index][vn]) {
			return;
		}
		preHash[index][vn] = true;
		var prefix = res.slice(0, index),
			suffix = res.slice(index);
		res = prefix + 'var ' + vn + ';' + suffix;
	}
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
function bindelement(node) {
	bindId = [];
	for(var i = 1, leaves = node.leaves(), len = leaves.length; i < len; i++) {
		if(leaves[i].name() == Node.BINDELEMENT) {
			bindId.push(leaves[i - 1].leaves().content());
			i += 2;
		}
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
