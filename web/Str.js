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
      //u之前\被转义
      if(count % 2 == 1) {
        return m;
      }
      //可能小于10000
      var c = parseInt(n, 16);
      if(c < 0x10000) {
        return '\\u' + n;
      }
      //根据公式转成双字节
      var h = Math.floor((c - 0x10000) / 0x400) + 0xD800;
      var l = (c - 0x10000) % 0x400 + 0xDC00;
      return '\\u' + fix(h.toString(16)) + '\\u' + fix(l.toString(16));
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