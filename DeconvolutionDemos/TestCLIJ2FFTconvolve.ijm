run("CLIJ2 Macro Extensions", "cl_device=CPU");

//send raw to the GPU, and also the psf
guessGPU = "guess";
Ext.CLIJ2_push(guessGPU);
psfGPU = "psf";
Ext.CLIJ2_push(psfGPU);

convtestGPU = "convtest";

Ext.CLIJx_convolveFFT(guessGPU, psfGPU, convtestGPU)

Ext.CLIJ2_pull(convtestGPU);

// clear GPU
Ext.CLIJ2_clear();

//as of 13 apr 2021 seems that PSF (kernel) 
//must be larger in xy dimensions xy than image and same in z  to be convolved with it?
