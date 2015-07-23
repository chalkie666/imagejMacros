//This simple macro uses "Live" function of imageJ's "Plot Profile" in a loop,
//in order to monitor the pixel values in a ROI defined in the macro
//anywhere on a screenshot image of the whole screen.

//grab the whole screen into an image window
run("Capture Screen");

//Set the ROI for use by Plot Profile
//makeRectangle(124, 386, 290, 259);
x = 250;
y = 386;
dx = 100;
dy = 100;
makeRectangle(x, y, dx, dy);

//Grab the ROI from the screenshot and make a new image with it. 
run("Copy");
run("Internal Clipboard");

//Make the profile plot with all of the new image, containing the ROI 
run("Select All");
run("Plot Profile");

//Close the screenshot
selectWindow("Screenshot");
run("Close");

// user needs to click "Live" button in plot profile window
// and move Clipboard and Plot Profile windows to a good place,
// out of the way of the ROI 
waitForUser;

// Set number of times to run the loop, it can be a very large number. 
timePoints = 1000;

// Loop to repeat the above first plot, 
// reusing the clipboard image and pasting into it
// and closing the screenshots as we go.
// Plot Profile is in live mode,
// so it updates automatically when the input image changes. 

for (i=0; i<timePoints; i++){
  	run("Capture Screen");
  	run("Set... ", "zoom=1");
  	// same ROI as above here please. 
	makeRectangle(x, y, dx, dy);
	run("Copy");
	selectWindow("Clipboard");
	run("Paste");
	selectWindow("Screenshot");
	run("Close");

	//add a time delay here to update less often
	wait(1);
}

// tidy up
selectWindow("Clipboard");
run("Close");
