#!/usr/bin/env python

# This is a Python script that can be run from Fiji (is just ImageJ
# - batteries incuded), using the builtin Jython interpreter (Jython is a
# Java implementation of Python which runs natively on the Java Virtual
# Machine. You can use all Java classes and Imagej classes from it, which
# is nice.)

# Purpose of this script:

# There is a limitation in the Analyze Skeleton 2D/3D plugin where it can not
# handle a 2D time series stack as such. It just treats it as a z series,
# meaning that the results are not as expected since it treats the data as a
# single 3D dataset instead of as many 2D time points.

# Solution

# To get around this limitation, we can run the "Analyze Skeleton (2D/3D)"
# command on each individual frame of the time series, since the plugin
# "Analyze Skeleton (2D/3D)" works as expected on single frames!

# We need to output the results for each frame in a sensible readable manner
# (save as .xls) and make a tagged results image "movie" by converting all the
# single frame tagged result images into a stack.


# how to use this script

# 1) Install the script by putting it in the Fiji plugins directory,
#    then run menu command Plugins - Scripting - Refresh Jython Scripts.
#    The script name will then appear in the plugins menu (at the bottom)

# 2) open a movie dataset in Fiji - check image metadata (Bat Cochlea Volume
#    sample image works). Check that it is a 2D movie not a 3D z stack:
#    select the movie image window, then do menu item Image - Properties.
#    You might need to change it from a z stack to a time series by changing
#    the numbers there.
#
#    You can also set the pixel size here if it is wrong in the first instance,
#    so your results are calibrated in micrometers etc. instead of pixels (I
#    hope thats true)

# 3) Segment objects from the background, for instance using one of the auto
#    threshold methods, such that you have an 8 bit binary image comtaining
#    zeros for background and 255 for objects.

# 4) Skeletonize each frame of the movie using the menu command
#    Process - Binary - Skeletonize.
#    Click yes when it asks you if you want to do all the frames/slices in the
#    movie.

# 5) Run the script: With the skeletonized movie selected run the script by
#    choosing it from the plugins menu.  It will automatically save the
#    measurements onto your Desktop, as "Results<number>.xls".

# 6) Save the result tagged image movie: TaggedMovie (as a a tiff for example)
#    and the results summary which is in the Log window.
#    The results for each frame were already saved in the last step!




from ij import IJ, ImagePlus
import os

# the current image
imp = IJ.getImage()


stack = imp.getStack()

resultPrefix = IJ.getDirectory("home") + "Desktop"
if not os.path.exists(resultPrefix):
	resultPrefix = IJ.getDirectory("home")
resultPrefix = resultPrefix + "/Results"

# for all the frames in the movie, run  "Analyze Skeleton (2D/3D)" (maybe
# later in multiple threads)

newStack = ImageStack(imp.getWidth(), imp.getHeight())

# getNFrames not getNSlices since input data is a 2D time series stack
# NOT a 3D stack.
frameCount = imp.getNFrames()

# Remember: a python range (1, 10) is the numbers 1 to 9!
for i in range(1, frameCount + 1):
   slice = ImagePlus(str(i), stack.getProcessor(i))
   # Execute plugin exactly on this slice i
   IJ.run(slice, "Analyze Skeleton (2D/3D)", "")
   image = WindowManager.getCurrentImage()
   IJ.saveAs("Measurements", resultPrefix + str(i) + ".xls")


   # concatenate the new tagged image onto the end of the tagged image stack we
   # want in the end, but not if its then 1st one!
   newStack.addSlice("", image.getProcessor().getPixels())
   if i == 1:
      newStack.setColorModel(image.getProcessor().getColorModel())
   image.close()

image = ImagePlus("TaggedMovie", newStack)
image.show()

IJ.log("Done!")
