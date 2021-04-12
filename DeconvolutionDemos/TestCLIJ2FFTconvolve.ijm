run("CLIJ2 Macro Extensions", "cl_device=CPU");

//send raw to the GPU, and also the psf
testGPU = "test";
Ext.CLIJ2_push(testGPU);
psfGPU = "psf";
Ext.CLIJ2_push(psfGPU);

convtestGPU = "convtest";

Ext.CLIJx_convolveFFT(testGPU, psfGPU, convtestGPU)

Ext.CLIJ2_pull(convtestGPU);
