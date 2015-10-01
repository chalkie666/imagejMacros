/*
 * exponential freq. chirp wave image
 */
w = 1024;
h = 64;

newImage("Chirp", "8-bit black", w, h, 1);
for (j = 0; j < h; j++)
	for (i = 0; i < w; i++) {
		t = (i/256);
		// linear chrip
		// pixValue = sin((2*PI)*(0.1+t)*t);
		
		// exponential chirp
		fzero = 0.1;
		k = 3;
		
		pixValue = sin(2*PI*fzero*(pow(k,t)*t));
		
		scaledPixVal = (pixValue+1) * 127;
 		setPixel(i, j, scaledPixVal);
	}