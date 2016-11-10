# @OpService ops
# @UIService ui

# Minimal-ish script to do a RL-TV deconvolution using Brians implementation as an ops,
# Using a computed point spread function (PSF)
# and confocal sample data from Joel Sheffield from ImageJ sample data.

# Requires the
# Diffraction PSF 3D plugin from Bob Dougherty
# http://www.optinav.com/download/Diffraction_PSF_3D.class

# we could use @Data set to choose from the list of currently open images
# if we put these parameters back at the top, and changed the script:
# @Dataset image
# @Dataset psf

from net.imglib2.meta import ImgPlus
from net.imglib2.img.display.imagej import ImageJFunctions
from ij import IJ
from ij.plugin import ChannelSplitter

# Get input image sample data  - channel 1 from imageJ confocal series .tif sample dataset
imp = IJ.openImage("http://imagej.nih.gov/ij/images/confocal-series.zip")
imp.show()

IJ.selectWindow("confocal-series.tif")
IJ.run(imp, "32-bit", "");
channels = ChannelSplitter.split(imp);
channels[0].show()
channels[1].show()
IJ.selectWindow("C1-confocal-series.tif")
IJ.resetMinAndMax()
IJ.run("Fire", "")
# Fix the meta data:  z slice spacing.
# no need for this naymore, Joel and Wayne fixed the metadata
#IJ.run("Properties...", "channels=1 slices=25 frames=1 unit=um pixel_width=0.0544550 pixel_height=0.0544550 voxel_depth=0.6")

# make PSF using Bob D's Diffraction PSF 3D plugin
# With image meta data matching the confocal sample dataset.
# input PSF doesnt need to be as large as the image to be deconvolved.
IJ.run("Diffraction PSF 3D", "index=1.520 numerical=1.42 wavelength=510 longitudinal=0 image=54.50 slice=600 width,=64 height,=64 depth,=13 normalization=[Peak = 255] title=PSF")
IJ.selectWindow("PSF")
# We could simulate a confocal PSF by making the square of the WF PSF.
# But result looks better in this case with optomistic computed WF PSF.  
# IJ.run("Square", "stack")
# IJ.selectWindow("PSF")
IJ.resetMinAndMax()
IJ.run("Fire", "")

# get ImagePlus from IJ1 image window for channel 1 of the sample image and PSF image
IJ.selectWindow("PSF")
psfimp = IJ.getImage()
IJ.selectWindow("C1-confocal-series.tif")
imageimp = IJ.getImage()

# wrap IJ1 ImagePlus into IJ2 Img for use in ops
psfimg = ImageJFunctions.wrap(psfimp)
imageimg = ImageJFunctions.wrap(imageimp)

# Do the ops style deconvolution.
# Total Variation regularised version of RL-deconv needs 4 parameters: image, psf, iterations, regularization
deconvolved=ops.deconvolve().richardsonLucyTV(imageimg, psfimg, 10, 0.01)

# show the result and fix the metadata... comes out as a movie instead of a z stack. 
ui.show("deconvolved", ImgPlus(deconvolved))
IJ.selectWindow("deconvolved")
IJ.run("Properties...", "channels=1 slices=25 frames=1 unit=um pixel_width=0.0544550 pixel_height=0.0544550 voxel_depth=0.25");
IJ.resetMinAndMax();
IJ.run("Fire", "");
