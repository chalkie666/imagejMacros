// @OpService ops
// @UIService ui
// Script parameters for ops etc. Has to be at the very top for the SciJava framework to get them

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
 * http://www.optinav.info/Iterative-Deconvolve-3D.htm
 * http://www.optinav.info/download/Iterative_Deconvolve_3D.class
 * 
 * Gaussian PSF 3D from Bob Dougherty
 * http://www.optinav.info/download/Gaussian_PSF_3D.class
 * or Diffraction PSF 3D also from Bob Dougherty
 * http://www.optinav.info/Diffraction-PSF-3D.htm
 * http://www.optinav.info/download/Diffraction_PSF_3D.class
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
 *
 * What is iterative constrained deconvolution - an algorithm explination:
 * from DAVID A. AGARD et al. meth cell biol 1989
 * http://dx.doi.org/10.1016/S0091-679X(08)60986-3   
 * .... significantly improve performance for three-dimensional optical sectioning data. 
 * The method is stable, and shows substantially accelerated con-vergence compared to previous methods.
 * Convergence is reached in 5-10 cycles (instead of 20-50) and since most of the improvement occurs in the first 5 cycles,
 * iterations can be terminated early with little degradation.
 * The strategy is to develop a positively constrained solution, g, that,
 * when convolved with the known smearing function s, will regenerate the observed data o.
 * The pixel-by-pixel differences between the convolved guess and the observed data are used to update the guess.
 * Two different update schemes can be used: an additive method initially developed by van Cittert
 * and later modified by Jannson (Jannson et al., 1970) and by us (Agard et al., 1981),
 * and a multiplicative method developed by Gold (1964): 
 * 				(a) o^k = i^k * s
 * eq 12		(b) i^k+1 = i^k + y(o)(o — o^k)
 * 				(c) if i^k+1 < 0 then i^k+1 = 0   (non negativity constraint)
 * 				(d) k = k + 1
 * 				
 * 				y = 1 — [o^k — A]^2 / A^2 
 * 			where 
 * 			i is what we want to know - the restored image
 * 			i^k is the current guess at i
 * 			o is observed blurry, noisy image
 * 			o^k is the current guess i^k blurred with s (a)
 * 			A is a constant set to (the maximum value of o)/2.
 * 			
 * For the Gold method, the update equation on line b is changed to 
 * 		(b') ik(ook) 
 * 		
 * In three dimensions these schemes suffer from rather slow convergence, although the Gold method is faster.
 * The problem stems from inadequate correction of the high-frequency components.
 * This can be seen by the following argument performed only with the additive method for simplicity. 
 * At each cycle we desire to correct our current guess with a function, 6, so that 
 * o ~ (g, + 8) * s or in Fourier space: 0 (G, + 6)S. Rearranging, we get
 * 8 = (0 — G,S)IS (13) 
 * From this we can see that a better approximation to the update is to use an inverse filtered version
 * of the difference between the observed data and the convolved guess.
 * In practice, we use a Wiener filter to minimize effects of noise and only perform the inverse filtered update
 * for the first two cycles. After that, we switch to the modified Van Cittert update described above [Eq. (12)].
 * At each cycle, the new guess is corrected to maintain positivity and any other desired real-space constraints,
 * such as spatial boundedness. Every five cycles or so, the guess is smoothed with a Gaussian filter to ....
 */


// imports first please
importClass(Packages.ij.IJ);
importClass(Packages.ij.WindowManager);
importClass(Packages.ij.gui.WaitForUserDialog);
importClass(Packages.ij.plugin.Duplicator);
importClass(Packages.ij.plugin.ImageCalculator);
importClass(Packages.ij.process.ImageStatistics);
importClass(Packages.net.imglib2.img.display.imagej.ImageJFunctions);
importClass(Packages.net.imglib2.FinalDimensions);
importClass(Packages.net.imagej.ops.Op);
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

//Test ij log output
IJ.log("Iteration is a cool way to do deconv");

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
// Add noise with a certain SD
//IJ.run("Add Specified Noise...", "standard=0.2");
//renameImage("Chirp-blur-scaled", "Chirp-blur-noise");
// Add Poisson modulatory noise, like photon shot noise. The "mean" parameter is ignored in modulatory mode. 
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


// IJ builtin commands implemetation of non negative constrained additive iterative deconv algorithm
// Take blurred noisy image as first guess at model image
// we will need an image calculator to get differnce image
ic = new ImageCalculator();
imgStats = new ImageStatistics();

// set needed variables then loop the following to do iterations until run out of iterations
temp = new Duplicator().run(WindowManager.getImage("Chirp-blur-noise"));
temp.setTitle("temp");
temp.show();
ChirpBlurNoiseimp = WindowManager.getImage("Chirp-blur-noise");
var iterations = 76; // multiples of 5 plus 1 please, as we smooth every 5 iterations and 0th iteration.
for (i=0; i<iterations; i++) {

	// blur (convolve) current restored image model (guess) with PSF
	IJ.run("FD Math...", "image1=temp operation=Convolve "
	+ "image2=PSFwithNoise result=tempConv do");
	// scale result to max 10k, so its comparable with current guess
	scaleIntensities10k("tempConv", "tempConvScaled");
	tempConvimp = WindowManager.getImage("tempConv");
	tempConvimp.changes = false;
	tempConvimp.close();
	IJ.selectWindow("tempConvScaled");
	// calculate the difference between the blurred noisy image and the current guess image 
	var tempConvScaledimp = WindowManager.getImage("tempConvScaled");
	var impDiff = ic.run("Subtract create", ChirpBlurNoiseimp, tempConvScaledimp);
	impDiff.setTitle("difference");
	impDiff.show();
	//messageContinue("Difference image:", "looks OK? Continue?");
	// get the max and SD of the diff image to track convergence... it should get closer to zero each iteration. 
	// get the input image statistics object with the MAX
	var maxOfDiffImage = impDiff.getStatistics().max;
	//var stats = imgStats.getStatistics(impDiff);
	//var SDOfDiffImage = theStats.stdDev;
	// then write it onto the IJ log window so we can see it as the iterations run through
	IJ.log("Iteration " + i + " MaxOfDiffImage =" + maxOfDiffImage);
	//IJ.log("Iteration " + i + " MaxOfDiffImage =" + maxOfDiffImage + " StDevOfDiffImage =" + SDOfDiffImage);

	// update the guess temp image by adding the difference image to it
	var tempAdd = ic.run("Add create", temp, impDiff);
	tempConvScaledimp.changes = false;
	tempConvScaledimp.close();
	impDiff.changes = false;
	impDiff.close();
	temp.changes = false;
	temp.close();
	tempAdd.setTitle("tempAdd");
	tempAdd.show();
	//messageContinue("Added image:", "looks OK? Continue?");

	// low pass filter the new guess to remove high frequency noise above PSF band limit
	// Do it every 5 iterations perhaps?
	if (i % 5 == 0) {
		IJ.selectWindow("tempAdd");
		IJ.run("Gaussian Blur...", "sigma=1");
	}

	// apply non negativity constraint: set all -ve values in guess image to zero.
	IJ.selectWindow("tempAdd");
	var tempClipZero = new Duplicator().run(WindowManager.getImage("tempAdd"));
	tempClipZero.setTitle("tempClipZero");
	tempClipZero.show();

	var minTempClipZero = tempClipZero.getStatistics().min;
	IJ.setThreshold(tempClipZero, minTempClipZero, 0.0);
	//messageContinue("below zeros:", "below zeros thresholded?, Continue?");
	IJ.run(tempClipZero, "Create Selection", "");
	//messageContinue("below zeros selected:", "below zeros selected?, Continue?");
	// carefull: if no pixels below 0 then nothing selected and all image is set to zero!
	if (minTempClipZero < -0.000000000001) {
		IJ.run(tempClipZero, "Set...", "value=0.0");
		}
	//messageContinue("below zeros set to zero:", "below zeros set to zero?, Continue?");

	tempClipZero.setTitle("tempClipZero");
	tempClipZero.show();
	//close and kill the tempAdd image
	tempAdd.changes = false;
	tempAdd.close();
	IJ.run("Collect Garbage", ""); // make sure closed images are really gone
	//messageContinue("Close imp:", "closed temp, Continue?");
	// get the right image to duplicate
	IJ.selectWindow("tempClipZero");
	//messageContinue("image OK?:", "tempClipZero image OK?, Continue?");
	// make sure
	//IJ.selectWindow("tempClipZero");
	//temp = new Duplicator().run(WindowManager.getImage("tempClipZero")); // why doesnt this work!?????!
	// Use IJ.run(Duplicate...
	IJ.run("Select All", "");
	IJ.run("Duplicate...", "title=temp");
	//temp.setTitle("temp");
	//temp.show();
	temp = WindowManager.getImage("temp");

	IJ.resetMinAndMax();
	//messageContinue("show new temp:", "new temp image ok?, Continue?");
	tempClipZero.changes = false;
	tempClipZero.close();
	//messageContinue("Iterations:", "this is the " + i + " iteration, Continue?");
	IJ.run("Collect Garbage", ""); // make sure we tidy up objects

}  // end of iteration loop
IJ.selectWindow("temp");
scaleIntensities10k("temp", "tempReScaled");
temp.changes = false;
temp.close();
tempReScaled = WindowManager.getImage("tempReScaled");
tempReScaled.setTitle("deconvIJ");
IJ.selectWindow("deconvIJ");
horizLinePlot();


// Use Iterative Deconvolve 3D (DAMAS3) plugin algorithm.
IJ.selectWindow("Chirp-blur-noise");
IJ.run("Iterative Deconvolve 3D", "image=Chirp-blur-noise point=PSFwithNoise "
+ "output=Deconvolved normalize show log perform wiener=0.33 "
+ "low=0 z_direction=1 maximum=100 terminate=0.001");
IJ.resetMinAndMax();
horizLinePlot();


// Perform Brian's IJ2 Ops Richardson Lucy iterative deconvolution
// on the noisy image with the slightly noisy PSF
// to simulate a real sitiuation.
// Trying to do things the ops way...
IJ.selectWindow("Chirp-blur-noise");
chirpBlurNoise = IJ.getImage();
IJ.selectWindow("PSFwithNoise");
PSFwNoise = IJ.getImage();
// wrap IJ1 ImagePlus into IJ2 Img for use in ops
chirpBlurNoise = ImageJFunctions.wrap(chirpBlurNoise);
PSFwNoise = ImageJFunctions.wrap(PSFwNoise);
// Do the ops RL-TV deconvolution
// For ops.run version we only need rawImage, psf and iterations,
// and a 4th parameter for TV regularization if using TV version (why and how - the constructor has lots more parameters????)
deconvRLTVResult = ops.run("deconvolve.richardsonLucyTV", chirpBlurNoise, PSFwNoise, 78, 0.001);  // few 10s of iterations? Use 4th parameter eg 0.001 for TV regularization if use RL with TV
// show an Img from imglib2 using IJ GUI this way:
ui.show("deconvRLTVResult", deconvRLTVResult);
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
makeAxialPSF("0", "0wave", "axialPSF-noSA");

messageContinue("Notice", "The PSF is symmetrical in Z.\n"
	+ "Horizontal direction is X, and vertical is Z - axial direction!\n"
	+ "   Next - Generate XZ PSF with Spherical Aberration (S.A.). \n"
	+ "   Continue?");

// and another PSF with  spherical aberration.
makeAxialPSF("500", "withSA", "axialPSF-SA");

messageContinue("Notice", "The PSF is NOT symmetrical in Z!\n"
	+ "Horizontal direction is X, and vertical is Z - axial direction!\n"
	+ "   Next - Blur Horizontal Bars image with the PSF having S.A. \n"
	+ "   Continue?");

// Convolve the bars image with the PSF with spherical aberration
IJ.run("FD Math...", "image1=horizBars operation=Convolve "
+ "image2=axialPSF-SA result=barsBlurSA do");
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
IJ.run("Iterative Deconvolve 3D", "image=barsBlurSA point=axialPSF-noSA "
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
IJ.run("Iterative Deconvolve 3D", "image=barsBlurSA point=axialPSF-SA "
+ "output=barsBlurSAdeconSA normalize show log perform wiener=0.33 "
+ "low=0 z_direction=1 maximum=200 terminate=0.001");
IJ.run("Set... ", "zoom=200 x=128 y=128");
IJ.setMinAndMax(0.0, 10000.0);
IJ.run("Fire", "");

messageContinue("Notice", "The Blur is now nicely corrected: \n"
	+ "Aberrations are accounted for. \n"
	+ "   Finished part 2");

// Stopit and Tidyup! again
IJ.run("Close All", "");

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
IJ.makeLine(0, 400, 511, 400);
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
