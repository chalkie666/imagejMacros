# A Script to import 3D multichannel timeseries tiff series from In Cell aquisition
# written my Misha B @ GE 2019. 

#@ File (label = "Select single file", style = "file") inputFile
#@ Integer (label = "Number of Channels") chanNo
#@ Integer (label = "Number of Z-slices") totalZ
#@ Integer (label = "Number of Time-points") totalT
#@ Double (label = "Z-step") zStep


//Calcuate required dimensions
reqDims=chanNo*totalZ*totalT;

//Split file name
fName=File.getName(inputFile);
fileFolder=File.getParent(inputFile);

zIndex=indexOf(fName, " z ");
if (zIndex>0)
{
//	if Default naming is used
	print("Folder: "+ fileFolder);
	print("Opening: " + fName);
// extract a common string
	fldIndex=indexOf(fName, "fld ");
	coreIndex=indexOf(substring(fName,fldIndex+4), " ")+fldIndex+5;
	coreString=substring(fName, 0, coreIndex);
// load image sequence
	run("Image Sequence...", "open=["+inputFile+"] file=["+coreString+"] sort");
	Stack.getDimensions(width, height, channels, slices, frames);	
	if(reqDims==channels*slices*frames)
		{		
//convert to hyperstack				
			run("Stack to Hyperstack...", "order=xytzc channels="+chanNo+" slices="+totalZ+" frames="+totalT+" display=Composite");
			rename(replace(coreString, "(", "_"));
		}
		else
		exit("Requested dimensions did not match loaded stack! Please adjust number of channels, z-slices, time-points.");

	}
else
{
// if full form naming is used	
	zIndex=indexOf(fName, "_z");
	if (zIndex>0)
	{
		print("Folder: "+ fileFolder);
		print("Opening: " + fName);
// extract a common string		
		coreIndex=indexOf(fName, "_c");
		coreString=substring(fName, 0, coreIndex);
// load image sequence		
		run("Image Sequence...", "open=["+inputFile+"] file=["+coreString+"] sort");
		Stack.getDimensions(width, height, channels, slices, frames);
		if(reqDims==channels*slices*frames)
		{
//convert to hyperstack					
			run("Stack to Hyperstack...", "order=xytzc channels="+chanNo+" slices="+totalZ+" frames="+totalT+" display=Composite");
			rename(coreString);
		}
		else
			exit("Requested dimensions did not match loaded stack! Please adjust number of channels, z-slices, time-points.");
	}
	else 
//no z-stack	
		exit("no z-stacks found for this set of files");
		
}
midSlice=round(totalZ/2);
//set z-position to middle of the slice
Stack.setSlice(midSlice);

run("Properties...", "voxel_depth="+zStep);

//re-color channels
for (c=1;c<=chanNo;c++)
{
	Stack.setChannel(c);
	run("Enhance Contrast", "saturated=0.15");
	lab=getInfo("slice.label");
	if(indexOf(lab, "Blue")>0)
		run("Blue");
	if(indexOf(lab, "Green")>0)
		run("Green");
	if(indexOf(lab, "Red")>0)
		run("Red");
	if(indexOf(lab, "FarRed")>0)
		run("Magenta");
	if(indexOf(lab, "Orange")>0)
		run("Orange Hot");
	if(indexOf(lab, "Cyan")>0)
		run("Cyan");
	if(indexOf(lab, "Yellow")>0)
		run("Yellow");
}
