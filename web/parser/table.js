define(function(require, exports, module) {
	var EcmascriptRule = require('../lexer/rule/EcmascriptRule'),
		actionList = EcmascriptRule.KEYWORDS.concat(EcmascriptRule.SIGN).concat(['number', 'id', 'string', 'reg', 'template']),
		gotoList = ['PROGRAM', 'ELEMS', 'ELEM', 'FNDECL', 'CLASSDECL', 'STMT', 'EMPTSTMT', 'BLOCK', 'VARSTMT', 'IFSTMT', 'ITERSTMT', 'CTNSTMT', 'BTKSTMT', 'RETSTMT', 'WITHSTMT', 'SWCHSTMT', 'LABSTMT', 'THRSTMT', 'TRYSTMT', 'DEBSTMT', 'EXPTSTMT', 'VARDECLS', 'VARDECL'],
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
	actionTable[0][54] = 's9';
	actionTable[0][87] = 's6';
	actionTable[0][110] = 's2';
	actionTable[0][117] = 'r1';
	actionTable[1][117] = 'acc';
	actionTable[6][54] = 's9';
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
		actionTable[13][i] = 'r25';
		actionTable[14][i] = 'r10';
	}
	actionTable[9][113] = 's10';
	actionTable[10][81] = 's11';
	actionTable[10][104] = 's9';
	actionTable[10][110] = 'r28';
	actionTable[11][19] = 's10';
	actionTable[11][47] = 's10';
	actionTable[11][51] = 's10';
	actionTable[11][112] = 's10';
	actionTable[11][113] = 's10';
	actionTable[11][114] = 's10';
	actionTable[11][115] = 's10';
	actionTable[11][116] = 's10';
	actionTable[12][110] = 's13';
	gotoTable[0][0] = 1;
	gotoTable[0][2] = 5;
	gotoTable[0][5] = 4;
	gotoTable[0][6] = 3;
	gotoTable[0][7] = 8;
	gotoTable[0][8] = 14;
	gotoTable[6][2] = 5;
	gotoTable[6][5] = 4;
	gotoTable[6][6] = 3;
	gotoTable[6][8] = 14;
	gotoTable[9][22] = 12;

	exports.actionList = actionList;
	exports.gotoList = gotoList;
	exports.actionTable = actionTable;
	exports.gotoTable = gotoTable;
	exports.actionHash = actionHash;
	exports.gotoHash = gotoHash;
	exports.actionLen = actionLen;
	exports.gotoLen = gotoLen;
});