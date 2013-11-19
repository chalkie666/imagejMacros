/*
 * Draw vertical stripes for diffraction gratings.
 * stripes of about equal with for black and white 
 */
w = 1920;
h = 1080;

pitch = 0;

a = 1;
b = 1;

noOfSections = 5;

sectionWidth = w / noOfSections;

x = 0;
endx = 0;
startx = 0;

newImage("Gratings", "8-bit Black", w, h, 1);

for (section = 0; section < noOfSections; section++) {
	pitch = 1<<(section+1); 
	for (j = 0; j < h; j++) {
		endx = sectionWidth * (section+1);
		startx = endx - sectionWidth;
		for (sectionx = startx; sectionx < endx; sectionx++) {
			if (sectionx % pitch < (pitch/2))
				BorW = 0;
			else
				BorW = 255;
			setPixel(sectionx, j, BorW);
		}
	}
}