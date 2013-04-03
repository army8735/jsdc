package me.army8735.jssc.lexer.match;

public abstract class AbstractMatch {
	private int type;
	private int setPReg;
	protected String result;
	
	public AbstractMatch(int type, int setPReg) {
		this.type = type;
		this.setPReg = setPReg;
	}
	
	public int tokenType() {
		return this.type;
	}
	public int perlReg() {
		return this.setPReg;
	}
	public String val() {
		return this.content();
	}
	public String content() {
		return this.result;
	}
	public abstract boolean match(char c, String code, int index);
	public boolean error() {
		return false;
	}
}
