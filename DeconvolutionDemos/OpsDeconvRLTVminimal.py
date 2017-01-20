# @OpService ops
# @Dataset input
# @Dataset kernel
# @OUTPUT ImgPlus out
 
#works with only 2 paramters... but all 4 signatures have more. 
out = ops.run("filter.convolve", input, kernel)

#out2 = ops.run("filter.convolve", input, kernel, OutOfBoundsFactory, Type)

#out2 = ops.run("filter.convolve", RandomAccessibleInterval, RandomAccessibleInterval, long[], OutOfBoundsFactory, OutOfBoundsFactory, Type, ComplexType)

# doesnt works
# ops.run("filter.convolve", input, kernel, out)

#out2 = ops.run("filter.convolve", RandomAccessibleInterval, RandomAccessibleInterval, RandomAccessibleInterval, RandomAccessibleInterval, RandomAccessibleInterval, boolean, boolean)
