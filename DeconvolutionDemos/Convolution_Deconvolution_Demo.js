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
// end of imports


// Main code execution block
// running functions defined below and ImageJ functions.

// generate exponential chirp stripey image by running the function expoChirpImage
expoChirpImage();
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
scaleIntensities10k("Chirp-blur32bit");
IJ.resetMinAndMax();
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
+ "   Finished.")


// functions defined in this javascript file follow below

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
function scaleIntensities10k(image) {
	IJ.selectWindow(image);
	IJ.run("Duplicate...", "title=Chirp-blur-scaled");
	IJ.selectWindow("Chirp-blur-scaled");
	// get the ImagePlus from the selected image window
	var imp = IJ.getImage();
	// get the image statistics object with the MAXIMUM
	var max = imp.getStatistics().max;
	IJ.run("Divide...", "value=" + max);
	IJ.run("Multiply...", "value=10000");
}

//rename image - change the title of the ImagePlus.
function renameImage(oldName, newName) {
	// get the ImagePlus from the desired image window
	IJ.selectWindow(oldName);
	var imp = IJ.getImage();
	//change it's title to the new name
	imp.setTitle(newName);
}
