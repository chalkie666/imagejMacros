// RGB to CMYK conversion
// Jean-Christophe Taveau
// http://crazybiocomputing.blogspot.com
// modified to work for z stacks (or movies) by Daniel J. White PhD. 202 GE Lifesciences / Cytiva. 

in=getTitle();
//run("Duplicate...", "title=[tmp]");
// for a stack duplicate the stack
run("Duplicate...", "duplicate range=1-4096");
rename("tmp");

// 1- Invert and split channels C, M, and Y
run("Invert");
run("Split Channels");
selectWindow("tmp (red)");rename("CMY_cyan");
selectWindow("tmp (green)");rename("CMY_magenta");
selectWindow("tmp (blue)");rename("CMY_yellow");

// 2- compute channel K
//run("Images to Stack", "name=CMYK title=CMY_ use keep");
// make the merge image of CM in a composite so we can subtract K
//run("Z Project...", "start=1 stop=3 projection=[Min Intensity]");rename("CMY_K");
// for a stack we can get the min using the image calculator to find the min of the three channels.
// do it in 2 steps.  
imageCalculator("Min create stack", "CMY_cyan","CMY_magenta");
rename("minCM");
imageCalculator("Min create stack", "minCM","CMY_yellow");
rename("K");


// 3- Subtract K to C, M, and Y.
imageCalculator("Subtract create stack", "CMY_cyan","K");
imageCalculator("Subtract create stack", "CMY_magenta","K");
imageCalculator("Subtract create stack", "CMY_yellow","K");
//tidy up to save ram
selectWindow("CMY_cyan");
close();
selectWindow("CMY_magenta");
close();
selectWindow("CMY_yellow");
close();

//run("Images to Stack", "name=CMYK title=CMY_ use");
// make the merge image of K subtracted CMY in a compositeK
// for a stack use merge
run("Merge Channels...", "c1=[Result of CMY_cyan] c2=[Result of CMY_magenta] c3=[Result of CMY_yellow] create composite");

exit();