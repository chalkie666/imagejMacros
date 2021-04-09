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

// initialise CLIJ2 for the 1st GPU it finds, by specifying no GPU explicitly
// or fall back to CPU 
//run("CLIJ2 Macro Extensions", "cl_device=");
run("CLIJ2 Macro Extensions", "cl_device=CPU");
Ext.CLIJ2_clear();

// open the test raw image and empirical PSF image
// convert to 32 bit float, as -ve values will happen later, and tidy up the image titles for clarity.
open("C:/Users/ECO Office/Documents/GitHub/imagejMacros/DeconvolutionDemos/C1-YeastTNA1_1516_conv_RG_26oC_003_256xcropSub100.tif");
//open("C:/Users/dan/Documents/GitHub/imagejMacros/DeconvolutionDemos/C1-YeastTNA1_1516_conv_RG_26oC_003_256xcropSub100.tif");
run("32-bit");
rename("raw")
//open("C:/Users/ECO Office/Documents/GitHub/imagejMacros/DeconvolutionDemos/gpsf_3D_1514_a3_001_WF-sub105.tif");
open("C:/Users/ECO Office/Documents/GitHub/imagejMacros/DeconvolutionDemos/gpsf_3D_1514_a3_001_WF-sub105crop64.tif");
//open("C:/Users/dan/Documents/GitHub/imagejMacros/DeconvolutionDemos/gpsf_3D_1514_a3_001_WF-sub105crop64.tif");
//open("C:/Users/dan/Documents/GitHub/imagejMacros/DeconvolutionDemos/gpsf_3D_1514_a3_001_WF-sub105.tif");
run("32-bit");
rename("psf")

selectWindow("raw");

// send raw image to GPU, and make a working image copy of raw, called "guess" on the GPU, to do the interations on.
//send raw to the GPU, and also the psf
rawGPU = "raw";
Ext.CLIJ2_push(rawGPU);
psfGPU = "psf";
Ext.CLIJ2_push(psfGPU);
// make a copy of rawGPU called guessGPU
guessGPU = "guess";
Ext.CLIJ_copy(rawGPU, guessGPU);
//guessGPU = "raw"
//Ext.CLIJ2_push(guessGPU)

/*
// initial smoothing operation to remove some noise from the raw image - use IJ 3D Gaussian, or CLIJ, with small sigma of 1. 
// Do we even need that since the first step in the iteration in blur image with PSF????
// IJ.run(raw, "Gaussian Blur 3D...", "x=1.0 y=1.0 z=1.0");
// or in CLIJ2-3D-gaussian blur , then define an output variable
*/

gaussGuessGPU = "gaussGuess";
sigma_x = 1.0;
sigma_y = 1.0;
sigma_z = 1.0;
Ext.CLIJ2_gaussianBlur3D(guessGPU, gaussGuessGPU, sigma_x, sigma_y, sigma_z);
Ext.CLIJ2_pull(gaussGuessGPU);

/* iterations setup
 need to define output image variables same size as input guess image apparently by magic.
*/
convGuessGPU = "convGuess";
scaledConvGuessGPU = "scaledConvGuess";
differenceGPU = "difference";
differenceWienerGPU = "differenceWiener";
updatesGuessGPU = "updatedGuess";
nonNegUpdatedGuessGPU = "nonNegUpdatedGuess"; 
// set up any variables we need for iterations
var itersAlgebraic = 1;
var itersGeometric = 0;
// find sum of raw image for use in the iteration loop
rawSum = Ext.CLIJ2_sumOfAllPixels(rawGPU);
print(rawSum);

//algebraic iterations for loop
for (i=0; i<itersAlgebraic; i++) {

	//blur the current guess (raw image at the beginning) with the PSF using CLIJ2 custom kernel convolve.
	//FD Math works on single slices only, so use DeconvLab2 or CLIJ2
	//IJ.run("FD Math...", "image1=guess operation=Convolve " + "image2=psf result=blurredGuess do");
	// DeconvolutionLab2 only seems to read input data from disk? Can i pass it an open image? 
	//IJ.run("DeconvolutionLab2 Run", guess + psf + " -algorithm CONV" + "")

	// CLIJ2 convolution of an image with another image (this is slow, real space implementation )
	//Ext.CLIJ2_convolve(gaussGuessGPU, psfGPU, convGuessGPU);
	// CLIJ2x experimental FFT based convolution of 2 images - should be faster
	Ext.CLIJx_convolveFFT(gaussGuessGPU, psfGPU, convGuessGPU)
	// rescale the blurred guess so the sum of all the pixels is the same as the raw image - preserve total signal quantity.
	// find sum of current guess image
	rawConvGuessSum = Ext.CLIJ2_sumOfAllPixels(convGuessGPU);
	// calculate ratio of sums, and scale current guess image pixel intensities accordingly
	scalingFactor = rawConvGuessSum / rawSum;
	print(scalingFactor);
	// multiply image and scalar
	Ext.CLIJ2_multiplyImageAndScalar(convGuessGPU, scaledConvGuessGPU, scalingFactor);
	//get the difference (residuals) between the raw image and the rescaled blurred guess
	// subtract images
	Ext.CLIJ2_subtractImages(rawGPU, scaledConvGuessGPU, differenceGPU);
	// inverse filter (Wiener filter, regularised) the residuals - use Decon Lab2, or simpleITK-CLIJ2x Wiener deconv
	// simple i t k wiener deconvolution
	//noise_variance = 0.01;
	//normalize = true;
	//Ext.CLIJx_simpleITKWienerDeconvolution(image1, image2, image3, noise_variance, normalize);
	Ext.CLIJx_simpleITKWienerDeconvolution(differenceGPU, psfGPU, differenceWienerGPU, 0.01, true);
	// update the current guess image with the inverse filtered residuals, by addition of the two images. 
	Ext.CLIJ2_addImages(scaledConvGuessGPU, differenceWienerGPU, nonNegUpdatedGuessGPU);
	// apply non-negativity constraint - set all -ve pixels to 0.0
	// use the maximumImageAnsScalar CLIJ2 gadget
	//Ext.CLIJ2_pushArray(source, newArray(0, -1, 5), 3, 1, 1); // width=3, height=1, depth=1
	//Ext.CLIJ2_maximumImageAndScalar(source, destination, 0);
	//Ext.CLIJ2_print(destination);
	// rescale the guess image again as above.

//end algebraic iterations for loop
}

//geometric iterations for loop
for (i=0; i<itersGeometric; i++) {

//blur the current guess (raw image at the beginning) with the PSF using CLIJ custom kernel convolve. (FD Math works on single slices)
//IJ.run("FD Math...", "image1=temp operation=Convolve "
//	+ "image2=PSFwithNoise result=tempConv do");

// rescale the blurred guess so the sum of all the pixels is the same as the raw image - preserve total signal quantity.

// get the ratio between the rescaled blurred guess and the raw image.

// update the current guess image with the ratio. 

// apply non-negativity constraint - set all -ve pixels to 0.0

// rescale the guess image again as above.

//end algebraic iterations for loop
}

//pull the last iteration result image from the GPU
Ext.CLIJ2_pull(nonNegUpdatedGuessGPU);

// clear GPU
Ext.CLIJ2_clear();
