define(function(require, exports, module) {
	var Class = require('../util/Class'),
		Node = Class(function(type, token) {
			this.type = type;
			if(token) {
				this.children = token;
			}
			else {
				this.children = [];
			}
			return this;
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
				return self;
			},
			token: function() {
				return this.children;
			}
		}).statics({
			CSTSTMT: 'cststmt',
			LETSTMT: 'letstmt',
			VARSTMT: 'varstmt',
			VARDECL: 'vardecl',
			FNBODY: 'fnbody',
			BLOCK: 'block',
			ITERSTMT: 'iterstmt',
			TOKEN: 'Token',
			FNPARAMS: 'fnparams',
			BINDELEMENT: 'bindelement',
			RESTPARAM: 'restparam',
			EXPR: 'expr',
			CLASSDECL: 'classdecl',
			CLASSTAIL: 'classtail',
			HERITAGE: 'heritage',
			CLASSBODY: 'classbody',
			METHOD: 'method',
			SUPERSTMT: 'superstmt',
			GETFN: 'getfn',
			SETFN: 'setfn',
			PROGRAM: 'program',
			STMT: 'stmt',
			ASSIGN: 'assign',
			EMPTSTMT: 'emptstmt',
			IFSTMT: 'ifstmt',
			CNTNSTMT: 'cntnstmt',
			BRKSTMT: 'brkstmt',
			RETSTMT: 'retstmt',
			WITHSTMT: 'withstmt',
			SWCHSTMT: 'swchstmt',
			CASEBLOCK: 'caseblock',
			CASECLAUSE: 'caseclause',
			DFTCLAUSE: 'dftclause',
			LABSTMT: 'labstmt',
			THRSTMT: 'thrstmt',
			TRYSTMT: 'trystmt',
			DEBSTMT: 'debstmt',
			CACH: 'cach',
			FINL: 'finl',
			FNDECL: 'fndecl',
			FNEXPR: 'fnexpr',
			ASSIGNEXPR: 'assignexpr',
			CNDTEXPR: 'cndtexpr',
			LOGOREXPR: 'logorexpr',
			LOGANDEXPR: 'logandexpr',
			BITOREXPR: 'bitorexpr',
			BITANDEXPR: 'bitandexpr',
			BITXOREXPR: 'bitxorexpr',
			EQEXPR: 'eqexpr',
			RELTEXPR: 'reltexpr',
			SHIFTEXPR: 'shiftexpr',
			ADDEXPR: 'addexpr',
			MTPLEXPR: 'mtplexpr',
			UNARYEXPR: 'unaryexpr',
			CONSTOR: 'constor',
			CONSCALL: 'conscall',
			MMBEXPR: 'mmbexpr',
			PRMREXPR: 'prmrexpr',
			ARRLTR: 'arrltr',
			OBJLTR: 'objltr',
			PROPTASSIGN: 'proptassign',
			PROPTNAME: 'proptname',
			PROPTSETS: 'propsets',
			ARGS: 'args',
			ARGLIST: 'arglist',
			ASSIGNOPRT: 'assignoprt'
		});
	module.exports = Node;
});