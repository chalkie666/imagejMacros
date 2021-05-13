/* 
Agard-Accellerated-vanCittert-Gold-hybrid-method open source reference implementation,
as described in Peter A. Jansson:  Deconvolution of images and spectra. 2nd Ed. 1997
chapter 4 (Jansson) and chapter 9.IV. (Swedlow, Agard, Sedat) 
and
DAVID A. AGARD et al. meth cell biol 1989
http://dx.doi.org/10.1016/S0091-679X(08)60986-3


This aims to provide an open reference implementation of this method that 
has been available only in IVE/priism/SoftWoRx software as a black box
with a restrictive license from UCSF/API/GE/Cytiva
*/


 /* Daniel J. White 2021
 *
 * 
 * License: GPL v3.
 *
 * Thanks:
 * 	
 * 	For code/tools - the authors of the plugins used here, especially BIG@EPFL (DeconvolutionLab2) 
 * 	and all the contributors to imageJ and Fiji. 
 * 	
 *  For ideas: Robert Haase and Brian Northan.
 *  
  */

/*
Components:
1. We need the algebraic (additive) iteration update method of van Cittert
for the fist few iterations (see 7. below)
2. We need Gold's geometric (ratio) iteration update method for the remaining few iterations.  
3. We want to acellerate the convergence by inverse filtering
(Wiener or somoehow regularised inverse filter to handle noise)
the difference (residuals) in the algebraic iteration update method (Van Cittert).
in order to accellerate the convergence, as explained in the book chapters. 
4. Then we should need only 5 or 10 iterations for a convereged result, much less then RL method, 
but a smoothing step (Gaussian should work) every 5 iterations is needed to control noise accumulation. 
5. The result for each iteration must be constrained to be non-negative, 
meaning all pixels must be >= 0
6. Obviously we need a 3D input image and a 3D PSF (point spread functions) to match
Note that empirical (measured real) PSFs perform much better than theoretically calculated ones,
because real objective lenses are more complex than any model we have.
The PSF closely matching the raw image data
is more important for the result image quality than the choice of algorithm. 
Here we will use a small 3D widefield test image of some yeast cells, 
and a PSF made on an OMX microscope system using oil immersion 60x / 1.42 plan apochromat lens from olympus,
with a little extra magnification in the tube lens, giving 80 nm image pixel spacing. 
Both of these images have the PCO.edge sCMOS camera offset of ~100-105 counts removed,
since this improves results by not defeating the non-negativity constraint.
This test data is included in the git respository alongside this script.
This allows us to compare results with the proprietary implementation in SoftWoRx (API/Cytiva)
7. Here, we will make use of reference implementations of algorithms/methods from BIG@EPGL's DeconvolutionLab2
such as vanCittert and regularised inverse filters, and/or builtin imageJ functions such as FD Math,
and ideally also CLIJ for GPU acelleration. 

Description of the algorithm:
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

// initialise CLIJ2 for the GPU by (partial) name, or for the 1st GPU it finds, by specifying no GPU explicitly
// or fall back to CPU 
//run("CLIJ2 Macro Extensions", "cl_device=");
run("CLIJ2 Macro Extensions", "cl_device=[730]");
//run("CLIJ2 Macro Extensions", "cl_device=CPU");
Ext.CLIJ2_clear(); // just in case.

// open the test raw image and empirical PSF image
// convert to 32 bit float, as -ve values will happen later, and tidy up the image titles for clarity.
// small images
//open("C:/Users/ECO Office/Documents/GitHub/imagejMacros/DeconvolutionDemos/C1-YeastTNA1_1516_conv_RG_26oC_003_128xcropSub100_zcrop21.tif");
//open("C:/Users/ECO Office/Documents/GitHub/imagejMacros/DeconvolutionDemos/C1-YeastTNA1_1516_conv_RG_26oC_003_256xcropSub100.tif");
//open("C:/Users/dan/Documents/GitHub/imagejMacros/DeconvolutionDemos/C1-YeastTNA1_1516_conv_RG_26oC_003_256xcropSub100.tif");
//Big images
open("C:/Users/ECO Office/Documents/GitHub/imagejMacros/DeconvolutionDemos/MP1_1516_24oC_Gz512xy_005_subtract120.tif");
// CLIJ2 FFT convolve converts to 32 bit, but when we pull images from gpu it converts back to source type
// and thats a bad idea for small fractional number results eg in ratio calculations, as we get BIG rounding errors 
run("32-bit"); 
rename("raw");
//PSFs
//open("C:/Users/ECO Office/Documents/GitHub/imagejMacros/DeconvolutionDemos/gpsf_3D_1514_a3_001_WF-sub105_zcentred.tif");
//open("C:/Users/ECO Office/Documents/GitHub/imagejMacros/DeconvolutionDemos/gpsf_3D_1514_a3_001_WF-sub105crop64_zcentred.tif");
//open("C:/Users/dan/Documents/GitHub/imagejMacros/DeconvolutionDemos/gpsf_3D_1514_a3_001_WF-sub105crop64_zcentred.tif");
//open("C:/Users/dan/Documents/GitHub/imagejMacros/DeconvolutionDemos/gpsf_3D_1514_a3_001_WF-sub105_zcentred.tif");
//Green PSF OMX 60x/1.42 0.2 um z steps, camera offset and bkgrnd subtracted, normaliosed to sum = 1 
open("C:/Users/ECO Office/Documents/GitHub/imagejMacros/DeconvolutionDemos/zeissYGbead_water_1516_24oC_ConvGz0point2z_005_sub160_norm1.tif")
run("32-bit");
rename("rawPsf");

//selectWindow("raw");

// send rawPsf to GPU
rawPsfGPU = "rawPsf";
Ext.CLIJ2_push(rawPsfGPU);

// send raw image to GPU, and make a working image copy of raw, called "guess" on the GPU, to do the interations on.
//send raw to the GPU, and also the psf
rawGPU = "raw";
Ext.CLIJ2_push(rawGPU);


/*
// initial smoothing operation to remove some noise from the raw image - use IJ 3D Gaussian, or CLIJ, with small sigma of 1 or 0.5. 
// Do we even need that since the first step in the iteration in blur image with PSF????
// IJ.run(raw, "Gaussian Blur 3D...", "x=1.0 y=1.0 z=1.0");
// or in CLIJ2-3D-gaussian blur , so define an output variable. Output doesnt need to be rescaled, sum intensity preserved. 
*/

