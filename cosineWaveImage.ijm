/*
 * cosine wave image
 */
w = 512;
h = 64;

newImage("Cosine", "8-bit black", w, h, 1);
for (j = 0; j < h; j++)
	for (i = 0; i < w; i++) {

		// cosine wave
		freq = 0.1;
		
		pixValue = cos(i*freq);
		
		scaledPixVal = (pixValue+1) * 127;
 		setPixel(i, j, scaledPixVal);
	}