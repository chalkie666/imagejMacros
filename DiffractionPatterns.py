# image real width and height in microns
realWidth = 18000   #18000 gives vertical stripes, 18006 gives a checkerboard (perhaps useless))
realHeight = 12000

# laser writers for 35 mm slides do up to  4000 lines
#if thats in 24 mm then thats
# 24000/4000 = 6 micron per line... suppose it the same vertically...?
micronsPerPixel = 6

# image pix number width and height
# is the real size / the size of a pixel
imageWidth = realWidth/micronsPerPixel
imageHeight = realHeight/micronsPerPixel

imp = ImagePlus("diffraction grating image", FloatProcessor(imageWidth, imageHeight))
pix = imp.getProcessor().getPixels()
n_pixels = len(pix)
# catch width and height
#w = imp.getWidth()
#l = imp.getHeight()
 
# want alternating vertical lines of back and white
# which are 17.5 microns black to black line centre
# image size is 3.5 mm x 2.4 mm

# pitch is the line pitch or separation in micrometers
pitch = 12
# number of pixels in the image the pitch is long
imagePitchLength = pitch/micronsPerPixel


for i in range(len(pix)):
   if (i % imagePitchLength + 1) <= (imagePitchLength/2): 
   	pix[i] = 0
   else:
   	pix[i] = 255
 
# adjust min and max, since we know them
#imp.getProcessor().setMinAndMax(0, 255)
imp.show()