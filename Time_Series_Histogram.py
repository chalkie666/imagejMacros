# Time_Series_Histogram.py
# this script makes the histogram for each frame of a movie
# and as it goes adds (concatenates) each one into a single movie stack

# Dan White and Silke Gerwig MPI-CBG
# Aug 2009

#!/usr/bin/env python

from ij import IJ, ImagePlus
# the current image
imp = IJ.getImage()
stack = imp.getStack()

# for all the frames in the movie, run  histogram
for i in range(1, imp.getNFrames() + 1):  # remember a python range (1, 10) is the numbers 1 to 9 !
#getNFrames not getNSlices since input data is a 2D time series stack NOT a 3D stack.
  slice = ImagePlus(str(i), stack.getProcessor(i))
  # Execute plugin exactly on this slice i
  IJ.run(slice, "Histogram", "slice")
  # concatenate the new histogram onto the end of the histogram stack we want in the end, but not if its then 1st one!

  if i == 1:
    pass
  else:
    IJ.run("Concatenate...", "stack1=[Histogram of 1] stack2=[Histogram of " + str(i) + "] title=[Histogram of 1]")

IJ.log("Done!")