//This simple macro uses "Live" function of imageJ's "Plot Profile" in a loop,
//in order to monitor the pixel values in a ROI defined in the macro
//anywhere on a screenshot image of the whole screen.

//grab the whole screen into an image window
run("Capture Screen");

//Set the ROI for use by Plot Profile
makeRectangle(124, 386, 290, 259);
//makeRectangle(region);

//Grab the ROI from the screen shot and make a new imiage with it. 
run("Copy");
run("Internal Clipboard");

//Make the profile plot with all of the new image, containing the ROI 
run("Select All");
run("Plot Profile");

//Close the screenshot
selectWindow("Screenshot");
run("Close");

// user needs to click "Live" button in plot profile window and move it to a good place. 
waitForUser;

// Set number of times to run the loop, it can be a very large number. 
timePoints = 100;

// Loop to repeat the above first plot, 
// resuimng the clipboard image and pasting into it
// and closing the screenshots as we go
// plot profile is in live mode, so it updates automatically when the input image changes. 

for (i=0; i<timePoints; i++){
  	run("Capture Screen");
  	run("Set... ", "zoom=1");
  	// same ROI as above here please. 
	makeRectangle(124, 386, 290, 259);
	run("Copy");
	selectWindow("Clipboard-1");
	run("Paste");
	selectWindow("Screenshot");
	run("Close");

	//add a time delay here to update less often
	//wait(100);
}

// tidy up
selectWindow("Clipboard-1");
run("Close");
