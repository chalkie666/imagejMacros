imp = IJ.getImage();
IJ.run(imp, "Smooth", "stack");
IJ.run(imp, "Auto Local Threshold", "method=Bernsen radius=15 parameter_1=0 parameter_2=0 white stack");
IJ.run(imp, "Watershed", "stack");
IJ.run(imp, "3D Objects Counter", "threshold=150 slice=16 min.=20 max.=4000000 exclude_objects_on_edges objects surfaces centroids centres_of_masses statistics summary");
IJ.run(imp, "3-3-2 RGB", "");
