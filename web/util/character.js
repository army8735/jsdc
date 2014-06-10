define(function(require, exports, module) {
  exports.LINE = '\n';
  exports.ENTER = '\r';
  exports.BLANK = ' ';
  exports.TAB = '\t';
  exports.UNDERLINE = '_';
  exports.DOLLAR = '$';
  exports.SHARP = '#';
  exports.MINUS = '-';
  exports.AT = '@';
  exports.SLASH = '/';
  exports.BACK_SLASH = '\\';
  exports.DECIMAL = '.';
  exports.LEFT_BRACKET = '[';
  exports.RIGHT_BRACKET = ']';
  exports.STAR = '*';
  exports.LEFT_PARENTHESE = '(';
  exports.RIGHT_PARENTHESE = ')';
  exports.COMMA = ',';
  exports.SEMICOLON = ';';
  exports.EQUAL = '=';
  exports.isDigit = function(c) {
    return c >= '0' && c <= '9';
  };
  exports.isDigit16 = function(c) {
    return exports.isDigit(c) || (c >= 'a' && c <= 'f') || (c >= 'A' && c <= 'F');
  };
  exports.isDigit2 = function(c) {
    return c == '0' || c == '1';
  };
  exports.isDigit8 = function(c) {
    return c >= '0' && c <= '7';
  };
  exports.isLetter = function(c) {
    return (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z');
  };
  exports.count = function(s, c) {
    var count = 0,
      i = -1;
    while((i = s.indexOf(c, i + 1)) != -1) {
      count++;
    }
    return count;
  };
  exports.isUndefined = function(s) {
    return typeof s == 'undefined';
  };
  exports.isString = function(s) {
    return Object.prototype.toString.call(s) == "[object String]";
  };
  exports.isNumber = function(s) {
    return Object.prototype.toString.call(s) == "[object Number]";
  };
});