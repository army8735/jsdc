define(function(require, exports, module) {
	var EcmascriptRule = require('../lexer/rule/EcmascriptRule'),
		actionList = EcmascriptRule.KEYWORDS.concat(EcmascriptRule.SIGN).concat(['number', 'id', 'string', 'reg', 'template']),
		gotoList = ['PROGRAM', 'ELEMS', 'ELEM', 'FNDECL', 'CLASSDECL', 'STMT', 'EMPTSTMT', 'BLOCK', 'VARSTMT', 'IFSTMT', 'ITERSTMT', 'CTNSTMT', 'BTKSTMT', 'RETSTMT', 'WITHSTMT', 'SWCHSTMT', 'LABSTMT', 'THRSTMT', 'TRYSTMT', 'DEBSTMT', 'EXPTSTMT'],
		actionLen = actionList.length + 1,
		gotoLen = gotoList.length,
		stateNum = 100,
		actionTable = new Array(stateNum),
		gotoTable = new Array(stateNum),
		actionHash = {},
		gotoHash = {};
	for(var i = 0; i < stateNum; i++) {
		actionTable[i] = new Array(actionLen);
		gotoTable[i] = new Array(gotoLen);
	}
	actionList.forEach(function(o, i) {
		actionHash[o] = i;
	});
	gotoList.forEach(function(o, i) {
		gotoHash[o] = i;
	});
	actionTable[0][87] = 's6';
	actionTable[0][110] = 's2';
	actionTable[0][117] = 'r1';
	actionTable[1][117] = 'acc';
	actionTable[6][87] = 's6';
	actionTable[6][88] = 's7';
	actionTable[6][110] = 's2';
	for(i = 0; i < actionLen; i++) {
		actionTable[2][i] = 'r23';
		actionTable[3][i] = 'r8';
		actionTable[4][i] = 'r5';
		actionTable[5][i] = 'r3';
		actionTable[7][i] = 'r24';
		actionTable[8][i] = 'r9';
	}
	gotoTable[0][0] = 1;
	gotoTable[0][2] = 5;
	gotoTable[0][5] = 4;
	gotoTable[0][6] = 3; 
	gotoTable[6][2] = 5;
	gotoTable[6][5] = 4;
	gotoTable[6][6] = 3;

	exports.actionList = actionList;
	exports.gotoList = gotoList;
	exports.actionTable = actionTable;
	exports.gotoTable = gotoTable;
	exports.actionHash = actionHash;
	exports.gotoHash = gotoHash;
	exports.actionLen = actionLen;
	exports.gotoLen = gotoLen;
});