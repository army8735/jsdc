package me.army8735.jssc.lexer;

public class Token {
	public static final int VIRTUAL = -1;
	public static final int OTHER = 0;
	public static final int BLANK = 1;
	public static final int TAB = 2;
	public static final int LINE = 3;
	public static final int NUMBER = 4;
	public static final int ID = 5;
	public static final int COMMENT = 6;
	public static final int STRING = 7;
	public static final int SIGN = 8;
	public static final int REG = 9;
	public static final int KEYWORD = 10;
	public static final int ANNOT = 11;
	public static final int HEAD = 12;
	public static final int TEMPLATE = 13;
	
	private int t;
	private String c;
	private String v;
	
	public Token(int t, String c, String v) {
		this.t = t;
		this.c = c;
		this.v = v;
	}
	
	public int type() {
		return this.t;
	}
	public String content() {
		return this.c;
	}
	public String val() {
		return this.v;
	}
}
