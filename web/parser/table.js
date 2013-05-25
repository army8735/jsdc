define(function(require, exports, module) {
	var EcmascriptRule = require('../lexer/rule/EcmascriptRule'),
		actionList = EcmascriptRule.KEYWORDS.concat(EcmascriptRule.SIGN).concat(['number', 'id', 'string', 'reg', 'template']),
		gotoList = ['PROGRAM', 'ELEMS', 'ELEM', 'FNDECL', 'CLASSDECL', 'STMT', 'EMPTSTMT', 'BLOCK', 'VARSTMT', 'IFSTMT', 'ITERSTMT', 'CTNSTMT', 'BTKSTMT', 'RETSTMT', 'WITHSTMT', 'SWCHSTMT', 'LABSTMT', 'THRSTMT', 'TRYSTMT', 'DEBSTMT', 'EXPTSTMT', 'VARDECLS', 'VARDECL', 'ASSIGNEXPR'],
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
	actionTable[0][55] = 's9';
	actionTable[0][88] = 's6';
	actionTable[0][111] = 's2';
	actionTable[0][118] = 'r1';
	actionTable[1][118] = 'acc';
	actionTable[6][55] = 's9';
	actionTable[6][88] = 's6';
	actionTable[6][89] = 's7';
	actionTable[6][111] = 's2';
	for(i = 0; i < actionLen; i++) {
		actionTable[2][i] = 'r23';
		actionTable[3][i] = 'r8';
		actionTable[4][i] = 'r5';
		actionTable[5][i] = 'r3';
		actionTable[7][i] = 'r24';
		actionTable[8][i] = 'r9';
		actionTable[11][i] = 'r27';
		actionTable[13][i] = 'r25';
		actionTable[14][i] = 'r10';
		actionTable[16][i] = 'r32';
		actionTable[17][i] = 'r29';
		actionTable[19][i] = 'r33';
	}
	actionTable[9][114] = 's10';
	actionTable[10][82] = 's15';
	actionTable[10][105] = 'r28';
	actionTable[10][111] = 'r28';
	actionTable[11][20] = 's10';
	actionTable[11][48] = 's10';
	actionTable[11][52] = 's10';
	actionTable[11][113] = 's10';
	actionTable[11][114] = 's10';
	actionTable[11][115] = 's10';
	actionTable[11][116] = 's10';
	actionTable[11][117] = 's10';
	actionTable[12][105] = 's9';
	actionTable[12][111] = 's13';
	actionTable[15][37] = 's16';
	actionTable[15][48] = 's16';
	actionTable[15][113] = 's16';
	actionTable[15][114] = 's16';
	actionTable[15][115] = 's16';
	actionTable[15][116] = 's16';
	actionTable[15][117] = 's16';
	actionTable[16][82] = 's18';
	actionTable[16][86] = null;
	actionTable[16][107] = null;
	actionTable[18][113] = 's16';
	actionTable[18][114] = 's16';
	actionTable[18][115] = 's16';
	actionTable[18][116] = 's16';
	actionTable[18][117] = 's16';
	actionTable[19][82] = 's18';

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
	gotoTable[9][21] = 12;
	gotoTable[9][22] = 11;
	gotoTable[15][23] = 17;
	gotoTable[18][23] = 19;

	exports.actionList = actionList;
	exports.gotoList = gotoList;
	exports.actionTable = actionTable;
	exports.gotoTable = gotoTable;
	exports.actionHash = actionHash;
	exports.gotoHash = gotoHash;
	exports.actionLen = actionLen;
	exports.gotoLen = gotoLen;
});