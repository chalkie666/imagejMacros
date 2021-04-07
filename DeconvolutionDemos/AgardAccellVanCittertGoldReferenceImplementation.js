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
with a little extra magnification ion the tube lens, giving 80 nm image pixel spacing. 
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
 
//end algebraic iterations for loop
}

