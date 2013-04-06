import java.io.*;

public class Transform {
	public static void main(String[] args) {
		String dir = System.getProperty("user.dir");
		File source = new File(dir + "/web");
		File target = new File(dir + "/server");
		if(!source.exists() || !source.isDirectory()) {
			throw new Error(source.toString() + " does not exist or is not a Directory.");
		}
		if(!target.exists()) {
			try {
				target.mkdir();
			} catch(SecurityException e) {
				System.err.print(e);
			}
		}
		else if(target.isFile()) {
			throw new Error(target.toString() + " exists and is not a Directory.");
		}
		File[] list = source.listFiles();
		for(File f : list) {
			if(f.isDirectory()) {
				copy(f, target, false);
			}
			else if(f.getName().equals("jsdc.js")) {
				copy(f, target, true);
			}
		}
	}
	public static void copy(File src, File targetRoot, boolean console) {
		if(src.isDirectory()) {
			File[] list = src.listFiles();
			File target = new File(targetRoot, src.getName());
			if(!target.exists()) {
				target.mkdir();
			}
			else if(!target.isDirectory()) {
				throw new Error(target.toString() + " exists and is not a Directory.");
			}
			for(File f : list) {
				copy(f, target, console);
			}
		}
		else if(!src.getName().endsWith("render.js")){
			BufferedReader br = null;
			BufferedWriter bw = null;
			try {
				br = new BufferedReader(new FileReader(src));
				String s = null;
				StringBuilder sb = new StringBuilder();
				int i = 0;
				while((s = br.readLine()) != null) {
					if(i++ > 0) {
						if(s.length() > 0) {
							if(console) {
								sb.append(s.substring(1).replaceAll("window\\.console", "console"));
							}
							else {
								sb.append(s.substring(1));
							}
						}
						else {
							sb.append(s);
						}
						sb.append("\n");
					}
				}
				br.close();
				s = sb.toString();
				s = s.substring(0, s.length() - 3);
				bw = new BufferedWriter(new FileWriter(new File(targetRoot, src.getName())));
				bw.write(s);
				bw.close();
			} catch(IOException e) {
				System.err.print(e);
			} finally {
				if(br != null) {
					try {
						br.close();
					} catch(IOException e) {
						//
					}
				}
				if(bw != null) {
					try {
						bw.close();
					} catch(IOException e) {
						//
					}
				}
			}
		}
	}
}