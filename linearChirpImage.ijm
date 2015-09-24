/*
 * linear chirp wave image
 */
w = 512;
h = 256;

newImage("Chirp", "8-bit black", w, h, 1);
for (j = 0; j < h; j++)
	for (i = 0; i < w; i++) {
		t = (i/100);
		pixValue = sin((2*PI)*(0.1+t)*t);
		scaledPixVal = (pixValue+1) * 127;
 		setPixel(i, j, scaledPixVal);
	}