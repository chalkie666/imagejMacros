//Agard-Accellerated-vanCittert-Gold-hybrid-method open source reference implementation
//as described in Peter A. Jansson:  Deconvolution of images and spectra. 2nd Ed. 1997
//chapter 4 (Jansson) and chapter 9.IV. (Swedlow, Agard, Sedat) 

//This aims to provide an open reference implemenmtation of this method that 
//has been available only in IVE/priism/SoftWoRx software as a black box
//with a restrictive license from UCSF.  

//Components:
//1. We need the algebraic (additive) iteration update method of van Cittert
//for the fist few iterations
//2. We need Gold's geometric (ratio) iteration update method for the remaining few iterations.  
//3. We wamt to acellerate the convergence by inverse filtering
//(Wiener or somoehow regularised inverse filter to handle noise)
//the difference, or residuals, in the algebraic iteration update method (Van Cittert).
//in order to accellerate the convergence, as explained in the book chapters. 
//4. Then we should need only 5 or 10 iterations for a convereged result. 
//but a smoothing step (Gaussian should work) every 5 iterations is needed to control noise accumulation. 
//5. The result for each iteration must be constraiinned to be non-negative, 
// meaning each pixel >= 0 must be true.
//6. Obviously we need a 3D input image and a 3D PSF (point spread functions) to match
//Note that empirical PSFs perform much better than theoretically calxculated ones,
//because real lenses are more conmplex than any mode we have.
//Here we will use a small 3D test image of some yeast cells, 
//and a PSF made on an OMX microscope system.
//Both of these imagtyes have the camera offsaet of ~100-105 counts removed,
//since this improves results by not defeating the non-negarivity constrain
//This test data is included in the git respository
//This allows us to compare results with the proprietary implementation in SoftWoRx (API/Cytiva)
//7. We will make use of reference implementations of algorithms/methods from BIG@EPGL's DeconvolutionLab2
//such as vanCittert and regularised inverse filters. 