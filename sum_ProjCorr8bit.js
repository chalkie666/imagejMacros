imp = IJ.getImage();
IJ.run(imp, "Z Project...", "start=1 stop=35 projection=[Sum Slices]");
imp = IJ.getImage();
IJ.run(imp, "Brightness/Contrast...", "setMinAndMax(0.000000000, 200000.000000000");
IJ.run(imp, "8-bit", "");
imp.show();