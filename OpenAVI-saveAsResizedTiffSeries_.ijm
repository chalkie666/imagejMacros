// Fiji Macro to resize a movie nicely frame by frame
// written for Eron Sheean for image resizing movies for motion picture "Errors".
// Dan White - http://www.MPI-CBG.DE dan@chalkie.org.uk
// This code is released under the GPL v3 license. 
//
// Make sure no other images are open!!!
//
   
   
   // open the avi movie file
   movieFile = File.openDialog("Choose an .avi movie file");
   // save it as a sequence of tiff images. 
   inputDir = getDirectory("Choose a Directory to save original size tiff files into");
   run("Image Sequence... ", "format=TIFF name=movie start=0 digits=8 save=" + inputDir);
   
   requires("1.33s"); 
   setBatchMode(true);
   
   count = 0;
   countFiles(inputDir);
   n = 0;
   outputDir = getDirectory("Choose a Directory to save resized files into");
   processFiles(inputDir);
   // add some feedback output to the log window. 
   print(count+" files processed");

   // this just counts the tiff files to be processed - should be same as number of frames in the movie
   function countFiles(inputDir) {
      list = getFileList(inputDir);
      for (i=0; i<list.length; i++) {
         count++;
      }
  }

   function processFiles(inputDir) {
      list = getFileList(inputDir);
      for (i=0; i<list.length; i++) {
          showProgress(n++, count);
          path = inputDir+list[i];
          outputPath = outputDir+list[i];
          processFile(path);
      }
  }

  function processFile(path) {
       if (endsWith(path, ".tif")) {
         // open the tiff file for the current frame 
	open(path);

	// 8 bit grescale is good enough , smaller and faster
	run("8-bit");
	// FT bandpass filter to get rid of edgy noise from jpeg compression
	run("Bandpass Filter...", "filter_large=1000 filter_small=2 suppress=None tolerance=5");

	// do resize functions here
	// here we do bicubic interpolation - replace this line to fit the job	
	run("Scale...", "x=- y=- width=1920 height=1440 interpolation=Bicubic average create title=resized.tif");
	// can do more filters here
	//XXXXXX ;
	//XXXXXXX ; 
	// save the resized image
	save(outputPath + "resized" + ".tif");
        close();
   	}
 }

