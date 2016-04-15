/* Convolution - Deconvolution Demo for Fiji/ImageJ
 * 
 * Exponential freq. chirp wave image, with automated convolution / deconvolution demos.
 * Shows the point of doing image resortation aka deconvolution
 * as well as differences between simple inverse filters and constrained iterative methods. 
 * 
 * 
 * Daniel J. White 2016
 *
 * 
 * License: GPL v3.
 *
 * Thanks:
 * 	
 * 	For code/tools - the authors of the plugins used here
 * 	and all the contributors to imageJ and Fiji. 
 * 	
 *  For ideas, late Jan 2016 - Richard Cole,
 *  Director: Advanced Light Microscopy & Image Analysis Core 
 *  Wadsworth Center Dept. of Biomedical Sciences 
 *  School of Public Health State University of New York
 *
 * 
 * Requires:
 * 
 * some plugins, see below: 
 * Put the .class files in the ImageJ plugins folder
 * As of jan 2016, compiling the .java source code files 
 * on the fly is broken for java 1.8 (but works for java 1.6)
 * 
 * Iterative Deconvolution 3D plugin from Bob Dougherty
 * http://www.optinav.com/Iterative-Deconvolve-3D.htm
 * http://www.optinav.com/download/Iterative_Deconvolve_3D.class
 * 
 * Gaussian PSF 3D from Bob Dougherty
 * http://www.optinav.com/download/Gaussian_PSF_3D.class
 * or Diffraction PSF 3D also from Bob Dougherty
 * http://www.optinav.com/download/Diffraction_PSF_3D.class
 *
 * RandomJ for Poisson noise generation
 * Turn on Erik's  http://imagej.net/ImageScience imageJ update site
 * if you dont have it already. 
 *
 *
 * What's it useful for:
 * Showing why image restoration by deconvolution is necessary
 * before quantitative analysis of high N.A. fluorescence microscopy images. 
 * Showing/Simulating the effect of lens induced blurring (convolution)
 * on contrast vs. spatial frequency, then fixing the introduced error,
 * within the bandwidth of system, by deconvolution.
 *
 * see also http://imagej.nih.gov/ij/macros/DeconvolutionDemo.txt
 *
 * Showing a simulation of the systematic error effect
 * of the microscope objective lens OTF (similar to a Gaussian blur) on the
 * contrast of different spatial frequencies in a (fluorescence) light microscopy image.
 * Showing why optical microscope images should be deconvolved,
 * to correct the systematic error of contrast vs. feature size:
 * Contrast of smaller and smaller features is attenuatted more and more,
 * up to the band limit and/or noise floor, after which deconvolution can no longer
 * recover information since it is lost.
 *
 * In raw images, measurements of small object intensities
 * are lower than they should be compared to larger objects,
 * making quantitative analysis problematic.
 *
 * Deconvolution greatly improves the situation, to the resolution and/or noise limit.
 *
 * Why this approach?
 * Biologists are often unfamiliar with frequency space and the Fourier Theorem.
 * The general trivial description of blur caused by the lens describes
 * the resolution limit to some intuitive extent, but does not highlight
 * the main problem that deconvolution fixes: That the contrast of resolved
 * features is attenuated as a function of feature size - the OTF.
 * Meaning, quantification of intensity in different sized objects is likely
 * to be far from close to the true values until the image is deconvolved,
 * thus restoring the contrast and intensity of the smaller features.
 * The trick here is to show frequency space in real space: Not having to
 * explain frequency space so we don't lose most of the audience.
 *
 * How to do it:
 * open this imageJ javascript in the script editor, select language javascript and run.
 * You might resize and reposition some windows.
 *
 * How to do interactive exploration of different blur widths with live line profile plot:
 * 1) Run the script to generate the increasingly finely striped image.
 * 2) Select all, then run plot profile (Ctrl-A, Ctrl-K)
 * 3) In plot profile, select live mode.
 * 4) Run the Gaussian Blur tool, set Sigma (Radius) to 5, turn on Preview.
 * 5) Toggle preview on and off to see the effect.
 * 6) Try different Sigma values to simulate different lens numerical apertures. 
 * 		Higher Sigma corresponds to lower N.A., and more blur.
 * 7) See the effect of noise on resolution by adding noise to the image. 
 * 		Use a line selection, not select all, for the plot profile.
 * 8) Note the bandwidth (resolution limit) imposed by the blur.
 * 9) Note that high spatial frequency features (smaller objects) close to the resolution limit
 * 		have their contrast more strongly attenuated than lower spatial frequency (large) features.
 */


// imports first please
importClass(Packages.ij.IJ);
importClass(Packages.ij.gui.WaitForUserDialog);
importClass(Packages.ij.plugin.Duplicator);
// end of imports


