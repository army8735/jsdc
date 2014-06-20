var homunculus = require('homunculus');
var JsNode = homunculus.getClass('Node', 'es6');
var Token = homunculus.getClass('Token');

module.exports = function(node, word) {
  var res = recursion(node, { 's': '', 'word': word });
  return res.s;
};

function recursion(node, res) {
  var isToken = node.name() == JsNode.TOKEN;
  var isVirtual = isToken && node.token().type() == Token.VIRTUAL;
  if(isToken) {
    if(!isVirtual) {
      var token = node.token();
      if(res.word && [Token.ID, Token.NUMBER, Token.KEYWORD].indexOf(token.type()) > -1) {
        res.s += ' ';
      }
      res.s += token.content();
      res.word = [Token.ID, Token.NUMBER, Token.KEYWORD].indexOf(token.type()) > -1;
    }
  }
  else {
    node.leaves().forEach(function(leaf) {
      recursion(leaf, res);
    });
  }
  return res;
}