# time_series_measure.py
# this script makes ROI measurements of each slice of a movie
# the results are listed in on continuing table/text file


# Dan White and Silke Gerwig MPI-CBG
# Aug 2009
# Dan White 2016 

#!/usr/bin/env python

from ij import IJ, ImagePlus
# the current image
imp = IJ.getImage()
stack = imp.getStack()
roi = imp.getRoi()

# for all the frames in the movie, run  measure
for i in range(1, imp.getNFrames() + 1):  # remember a python range (1, 10) is the numbers 1 to 9!
#getNFrames not getNSlices since input data is a 2D time series stack NOT a 3D stack.
	frame = ImagePlus(str(i), stack.getProcessor(i))
 	# Execute get statistics exactly on this slice i, with the ROI in use
	frame.setRoi(roi)
	stats = frame.getStatistics()
	IJ.log(" area: "+ str(stats.area) + " mean: "+ str(stats.mean))
IJ.log("Done!")