// Main code execution block
// running functions defined below and ImageJ functions.


//Part 1 - convolution and deconvolution in 2D
// generate exponential (or linear) chirp stripey image by running the  drawTestImageFunction with expoChirpFunction as argument
drawTestImageFromFunction(512, 512, expoChirpFunction, "Chirp");
//drawTestImageFromFunction(linearChirpFunction, "Chirp");
horizLinePlot();
messageContinue("Notice", "The pattern has the same contrast, 1-10000 photons,\n"
	+ "regardless of spacing or width of the stripes!\n"
	+ "   Next - Generate Point Spread Function \n"
	+ "   (PSF = image of a point light source) \n"
	+ "   for convolution and deconvolution, Continue?");

// generate squared value (quasi-confocal) 2D Diffraction model PSF
// for blurring (de-sharpening) by convolution and deblurring (re-shaprening or restoring) by deconvolution
IJ.run("Diffraction PSF 3D", "index=1.520 numerical=1.42 wavelength=510 "
+ "longitudinal=0 image=10 slice=200 width,=512 height,=512 depth,=1 "
+ "normalization=[Sum of pixel values = 1] title=PSF");
IJ.selectWindow("PSF");
IJ.run("Square");
// make the pixel values large, so we can add a realtively small amount of noise later
IJ.run("Multiply...", "value=1000000000000");
IJ.resetMinAndMax();
// add a little white noise to avoid divide by zero in inverse filter.
IJ.selectWindow("PSF");
IJ.run("Duplicate...", "title=PSFwithNoise");
IJ.selectWindow("PSFwithNoise");
IJ.run("Add Specified Noise...", "standard=0.00000002");

messageContinue("Notice", "The PSF is generated from a diffraction model. \n"
+ "It is about 20 pixels wide, and simulates a confocal PSF.\n"
+ "   Next - blur the stripey image using the PSF, Continue?");

// Use Fourier domain math to do the convolution
// needs power of 2 sized images in x and y. 
IJ.selectWindow("Chirp");
IJ.run("FD Math...", "image1=Chirp operation=Convolve "
+ "image2=PSFwithNoise result=Chirp-blur32bit do");
// rescale intensities to same range as original image.
scaleIntensities10k("Chirp-blur32bit", "Chirp-blur-scaled");
horizLinePlot();

messageContinue("Notice", "The smaller the features are,\n"
+ "the more their contrast is attenuated (lost): \n"
+ "The smaller features have the most wrong pixel values! \n"
+ "   Next - Inverse Filter with the PSF \n"
+ "   to restore the image intensites, Continue?");

// Fourier domain math deconvolve: inverse filter with PSFwithNoise.
// A little noise in PSF avoids divide by zero
// needs square power of 2 sized images!!! so 1024x1024 or 512x512 here I guess.
// Above, we used FD math to do the convolution as well.
IJ.run("FD Math...", "image1=Chirp-blur32bit operation=Deconvolve "
+ "image2=PSFwithNoise result=InverseFiltered do");
IJ.selectWindow("InverseFiltered");
horizLinePlot();

messageContinue("Notice", "The inverse filter gives a perfect result \n"
+ "because the PSF is known perfectly and there is no noise! \n"
+ "Sadly this is not a realistic situation, there is always noise... \n"
+ "   Next - Generate blurred, slightly noisy image, Continue?");

// Generate more realistic test image that contains noise
// so we can demo how to deal with that. 
IJ.selectWindow("Chirp-blur-scaled");
//Poisson modulatory noise, like photon shot noise. The "mean" parameter is ignored in modulatory mode. 
IJ.run("RandomJ Poisson", "mean=10.0 insertion=Modulatory");
renameImage("Chirp-blur-scaled with modulatory Poisson noise", "Chirp-blur-noise");
IJ.selectWindow("Chirp-blur-noise");
horizLinePlot();

messageContinue("Notice", "This is more realistic: \n"
+ "The image is blurred and contains Noise \n"
+ "Thus, a simple inverse filter will not work, \n"
+ "because amplified noise will kill the real features! \n"
+ "   Next - Inverse filtering a noisy image, Continue?");

// Fourier domain math deconvolve of noisy image: 
// inverse filter with PSF without noise - should amplify noise over features.
IJ.run("FD Math...", "image1=Chirp-blur-noise operation=Deconvolve "
+ "image2=PSF result=InverseFilteredNoise do");
IJ.selectWindow("InverseFilteredNoise");
horizLinePlot();

