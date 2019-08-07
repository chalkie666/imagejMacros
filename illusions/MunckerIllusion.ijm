// generates the Muncker illusion

// image size
w = 512;
h = 512;

// stripes Line height
lineHeight = 4;

// RGB colours

yellow = 0x999900;
red = 0xbb0000;
green = 0x009900
blue = 0x0000ff

// black image to fill in
newImage("Muncker's illusion", "RGB Black", w, h, 1);

// for loop to generate the horizontal stripes of desired height
// in order to make the background image for the illusion

for (j = 0; j < h; j++)
	for (i = 0; i < w; i++) {
		if
			((j/lineHeight) % 3 == 0)
			colour = red;
		else if
			((j/lineHeight) % 3 == 1)
			colour = green; 
		else if
			((j/lineHeight) % 3 == 2)
			colour = blue;
	setPixel(i, j, colour);
	}

// TODO - draw yellow circles behind 2 of the stripes
// different colour stripes for different circles
