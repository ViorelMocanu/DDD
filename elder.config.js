require('dotenv').config();
module.exports = {
	/* origin: process.env.NODE_ENV == 'development' ? 'http://localhost' : 'https://dedede.ro', // TODO: update this. */
	origin: 'https://dedede.ro',
	lang: 'ro',
	srcDir: 'src',
	distDir: 'public',
	rootDir: process.cwd(),
	build: {},
	prefix: '', // If you want your site to be built within a sub folder within your `distDir` you can use this.
	server: {},
	debug: {
		stacks: false, // output details of the stack consolidation process.
		hooks: false, // outputs the details of each hook as they are run.
		performance: false, // outputs a full performance report of how long it took to run each page.
		build: false, // gives additional details about the build process.
		automagic: true,
	},
	hooks: {
		// disable: ['elderWriteHtmlFileToPublic'], // this is used to disable internal hooks. Uncomment this hook to disabled writing your files during build.
	},
	plugins: {
		'@elderjs/plugin-markdown': {
			routes: ['informatii-utile'],
			/*contents: {
				blog: 'src/contents/articles', // if you want to add custom path to your route relative to the root directory
			},*/
			slugFormatter: function (relativeFilePath, frontmatter) {
				return false; // If needed, a custom slug for the url can be crafted from the relative path to the file and
				// frontmatter in it (if any). slugFormatter must be a function and must return a string to be used.
			},
			useSyntaxHighlighting: false, // This plugin ships with syntax highlighting ability for your convenience. Recommend setting true for technical blogs. See below for customizing options
			useTableOfContents: true,
			createRoutes: true,
		},
		'@elderjs/plugin-browser-reload': {
			// this reloads your browser when nodemon restarts your server.
			port: 8080,
			reload: false, // if you are having issues with reloading not working, change to true.
		},
		'@elderjs/plugin-seo-check': {
			display: ['errors', 'warnings'], // If the errors are too verbose remove 'warnings'
			//writeLocation: './report.json', // if you want to write a report of errors
		},
	},
	shortcodes: { closePattern: '}}', openPattern: '{{' },
	css: 'file',
};
