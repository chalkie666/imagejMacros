# time_series_measure.py
# this script makes ROI measurements of each slice of a movie
# the results are listed in on continuing table/text file


# Dan White and Silke Gerwig MPI-CBG
# Aug 2009

#!/usr/bin/env python

from ij import IJ, ImagePlus
# the current image
imp = IJ.getImage()
stack = imp.getStack()

# for all the frames in the movie, run  histogram
for i in range(1, imp.getNFrames() + 1):  # remember a python range (1, 10) is the numbers 1 to 9Ê!
#getNFrames not getNSlices since input data is a 2D time series stack NOT a 3D stack.
  slice = ImagePlus(str(i), stack.getProcessor(i))
  # Execute plugin exactly on this slice i
  IJ.run(slice, "Measure", ROI)
  
IJ.log("Done!")