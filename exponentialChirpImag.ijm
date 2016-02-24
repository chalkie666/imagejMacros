/*
 * exponential freq. chirp wave image, for convolution demos.
 *
 * What's it useful for:
 * Showing effect of Gaussian blurring (convolution) on contrast vs. spatial frequency.
 * Showing a simulation of the systematic error effect
 * of the objecive lens OTF (similar to a Gaussian blur) on the
 * contrast of different spatial frequencies in a light microscopy image.
 * Showing why optical microscope images should be deconvolved,
 * to correct the systematic error of contrast vs. feature size:
 * Contrast of smaller and smaller features is attenuatted more and more.
 * Measurements of small object intensities are lower then they should be
 * compared to larger objects, making quantitative analysis problematic.
 *
 * Why this approach?
 * Biologists are not familiar with frequency space and Fourier Theorem
 * The general trivial description of blur caused by the lens describes
 * the resoluition limit to some intuitive extent, but does not highlight
 * the main problem that deconvolution fixes: That the contrast of resolved
 * features is attenuated as a function of feature size - the OTF.
 * Meaning, quantification of intensity in different sized objects is likely
 * to be far from close to the true values until the image is deconvolved,
 * thus restoring the contrast and intensity of the smaller features.
 * The trick here is to show frequency space in real space: Not having to
 * explain frequency space so we don't lose most of the audience.
 *
 * How to do it:
 * 1) Run the macro to generate the increasingly stripey image.
 * 2) Select all, then run plot profile (Ctrl-A, Ctrl-K)
 * 3) In plot profile, select live mode.
 * 4) Run the Gaussian Blur tool, set Sigma (Radius) to 5, turn on Preview.
 * 5) Toggle preview on and off to see the effect.
 * 6) Try different Sigma values to simulate different lens numerical apertures. Higher Sigma corresponds to lower N.A., and more blur.
 * 7) See the effect of noise on resolution by adding noise to the image. Use a line selection, not select all, for the plot profile.
 * 8) Note the bandwidth (resolution limit) imposed by the blur.
 * 9) Note that high spatial frequencies close to the resolution limit have their contrast more strongly attenuated than lower spatial frequency features.
 */

w = 1024;
h = 64;

newImage("Chirp", "32-bit black", w, h, 1);
for (j = 0; j < h; j++)
	for (i = 0; i < w; i++) {
		t = (i/256);
		// linear chrip
		// pixValue = sin((2*PI)*(0.1+t)*t);
		
		// exponential chirp
		fzero = 0.1;
		k = 3;
		
		pixValue = sin(2*PI*fzero*(pow(k,t)*t));
		
		// scale to pix value range 0-256
		scaledPixVal = (pixValue+1) * 127;
		setPixel(i, j, scaledPixVal);
	}

// reset display and show the plot profile - wave has same cntrast regardless of spacing of stripes. 
resetMinAndMax();
run("Select All");
run("Plot Profile");

waitForUser("Next?");

selectWindow("Chirp");
run("Duplicate...", "title=Chirp-blur");
run("Gaussian Blur...", "sigma=5");
run("Select All");
run("Plot Profile");

waitForUser("Next?");

selectWindow("5sigma33x33GaussKernel.tif");

waitForUser("Next?");

selectWindow("Chirp-blur");
run("Iterative Deconvolve 3D", "image=Chirp-blur point=5sigma33x33GaussKernel.tif output=Deconvolved show log wiener=0.000 low=0 z_direction=1 maximum=300 terminate=0.000");
setMinAndMax(0, 255);
run("Select All");
run("Plot Profile");
Plot.setLogScaleX(false);
Plot.setLogScaleY(false);
Plot.setLimits(0,1023,0,255);

//http://dev.theomader.com/gaussian-kernel-calculator/

//Gaussian sharpen:
// http://www.aforgenet.com/framework/docs/html/4600a4d7-825b-138f-5c31-249a10335b26.htm
