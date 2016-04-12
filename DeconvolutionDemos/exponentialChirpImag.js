// imports first please
importClass(Packages.ij.IJ);

// generate exponential chirp image by running the function expoChirpImage
expoChirpImage();

// function to draw an expoential chirp image - has no arguments, all hardcoded variables. 
function expoChirpImage() {

	// width and height of test spatial frequency "Chirp" image
	var width = 512;
	var height = 512;
	// make a javascript array to hold computed pixel values
	var pixels = [];
	
	// compute the pixel values and put them in the pixels array
	for (j = 0; j < height; j++)
		for (i = 0; i < width; i++) {
			var t = (i/149.8); // this value avoids sharp discontinuity at 1024 wide image edge, less artifacts?
	
			// linear chirp
			// pixValue = sin((2*PI)*(0.1+t)*t);
	
			// exponential chirp
			var fzero = 0.1;
			var k = 3.0;
			var pixValue = Math.sin(2.0*Math.PI*fzero*(Math.pow(k,t)*t));
			// scale  pix value range to number of photons, eg. 255 for confocal, 10000 in widefield
	
			var scaledPixVal = ((pixValue+1.0) * 5000.0) + 1.0;
			// put the computed pixel value in the correct place in the array
			pixels[j*width + i] = scaledPixVal;
		}
	
	// make an image to work in - we need 32 bit floating point precision for the following maths.
	IJ.newImage("Chirp", "32-bit grayscale-mode", width, height, 1);
	IJ.selectWindow("Chirp");
	// get the ImagePlus from the selected image window
	var imp = IJ.getImage();
	// get the ImageProcessor from the ImagePlus, in this case its a FloatProcessor
	var ip = imp.getProcessor();
	// convert JS array to native java array
	// var JavaArray = Java.to(data,"int[]"); works in nashorn js interpreter
	var javaPixels = Java.to(pixels,"float[]");
	// replace the pixels in the image with the calculated pattern
	ip.setPixels(javaPixels);
	// make sure the display is updated and drawn so we see the pattern.
	imp.updateAndDraw(); 
	IJ.resetMinAndMax();
}