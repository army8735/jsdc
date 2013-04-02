var Rule = require('./Rule'),
	LineSearch = require('../match/LineSearch'),
	CharacterSet = require('../match/CharacterSet'),
	LineParse = require('../match/LineParse'),
	CompleteEqual = require('../match/CompleteEqual'),
	Token = require('../Token'),
	Lexer = require('../Lexer'),
	JavaRule = Rule.extend(function() {
		var self = this;
		Rule.call(self, JavaRule.KEYWORDS);
		
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
		self.addMatch(new CharacterSet(Token.ANNOT, [
			CharacterSet.AT
		], [
			CharacterSet.LETTER,
			CharacterSet.UNDERLINE,
			CharacterSet.DIGIT
		]));

		['~', '!', '%', '^', '&&', '&', '*', '(', ')', '--', '-', '++', '+', '===', '==', '=', '!==', '!=', '[', ']', '{', '}', '||', '|', '\\', '<<<', '>>>', '<<', '>>', '<', '>', '>=', '<=', ',', '...', '.', '?:', '?', ':', ';', '/'].forEach(function(o) {
			self.addMatch(new CompleteEqual(Token.SIGN, o));
		});
	}).statics({
		KEYWORDS: 'if else for break case continue function true false switch default do while int float double long throws transient abstract assert boolean byte class const enum instanceof try volatilechar extends final finally goto implements import protected return void char interface native new package private protected throw short public return strictfp super synchronized this static null String'.split(' ')
	});
module.exports = JavaRule;
