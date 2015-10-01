path = File.openDialog("Select a LSM File");
dir = File.getParent(path);
name = File.getName(path);
print("Path:", path);
open(path);
selectWindow(name);
run("Stack to Hyperstack...", "order=xyczt(default)");
selectWindow(name);
getDimensions(w, h, channels, slices, frames);
print("Channel,Slices,time points: "+channels+", "+slices+", "+frames);
//f1=split(name,'-');
//file=split(f1[2],'slice.');
fi=split(name,'.');
newdir=fi[0]+"-tifff";

File.makeDirectory(dir+"/"+newdir);

for (t=1;t<= frames;t++)
{
selectWindow(name);
Stack.setPosition(1,1,t);
run("Reduce Dimensionality...", "slices keep");
saveAs("Tiff", dir+"/"+newdir+"/"+fi[0]+"-"+t+"slice.tif");
selectWindow(fi[0]+"-"+t+"slice.tif");
run( "Smooth", "stack");
run("Auto Local Threshold", "method=Bernsen radius=15 parameter_1=0 parameter_2=0 white stack");
run("Watershed", "stack");
run("3D Objects Counter", "threshold=150 slice=16 min.=20 max.=4000000 exclude_objects_on_edges objects surfaces centroids centres_of_masses statistics summary");
selectWindow("Statistics for "+fi[0]+"-"+t+"slice.tif");
saveAs("txt", dir+"/"+newdir+"/"+fi[0]+"-"+t+"slice.txt");
wait(3000);
}
if (isOpen("Log")) { 
         selectWindow("Log"); 
         saveAs ("txt",dir+"/"+newdir+"/"+"log.txt");
}
run("Close All");