var jsdc = require('./jsdc');
var fs = require('fs');

fs.readFile('./jquery-1.9.1.js', { encoding: 'utf-8' }, function(err, data) {
	if (err) throw err;
	var d1 = +new Date;
	jsdc.parse(data);
	var d2 = +new Date;
	console.log(d2 - d1);
});