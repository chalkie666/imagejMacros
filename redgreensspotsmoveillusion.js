imp = IJ.newImage("colourspotsillusion", "RGB black", 256, 256, 1);

for (i=0; i<100; i++) {
	imp.setRoi(new OvalRoi(171, 106, 43, 41));
	IJ.run("Color Picker...", "");
	IJ.setForegroundColor(255, 0, 0);
	IJ.run(imp, "Fill", "slice");
	IJ.updateDisplay();
	IJ.wait(100);
	IJ.setForegroundColor(0, 0, 0);
	IJ.run(imp, "Fill", "slice");
	IJ.updateDisplay();
	imp.setRoi(new OvalRoi(46, 106, 45, 42));
	IJ.setForegroundColor(0, 255, 0);
	IJ.run(imp, "Fill", "slice");
	IJ.updateDisplay();
	IJ.wait(100);
	IJ.setForegroundColor(0, 0, 0);
	IJ.run(imp, "Fill", "slice");
	IJ.updateDisplay();
	imp.show();
	}