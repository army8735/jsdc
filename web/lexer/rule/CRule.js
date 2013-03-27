define(function(require, exports, module) {
	var Rule = require('./Rule'),
		LineSearch = require('../match/LineSearch'),
		CharacterSet = require('../match/CharacterSet'),
		LineParse = require('../match/LineParse'),
		CompleteEqual = require('../match/CompleteEqual'),
		Token = require('../Token'),
		Lexer = require('../Lexer'),
		CRule = Rule.extend(function() {
			var self = this;
			Rule.call(self, CRule.KEYWORDS);
			
			self.addMatch(new LineSearch(Token.COMMENT, '//', '\n'));
			self.addMatch(new LineSearch(Token.COMMENT, '/*', '*/', true));
			self.addMatch(new LineParse(Token.STRING, '"', '"'));
			self.addMatch(new LineParse(Token.STRING, "'", "'"));
			self.addMatch(new CharacterSet(Token.ID, [
				CharacterSet.LETTER,
				CharacterSet.UNDERLINE
			], [
				CharacterSet.LETTER,
				CharacterSet.UNDERLINE,
				CharacterSet.DIGIT
			]));
			self.addMatch(new CharacterSet(Token.HEAD, [
				CharacterSet.SHARP
			], [
				CharacterSet.LETTER,
				CharacterSet.UNDERLINE,
				CharacterSet.DIGIT
			]));

			['~', '!', '%', '^', '&&', '&', '*', '(', ')', '--', '-', '++', '+', '===', '==', '=', '!==', '!=', '[', ']', '{', '}', '||', '|', '\\', '<<<', '>>>', '<<', '>>', '<', '>', '>=', '<=', ',', '...', '.', '?:', '?', ':', ';', '/'].forEach(function(o) {
				self.addMatch(new CompleteEqual(Token.SIGN, o));
			});
		}).statics({
			KEYWORDS: 'if else for break case continue function true false switch default do while int float double long const_cast private short char return void static null whcar_t volatile  uuid explicit extern class const __finally __exception __try virtual using signed namespace new public protected __declspec delete unsigned friend goto inline mutable deprecated dllexport dllimport dynamic_cast enum union bool naked typeid noinline noreturn nothrow register this reinterpret_cast selectany sizeof static_cast struct template thread throw try typedef typename'.split(' ')
		});
	module.exports = CRule;
});