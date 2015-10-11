/*
 * GPL v3 
 */
import java.io.File;
import java.lang.Runtime;

import net.imagej.ImageJ;

import org.scijava.ItemIO;
import org.scijava.command.Command;
import org.scijava.plugin.Parameter;
import org.scijava.plugin.Plugin;

/**
 * A plugin for running a command line executable utility with parameters.
 * <p>
 * The annotation {@code @Plugin} lets ImageJ know that this is a plugin. There
 * are a vast number of possible plugins; {@code Command} plugins are the most
 * common one: they take inputs and produce outputs.
 * </p>
 * <p>
 * A {@link Command} is most useful when it is bound to a menu item; that is
 * what the {@code menuPath} parameter of the {@code @Plugin} annotation does.
 * </p>
 * <p>
 * Each input to the command is specified as a field with the {@code @Parameter}
 * annotation. Each output is specified the same way, but with a
 * {@code @Parameter(type = ItemIO.OUTPUT)} annotation.
 * </p>
 * 
 * @author Daniel James White
 */
@Plugin(type = Command.class, headless = true, menuPath = "Plugins>Utilities>CommandLineExec")
public class RunCommandLineExecutable implements Command {

	@Parameter(label = "Path to command line executable utility")
	private String executablePath = "/usr/bin/file";

	@Parameter(label = "Image or other data file to process as first argument")
	private File arg1Path;

	@Parameter(type = ItemIO.OUTPUT)
	private String exeString;

	@Parameter(type = ItemIO.OUTPUT)
	private String standardOut;

	private String arg1;

	/**
	 * Runs a comand line executable utility with paramaters.
	 * The {@code run()} method of every {@link Command} is the entry point for
	 * ImageJ: this is what will be called when the user clicks the menu entry,
	 * after the inputs are populated.
	 */
	@Override
	public void run() {
		arg1 = arg1Path.getPath();
		exeString = executablePath + " " + arg1;
		standardOut = "standard output goes here"

		try {
			// Run ls command
			Process process = Runtime.getRuntime().exec(exeString);
		} catch (Exception e) {
		e.printStackTrace(System.err);
		}

	}

	/**
	 * A {@code main()} method for testing.
	 * <p>
	 * When developing a plugin in an Integrated Development Environment (such as
	 * Eclipse or NetBeans), it is most convenient to provide a simple
	 * {@code main()} method that creates an ImageJ context and calls the plugin.
	 * </p>
	 * <p>
	 * In particular, this comes in handy when one needs to debug the plugin:
	 * after setting one or more breakpoints and populating the inputs (e.g. by
	 * calling something like
	 * {@code ij.command().run(MyPlugin.class, "inputImage", myImage)} where
	 * {@code inputImage} is the name of the field specifying the input) debugging
	 * becomes a breeze.
	 * </p>
	 * 
	 * @param args unused
	 */
	public static void main(final String... args) {
		// Launch ImageJ as usual.
		final ImageJ ij = net.imagej.Main.launch(args);

		// Launch our command right away.
		ij.command().run(RunCommandLineExecutable.class, true);
	}

}