package me.army8735.jssc.lexer.match;

public class CompleteEqual extends AbstractMatch {

	public CompleteEqual(int type, String result, int setPReg) {
		super(type, setPReg);
		this.result = result;
	}
	
	@Override
	public boolean match(char c, String code, int index) {
		// TODO Auto-generated method stub
		return code.substring(--index, result.length()) == result;
	}

}
