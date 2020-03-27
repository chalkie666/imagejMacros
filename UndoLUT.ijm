// from Pete Bankhead. 
// Get reference to the original image
idOrig = getImageID();

// Prompt for LUT
luts = getList("LUTs");
Dialog.create("Undo LUT");
Dialog.addChoice("Choose LUT", luts);
Dialog.show();
lut = Dialog.getChoice();

// Create 1x256 image with LUT
newImage("Image-" + lut, "8-bit ramp", 256, 1, 1);
run(lut); // Assume that a default LUT is used...
run("RGB Color");

idLUT = getImageID();

// Loop through & change values in the original
// Take advantage of packed RGB representation
setBatchMode(true);
for (i = 0; i < 256; i++) {
	selectImage(idLUT);
	val = getPixel(i, 0);
	print("Value: " + val);
	selectImage(idOrig);
	// Create a packed RGB version of the value we want in all 3 channels
	changeValues(val, val, (i<<16)|(i<<8)|(i));
}
// Convert to 8-bit... all channels have same values, so should be ok
run("32-bit");
setBatchMode(false);