messageContinue("The inverse filtered image:", "Inverse filtering is defeated by noise! \n"
+ "The pixel intensity values of the smaller and smaller features \n"
+ "have a lower and lower signal : noise ratio \n"
+ "The inverse filtered image has this noise amplified: \n"
+ "so much that the image features are lost. \n"
+ "   Next - Iterative, Non-negativity Constrained Deconvolution \n"
+ "   using the generated PSF on the noisy blurred image, Continue?");

// Perform iterative, non negative constrained, deconvolution
// on the noisy image with the slightly noisy PSF
// to simulate a real sitiuation. 
IJ.selectWindow("Chirp-blur-noise");
IJ.run("Iterative Deconvolve 3D", "image=Chirp-blur-noise point=PSFwithNoise "
+ "output=Deconvolved normalize show log perform wiener=0.33 "
+ "low=0 z_direction=1 maximum=200 terminate=0.001");
IJ.resetMinAndMax();
horizLinePlot();

messageContinue("The restored result image:", "The image contrast is restored up to the resolution and noise limit. \n"
+ "The pixel intensity values of the smaller and smaller features \n"
+ "are restored to close to their real values, up to the resolution limit: \n"
+ "The result image is more quantitative than the original blurred noisy image. \n"
+ "Notice: The noise is also suppressed.\n"
+ "The result is constrained to be non negative: There is no negative light! \n"
+ "The iterative method makes a guess at the true image, blurs it with the PSF, \n"
+ "compares it with the blurry raw image, then makes new guesses by \n"
+ "repeatedly minimising the difference between the blurred guesses and the raw blurry image. \n"
+ "   Finished part 1.")

// Stopit and Tidyup!
IJ.run("Close All", "");


// Part 2  - spherical aberration effect on deconv demo, in xz

// For this simulation we need a test image to show errors from deconvolving with
// perfect PSF when image was blurred with spherical aberrated PSF.
// Horizontal bars should work.
// We will work in the axial direction where SA is worst, xz plane image. 
drawTestImageFromFunction(128, 128, horizontalBarsFunction, "horizBars");
IJ.run("Set... ", "zoom=200 x=128 y=128");

messageContinue("Notice", "The pattern has horizontal bars with sharp edges.\n"
	+ "Horizontal direction is X, and vertical is Z - axial direction!\n"
	+ "   Next - Generate XZ PSF \n"
	+ "   (PSF = image of a point light source) \n"
	+ "   Continue?");

// generate 2D (xz, axial) Diffraction model PSF for use in deconvolution
// with zero spherical aberration, SA is a number... but here must be as a string for IJ.run to work
makeAxialPSF("0", "0wave", "axialPSFnoSA");
// and another with 1 wave at max aperture spherical aberration.
makeAxialPSF("500", "1wave", "axialPSF1wave");

messageContinue("Notice", "The PSF is symmetrical in Z.\n"
	+ "Horizontal direction is X, and vertical is Z - axial direction!\n"
	+ "   Next - Generate XZ PSF with Spherical Aberration (S.A.). \n"
	+ "   Continue?");

// and another PSF with  spherical aberration.
makeAxialPSF("500", "withSA", "axialPSF-SA");

// Convolve the bars image with the PSF with 1 wave spherical aberration
messageContinue("Notice", "The PSF is NOT symmetrical in Z!\n"
	+ "Horizontal direction is X, and vertical is Z - axial direction!\n"
	+ "   Next - Blur Horizontal Bars image with the PSF having S.A. \n"
	+ "   Continue?");

// Convolve the bars image with the PSF with spherical aberration
IJ.run("FD Math...", "image1=horizBars operation=Convolve "
+ "image2=axialPSF1wave result=barsBlurSA do");
// rescale intensities to same range as original image.
scaleIntensities10k("barsBlurSA", "barsBlurSA-scaled");
IJ.run("Set... ", "zoom=200 x=128 y=128");
IJ.setMinAndMax(0.0, 10000.0);
IJ.run("Fire", "");

messageContinue("Notice", "The Blur is NOT symmetrical in Z!\n"
	+ "   Next - Deconvolve Blurred Horizontal Bars image with \n"
	+ "   a non matching, symmetrical PSF, having ZERO S.A. \n"
	+ "   Continue?");

// Deconvolve (constrained iterative, because inverse filter totally fails)
// First, using non aberrated, but therfore wrong, PSF
// Should produce intensity artifacts in the result image bars edges.
IJ.run("Iterative Deconvolve 3D", "image=barsBlurSA point=axialPSFnoSA "
+ "output=barsBlurSAdecon normalize show log perform wiener=0.33 "
+ "low=0 z_direction=1 maximum=200 terminate=0.001");
IJ.run("Set... ", "zoom=200 x=128 y=128");
IJ.setMinAndMax(0.0, 10000.0);
IJ.run("Fire", "");