guessGPU = "guess";
sigma = 1.0;
sigma_x = sigma;
sigma_y = sigma;
sigma_z = sigma;
Ext.CLIJ2_gaussianBlur3D(rawGPU, guessGPU, sigma_x, sigma_y, sigma_z);
Ext.CLIJ2_pull(guessGPU);
rename("GuessAfterGaussBlur");
print("Initial Gauss smooth " + Ext.CLIJ2_reportMemory()); 
//Ext.CLIJ2_reportMemory();

/* iterations setup
 need to define output image variables same size as input guess image
 apparently by magic.
*/
psfGPU = "psfGPU";
convGuessGPU = "convGuess";
//scaledConvGuessGPU = "scaledConvGuess";
differenceGPU = "difference";
differenceWienerGPU = "differenceWiener";
//scaledDifferenceWienerGPU = "scaledDifferenceWienerGPU";
updatedGuessGPU = "updatedGuess";
nonNegUpdatedGuessGPU = "nonNegUpdatedGuess";
guessSmoothGPU = "guessSmooth";
absDiffRawConvGuess = "absDiffRawConvGuess";

// set up any variables we need for iterations

// This algorithm has 4 variants, names in the black box implememtation as
// Additive or Ratio methods (of iteration update), 
// each with 1st iteration Wiener filtering of difference iamge accelleration,  or not,
// referred to in the black box software as "Enhanced" 
// In the book chapter, Additive is called algebraic, and Ratio is called geometric
// choose 1 of "EnhancedAdditive" or "EnhancedRatio", 
// Note that both "Enhanced-x" methods use Additive iteration for the first step
// containing the Wiener filtered difference image. EnhancedRatio then switches to ratio updates
// Default is "EnhancedRatio" as per the black box implementation 
algorithmType = "Additive";
// check the algorithmType is spelled correctly and is one of the 4 allowed. 
if ((algorithmType != "EnhancedRatio") && (algorithmType != "Ratio") && (algorithmType != "EnhancedAdditive") && (algorithmType != "Additive")) {
	print("You spelled the method name wrong!");
	exit("You spelled the method name wrong!");
}

// only multiples of 5 iterations make sense because the result image is smoothed very 5 iterations. 
itersMultiplesOfFive = 2; // 1 set of 5 iterations should be enough most of the time, especially if "Enhanced" is used 
iterations = itersMultiplesOfFive*5;

// get sum of raw image for use in the iteration loop
Ext.CLIJ2_sumOfAllPixels(rawGPU);
// get result from results window where it lands
rawSum = getResult("Sum", nResults() - 1);
print("rawSum " + rawSum);

