//TestCLIJ2FFTconvolve imageJ macro
// Dan White (chalkie666) April 2021 

//This tests the CLIJ2-fft convolve function
// result image should look more blurry than input raw image, not identical. 

//open raw iamge and psf image files - these are on github in the same location as this file at:
// https://github.com/chalkie666/imagejMacros/tree/master/DeconvolutionDemos

// raw image, already background subtracted. Larger than PSF. 
open("C:/Users/ECO Office/Documents/GitHub/imagejMacros/DeconvolutionDemos/C1-YeastTNA1_1516_conv_RG_26oC_003_256xcropSub100.tif");
run("32-bit"); 
rename("raw");

// PSF, background subtracted and centred in xyz (but there is some spherical aberration)
open("C:/Users/ECO Office/Documents/GitHub/imagejMacros/DeconvolutionDemos/gpsf_3D_1514_a3_001_WF-sub105crop64_zcentred.tif");
run("32-bit");
rename("psf");

// ini CLIJ2
run("CLIJ2 Macro Extensions", "cl_device=730"); //yes i'm running it on the CPU, as my GPU is flaky sometimes...?

//send raw to the openCL, and also the psf
rawCL = "raw";
Ext.CLIJ2_push(rawCL);
psfCL = "psf";
Ext.CLIJ2_push(psfCL);

convTestCL = "convResult";

Ext.CLIJx_convolveFFT(rawCL, psfCL, convTestCL);

Ext.CLIJ2_pull(convTestCL);

differenceCL = "difference";
Ext.CLIJ2_subtractImages(rawCL, convTestCL, differenceCL);
// send the sum of all pixels on the difference image to the results table.
// a result of 0 is a fail, anything else is probably a pass. 
Ext.CLIJ2_sumOfAllPixels(differenceCL);


// clear GPU
Ext.CLIJ2_clear();

//as of 13 apr 2021 seems that PSF (kernel) 
//must be larger in xy dimensions xy than image and same in z  to be convolved with it?
