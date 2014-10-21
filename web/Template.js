define(function(require, exports, module){var homunculus = require('homunculus');
var JsNode = homunculus.getClass('Node', 'es6');
var Token = homunculus.getClass('Token');

var Class = require('./util/Class');

var Template = Class(function(jsdc) {
  this.jsdc = jsdc;
}).methods({
  parse: function(t) {
    this.jsdc.ignore(t, 'template1');
    var s = t.content();
    var res = '"';
    var has = false;
    outer:
    for(var i = 1; i < s.length - 1; i++) {
      var c = s.charAt(i);
      if(c == '\\') {
        res += '\\';
        res += s.charAt(++i);
        continue;
      }
      else if(c == '"') {
        res += '\\';
      }
      else if(c == '\n') {
        res += '\\';
      }
      else if(c == '$') {
        if(s.charAt(i + 1) == '{') {
          has = true;
          res += '" + ';
          var multi = false;
          for(var j = i + 2; j < s.length - 1; j++) {
            c = s.charAt(j);
            if(c == '}') {
              break;
            }
            else if(!/[a-z_\s]/i.test(c)) {
              multi = true;
              break;
            }
          }
          if(multi) {
            res += '(';
          }
          for(i = i + 2; i < s.length - 1; i++) {
            c = s.charAt(i);
            if(c == '}') {
              if(multi) {
                res += ')';
              }
              res += ' + "';
              continue outer;
            }
            else {
              res += c;
            }
          }
        }
      }
      res += c;
    }
    res += '"';
    this.jsdc.append((has ? '(' : '')
      + res.replace(/^""\s\+\s/, '').replace(/\s\+\s""$/, '')
      + (has ? ')' : ''));
  }
});

module.exports = Template;
});