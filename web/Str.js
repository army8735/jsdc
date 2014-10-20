define(function(require, exports, module){var homunculus = require('homunculus');
var JsNode = homunculus.getClass('Node', 'es6');

var Class = require('./util/Class');

var String = Class(function(jsdc) {
  this.jsdc = jsdc;
}).methods({
  parse: function(t) {
    var s = t.content();
    var res = s.replace(/\\u\{([\da-f]+)\}/ig, function(m, n, i) {
      var count = 0;
      for(i -= 1; i > 0; i--) {
        if(s.charAt(i) == '\\') {
          count++;
        }
        else {
          break;
        }
      }
      if(count % 2 == 1) {
        return m;
      }
      var arr = [];
      n = parseInt(n, 16);
      while(n > 0xFFFF) {
        arr.push('FFFF');
        n -= 0xFFFF;
      }
      arr.push(fix(n.toString(16)));
      return '\\u' + arr.join('\\u');
    });
    if(res != s) {
      this.jsdc.ignore(t, 'str1');
      this.jsdc.append(res);
    }
  }
});

function fix(n) {
  var i = 4 - n.length;
  switch(i) {
    case -1:
    case 0:
      return n;
    case 1:
      return '0' + n;
    case 2:
      return '00' + n;
    case 3:
      return '000' + n;
  }
}

module.exports = String;
});