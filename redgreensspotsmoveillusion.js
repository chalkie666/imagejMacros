// Movement illusion
// Look just above the flashing circles and they appear to move towards each other
// but look directly at one of them and it only flashes in same position
// can't remeber where I found this illusion.

importClass(Packages.ij.IJ);
importClass(Packages.ij.gui.OvalRoi);

imp = IJ.createImage("ColourMoveIllusion", "RGB black", 256, 256, 1);
imp.show();

for (var i=0; i<100; i++) {
	imp.setRoi(new OvalRoi(150, 106, 45, 45));
	IJ.setForegroundColor(255, 0, 0);
	IJ.run(imp, "Fill", "slice");
	IJ.run(imp, "Select None", "");
	IJ.wait(100);
	IJ.setForegroundColor(0, 0, 0);
	IJ.run("Restore Selection", "");
	IJ.run(imp, "Fill", "slice");
	IJ.run(imp, "Select None", "");
	IJ.setForegroundColor(0, 255, 0);
	imp.setRoi(new OvalRoi(80, 106, 45, 45));
	IJ.run(imp, "Fill", "slice");
	IJ.run(imp, "Select None", "");
	IJ.wait(100);
	IJ.setForegroundColor(0, 0, 0);
	IJ.run("Restore Selection", "");
	IJ.run(imp, "Fill", "slice");
	IJ.run(imp, "Select None", "");
	imp.show();
	}
imp.close();