// normalise the PSF to sum = 1, so we dont have to rescale the convolved image each iteration, as it will then retain its sum intensity. 
Ext.CLIJ2_sumOfAllPixels(rawPsfGPU);
rawPsfGPUSum = getResult("Sum", nResults() - 1);
print("rawPsfSum " + rawPsfGPUSum);
Ext.CLIJ2_multiplyImageAndScalar(rawPsfGPU, psfGPU, (1/rawPsfGPUSum));
Ext.CLIJ2_sumOfAllPixels(psfGPU);
psfGPUSum = getResult("Sum", nResults() - 1);
print("psfSum should = one, it is: " + psfGPUSum);


// An array to hold R(k) convergence values from each iteration for pkotting later. 
rkValues = newArray(iterations);

// Iterations for loop
for (i=0; i<iterations; i++) {

	//blur the current guess (raw image at the beginning) with the PSF using CLIJ2 custom kernel convolve.
	//FD Math works on single slices only, so use DeconvLab2 or CLIJ2
	//IJ.run("FD Math...", "image1=guess operation=Convolve " + "image2=psf result=blurredGuess do");
	// DeconvolutionLab2 only seems to read input data from disk? Can i pass it an open image? 
	//IJ.run("DeconvolutionLab2 Run", guess + psf + " -algorithm CONV" + "")

	// CLIJ2 convolution of an image with another image (this is slow, real space implementation )
	//Ext.CLIJ2_convolve(gaussGuessGPU, psfGPU, convGuessGPU);
	// CLIJ2x experimental FFT based convolution of 2 images - should be faster
	//Output might need to be rescaled if sum intensity is not preserved
	// TODO: This only works when raw image is eg 64x64x21 and psf is larger in xy (256) and same in z (21). 
	// but raw data is normally a bigger image than the PSF image... is it a bug?
	//
	Ext.CLIJx_convolveFFT(guessGPU, psfGPU, convGuessGPU);
	Ext.CLIJ2_pull(convGuessGPU);
	print("iteration " + i +" after convolve " + Ext.CLIJ2_reportMemory()); 

	// rescale the blurred guess so the sum of all the pixels is the same as the raw image - preserve total signal quantity.
	// dont need to do this is PSF isd normalised to sum=1
	//find sum of current guess image
	//Ext.CLIJ2_sumOfAllPixels(convGuessGPU);
	//convGuessSum = getResult("Sum", nResults() - 1);
	//print("convGuessSum " + convGuessSum);
	//calculate ratio of sums, and scale current guess image pixel intensities accordingly
	//scalingFactor = rawSum / convGuessSum;
	//print("scaling factor " + scalingFactor);
	//multiply image and scalar
	//Ext.CLIJ2_multiplyImageAndScalar(convGuessGPU, scaledConvGuessGPU, scalingFactor);
	//Ext.CLIJ2_pull(scaledConvGuessGPU);
	

	//For the 1st iterations of EnhancedAdditive and EnhancedRatio,
	// do a Van Cittert, additive update with Wiener filtered difference. book p81, 295 	
	// get the difference (residuals) between the raw image and the (rescaled) blurred guess
	// Wiener filer the difference, then add that to the guess. 
	if ((i==0) && ((algorithmType == "EnhancedAdditive") || (algorithmType == "EnhancedRatio"))) {
		// subtract images
		//Ext.CLIJ2_subtractImages(rawGPU, scaledConvGuessGPU, differenceGPU); // use this whn PSF is not normalised to sum = 1
		Ext.CLIJ2_subtractImages(rawGPU, convGuessGPU, differenceGPU);
		//Ext.CLIJ2_pull(differenceGPU);
/*
		// inverse filter (Wiener filter, regularised) the residuals - use Decon Lab2, or simpleITK-CLIJ2x Wiener deconv
		// simple i t k wiener deconvolution
		//noise_variance = 0.01;
		//normalize = true; // what is being normalised? The image result is not same sum intensity as the input? 
		//Ext.CLIJx_simpleITKWienerDeconvolution(image1, image2, image3, noise_variance, normalize);
*/
		// changing the noise variance and normalize parameters doesnt seem to do much??? 
		// whatever it is set to, there is too much high frequency filtering happening...
		noiseVariance = 0.01;
		normalize = true;
		Ext.CLIJx_simpleITKWienerDeconvolution(differenceGPU, psfGPU, differenceWienerGPU, noiseVariance, normalize);
		Ext.CLIJ2_pull(differenceWienerGPU);
/*
		// rescale (or maybe not?)  the Wiener Filtered difference image to same sum intenisty as difference image.
		// TODO: but there are negative and positives in the difference images, so whats the right way to scale them?
		// Cant use sum? need absolute sum? modulus? Do we even need to rescsale ?
		// find sum of current difference images
		//Ext.CLIJ2_sumOfAllPixels(differenceGPU);
		//differenceSum = getResult("Sum", nResults() - 1);
		//Ext.CLIJ2_sumOfAllPixels(differenceWienerGPU);
		//differenceWienerSum = getResult("Sum", nResults() - 1);
		//print("differenceSum " + differenceSum);
		//print("differenceWienerSum " + differenceWienerSum);
		// calculate ratio of sums, and scale current guess image pixel intensities accordingly
		//scalingFactor = differenceSum / differenceWienerSum;
		//print("difference image scaling factor" + scalingFactor);
		// multiply image and scalar
		//Ext.CLIJ2_multiplyImageAndScalar(differenceWienerGPU, scaledDifferenceWienerGPU, scalingFactor);
		//Ext.CLIJ2_pull(scaledDifferenceWienerGPU);
*/
		// for 1st "EnhancedAdditive", EnhancedRatio" and "additive" iteration, 
		// update the current guess image with the inverse filtered residuals, by addition of the two images. 
		Ext.CLIJ2_addImages(guessGPU, differenceWienerGPU, updatedGuessGPU);
		print("iteration " + i +" After Wiener  " + Ext.CLIJ2_reportMemory()); 
	}

	// For 1st "Additive" iteration update the guess 
	// with the difference: a Van Cittert update, book p81, 295 
	if ((i==0) && (algorithmType == "Additive")) {
		// subtract images
		//Ext.CLIJ2_subtractImages(rawGPU, scaledConvGuessGPU, differenceGPU); // use when psf is not normailised to sum =1 
		Ext.CLIJ2_subtractImages(rawGPU, convGuessGPU, differenceGPU);
		// add difference to guess
		Ext.CLIJ2_addImages(guessGPU, differenceGPU, updatedGuessGPU);
		print("iteration " + i +" after subtract " + Ext.CLIJ2_reportMemory()); 

	}

	// For 1st "Ratio" iteration update the guess 
	// with the difference: a Gold upadte, Gold's ratio update, book page 115
	// newGuess = guess * (raw / PSFblurredGuess)
	// (TODO: The modified Gold's ratio method on page 116 ensured convergence and non negativity, 
	// using a similar multiplication by flipped OTF that the RL iteration uses) 
	if ((i==0) && (algorithmType == "Ratio")) {
		//Ext.CLIJ2_divideImages(rawGPU, scaledConvGuessGPU, differenceGPU); // use when psf is not normailised to sum =1 
		Ext.CLIJ2_divideImages(rawGPU, convGuessGPU, differenceGPU);
		Ext.CLIJ2_multiplyImages(guessGPU, differenceGPU, updatedGuessGPU);
		print("iteration " + i +" after ratio " + Ext.CLIJ2_reportMemory()); 
	}
	
	// for non first "Additive" and "EnhancedAdditive" interations update the guess 
	// with the difference: a Van Cittert upadte, book p81, 295 
	if ((i!=0) && ((algorithmType == "EnhancedAdditive") || (algorithmType == "Additive"))) {
		// subtract images
		//Ext.CLIJ2_subtractImages(rawGPU, scaledConvGuessGPU, differenceGPU); // use when psf is not normailised to sum =1 
		Ext.CLIJ2_subtractImages(rawGPU, convGuessGPU, differenceGPU);
		// add difference to guess
		Ext.CLIJ2_addImages(guessGPU, differenceGPU, updatedGuessGPU);
		print("iteration " + i +" after subtract " + Ext.CLIJ2_reportMemory()); 
	}

	// For non first "EnhancedRatio" and "Ratio" iterations
	// we will use unmodified Gold's ratio update, book page 115
	// newGuess = guess * (raw / PSFblurredGuess)
	// (TODO: The modified Gold's ratio method on page 116 ensured convergence and non negativity, 
	// using a similar multiplication by flipped OTF that the RL iteration uses) 
	if ((i!=0) && ((algorithmType == "EnhancedRatio") || (algorithmType == "Ratio"))) {
		//Ext.CLIJ2_divideImages(rawGPU, scaledConvGuessGPU, differenceGPU); // use when psf is not normailised to sum =1 
		Ext.CLIJ2_divideImages(rawGPU, convGuessGPU, differenceGPU);
		Ext.CLIJ2_multiplyImages(guessGPU, differenceGPU, updatedGuessGPU);
		print("iteration " + i +" after ratio " + Ext.CLIJ2_reportMemory()); 
	}

	Ext.CLIJ2_pull(differenceGPU);
	Ext.CLIJ2_pull(updatedGuessGPU);

	// apply non-negativity constraint - set all -ve pixels to 0.0	
		// use the maximumImageAndScalar CLIJ2 gadget
	//Ext.CLIJ2_pushArray(source, newArray(0, -1, 5), 3, 1, 1); // width=3, height=1, depth=1
	//Ext.CLIJ2_maximumImageAndScalar(source, destination, 0);
	//Ext.CLIJ2_print(destination);
	Ext.CLIJ2_maximumImageAndScalar(updatedGuessGPU, nonNegUpdatedGuessGPU, 0.000000000000000000000000000);
	Ext.CLIJ2_pull(nonNegUpdatedGuessGPU);
	print("iteration " + i +" after non neg " + Ext.CLIJ2_reportMemory());

	// TODO: Rescale is happening another time here (or not, see above), so better make it a function? 
	// rescale the blurred guess so the sum of all the pixels is the same as the raw image - preserve total signal quantity.
	// find sum of nonNegUpdatedGuessGPU image
	Ext.CLIJ2_sumOfAllPixels(nonNegUpdatedGuessGPU);
	nonNegUpdatedGuessSum = getResult("Sum", nResults() - 1);
	print(i + " nonNegUpdatedGuessSum " + nonNegUpdatedGuessSum);
	// calculate ratio of sums, and scale current guess image pixel intensities accordingly
	scalingFactor = rawSum / nonNegUpdatedGuessSum;
	print(i + " scaling factor " + scalingFactor);
	// multiply image and scalar
	Ext.CLIJ2_multiplyImageAndScalar(nonNegUpdatedGuessGPU, guessGPU, scalingFactor);
	// smooth the new guess image every multiple of 5 iterations, 
	// to preven noise build up, with Gaussian and small kernel defined above. 
	if ((i+1) % 5 == 0) {
		Ext.CLIJ2_gaussianBlur3D(guessGPU, guessSmoothGPU, sigma_x, sigma_y, sigma_z);
		//Ext.CLIJ2_pull(guessSmoothGPU);
		Ext.CLIJ_copy(guessSmoothGPU, guessGPU);
		print("iteration " + i +" after 5x iter Gauss smooth " + Ext.CLIJ2_reportMemory());
	}

	Ext.CLIJ2_pull(guessGPU);
	print("iteration " + i +" latest guess " + Ext.CLIJ2_reportMemory()); 

	//TODO : This code tries to implement convergence measurement R(k), as per Dan's notes
	// but where is it described in the book? Agard publication? Is this even right?
	// R(k)  = (sum of |raw - blurredGuess |) / sum of raw
	// R(k) should start at 1 at the beginning , drop quickly, and level off once convergence is almost reached. 
	// Need the value of raw image summed pixel values - this is done above, before and outside the loop: rawSum
	// Need to calculate algebraic sum of pixelwize difference between raw and blurredGuess
	//Ext.CLIJ2_absoluteDifference(rawGPU, scaledConvGuessGPU, absDiffRawConvGuess); // use when psf is not normailised to sum =1 
	Ext.CLIJ2_absoluteDifference(rawGPU, convGuessGPU, absDiffRawConvGuess);
	Ext.CLIJ2_sumOfAllPixels(absDiffRawConvGuess);
	absDiffRawConvGuessSum = getResult("Sum", nResults() - 1);
	print(i + " absDiffRawConvGuessSum " + absDiffRawConvGuessSum);
	Rconvergence = absDiffRawConvGuessSum / rawSum;
	print(i + " Rconvergence " + Rconvergence);
	rkValues[i] = Rconvergence;
	//print(rkValues[i]);

//end iterations for loop
}

//pull the last iteration result image
Ext.CLIJ2_pull(guessGPU);
print("End " + Ext.CLIJ2_reportMemory());

//plot the R(k) convergence values.
Plot.create("Convergence R(k) Plot", "X", "Y");
Plot.setLimits(0, i-1, 0, 1);
Plot.setLineWidth(2);
Plot.setColor("lightGray");
Plot.add("line", rkValues);
Plot.setColor("red");
Plot.add("circles", rkValues);
Plot.show();

// clear GPU
Ext.CLIJ2_clear();