messageContinue("Notice", "The Blur NOT corrected well at all: Aberration is left over.\n"
	+ "   Next - Deconvolve Blurred Horizontal Bars image with \n"
	+ "   a matching, non symmetrical PSF, with the same S.A. it was blurred with. \n"
	+ "   Continue?");

// Lastly, deconv with correct PSF, should look better!
IJ.run("Iterative Deconvolve 3D", "image=barsBlurSA point=axialPSF1wave "
+ "output=barsBlurSAdeconSA normalize show log perform wiener=0.33 "
+ "low=0 z_direction=1 maximum=200 terminate=0.001");
IJ.run("Set... ", "zoom=200 x=128 y=128");
IJ.setMinAndMax(0.0, 10000.0);
IJ.run("Fire", "");

messageContinue("Notice", "The Blur is now nicely corrected: \n"
	+ "Aberrations are accounted for. \n"
	+ "   Finished part 2");
	

// Functions defined in this javascript file follow below


// abstracted function to draw a test image using another function given as an argument
function drawTestImageFromFunction(width, height, imageFunction, imageName) {

	// width and height of test spatial frequency "Chirp" image
	var pixels = [];

	// compute the pixel values and put them in the pixels array
	for (j = 0; j < height; j++)
		for (i = 0; i < width; i++) {
			// get the pixel value from the imageFunction and put it in the correct place in the array
			pixels[j*width + i] = imageFunction(i, j);
		}
	
	// make an image to work in - we need 32 bit floating point precision for the following maths.
	IJ.newImage(imageName, "32-bit grayscale-mode", width, height, 1);
	IJ.selectWindow(imageName);
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

// calculates an exponential chirp function in x
function expoChirpFunction(x, y) { 
	var t = (x/149.8); // this value avoids sharp discontinuity at 1024 wide image edge, less artifacts?
	var fzero = 0.1;
	var k = 3.0;
	var pixValue = Math.sin(2.0*Math.PI*fzero*(Math.pow(k,t)*t));
	// scale  pix value range to number of photons, eg. 255 for confocal, 10000 in widefield
	var scaledPixVal = ((pixValue+1.0) * 5000.0) + 1.0;
	return scaledPixVal;
}

// calculates a linear chirp function in x
function linearChirpFunction(x, y) { 
	var t = (x/149.8);
	pixValue = Math.sin((2*Math.PI)*(0.1+t)*t);
	var scaledPixVal = ((pixValue+1.0) * 5000.0) + 1.0;
	return scaledPixVal;
}

// function to make horizontal bars image for spherical aberration demo
function horizontalBarsFunction(x, y) {
	if (y%40 < 8) {
		pixValue = 10000.0;
	} else {
		pixValue = 0.0;
	}
	return pixValue;
}

// function to display the info messages before click ok to continue
function messageContinue (title, message) {
	waitDialog = new WaitForUserDialog(title, message);
	waitDialog.show();
}

function horizLinePlot() {
IJ.makeLine(0, 32, 511, 32);
IJ.run("Plot Profile");
}

//rescale intensities to 0-10000
function scaleIntensities10k(image, duplicateTitle) {
	// get the ImagePlus from the correct image window
	IJ.selectWindow(image);
	img1 = IJ.getImage();
	// duplicate and retitle it, and show it
	img2 = new Duplicator().run(img1);
	img2.setTitle(duplicateTitle);
	img2.show();
	// get the input image statistics object with the MAXIMUM
	var max = img1.getStatistics().max;
	IJ.run("Divide...", "value=" + max);
	IJ.run("Multiply...", "value=10000");
	IJ.setMinAndMax(0.0, 10000.0);
}

//rename image - change the title of the ImagePlus.
function renameImage(oldName, newName) {
	// get the ImagePlus from the desired image window
	IJ.selectWindow(oldName);
	var imp = IJ.getImage();
	//change it's title to the new name
	imp.setTitle(newName);
}

function makeAxialPSF(sa, title1, title2) {
	var cmdString =
	IJ.run("Diffraction PSF 3D", "index=1.520 numerical=1.42 wavelength=500 "
	+ "longitudinal=" + sa
	+ " image=100 slice=128 width,=128 height,=1 depth,=128 "
	+ "normalization=[Sum of pixel values = 1] title="
	+ title1);
	IJ.selectWindow(title1);
	//run("Multiply...", "value=1000000000000");
	IJ.makeLine(0, 0, 128, 0);
	IJ.run("Dynamic Reslice", " ");
	IJ.resetMinAndMax();
	renameImage("Dynamic Reslice of " + title1, title2);
	IJ.selectWindow(title2);
	IJ.setMinAndMax(0.0, 0.005);
	IJ.run("Set... ", "zoom=200 x=128 y=128");
	IJ.run("Fire", "");
}

