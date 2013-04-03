package me.army8735.jssc.util;

public class Character {
	public static final char LINE = '\n';
	public static final char ENTER = '\r';
	public static final char BLANK = ' ';
	public static final char TAB = '\t';
	public static final char UNDERLINE = '_';
	public static final char DOLLAR = '$';
	public static final char SHARP = '#';
	public static final char MINUS = '-';
	public static final char AT = '@';
	public static final char SLASH = '/';
	public static final char BACK_SLASH = '\\';
	public static final char DECIMAL = '.';
	public static final char LEFT_BRACKET = '[';
	public static final char RIGHT_BRACKET = ']';
	public static final char STAR = '*';
	public static final char LEFT_PARENTHESE = '(';
	public static final char RIGHT_PARENTHESE = ')';
	public static final char COMMA = ',';
	public static final char SEMICOLON = ';';
	public static final char EQUAL = '=';
	public static final boolean isDigit(char c) {
		return c >= '0' && c <= '9';
	}
	public static final boolean isDigit16(char c) {
		return isDigit(c) || (c >= 'a' && c <= 'f') || (c >= 'A' && c <= 'F');
	}
	public static final boolean isDigit2(char c) {
		return c == '0' || c == '1';
	}
	public static final boolean isDigit8(char c) {
		return c >= '0' && c <= '7';
	}
	public static final boolean isLetter(char c) {
		return (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z');
	}
	public static final int count(String s, char c) {
		int count = 0;
		int i = -1;
		while((i = s.indexOf(c, i + 1)) != -1) {
			count++;
		}
		return count;
	}
}
