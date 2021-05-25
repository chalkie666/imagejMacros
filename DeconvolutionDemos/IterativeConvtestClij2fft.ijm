// iterative convolution test with Clij2 fft, for potential memory leak. 

// initialise CLIJ2 for the GPU by (partial) name, or for the 1st GPU it finds, by specifying no GPU explicitly
// or fall back to CPU 
//run("CLIJ2 Macro Extensions", "cl_device=");
run("CLIJ2 Macro Extensions", "cl_device=[730]");
//run("CLIJ2 Macro Extensions", "cl_device=CPU");
Ext.CLIJ2_clear();
 // just in case.

open("C:/Users/ECO Office/Documents/GitHub/imagejMacros/DeconvolutionDemos/MP1_1516_24oC_Gz512xy_005_subtract120.tif"); 
run("32-bit"); 
rename("raw");

open("C:/Users/ECO Office/Documents/GitHub/imagejMacros/DeconvolutionDemos/zeissYGbead_water_1516_24oC_ConvGz0point2z_005_sub160_norm1.tif")
run("32-bit");
rename("psf");

// send raw to GPU
rawGPU = "raw";
Ext.CLIJ2_push(rawGPU);
// send psf to GPU
psfGPU = "psf";
Ext.CLIJ2_push(psfGPU);

iterations = 10;

// Iterations for loop
for (i=0; i<iterations; i++) {
	Ext.CLIJx_convolveFFT(rawGPU, psfGPU, convGPU);
	Ext.CLIJ2_pull(convGPU);
	print("iteration " + i +" after convolve " + Ext.CLIJ2_reportMemory());
}

Ext.CLIJ2_clear();
