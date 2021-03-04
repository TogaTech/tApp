tApp.configure({
	target: document.querySelector("tapp-main"),
	ignoreRoutes: ["#id"],
	forbiddenRoutes: ["#/forbidden"],
	errorPages: {
		notFound: "#/404",
		forbidden: "#/403"
	},
	caching: {
		maxBytes: 5 * 1000 * 1000, // around 5MB in bytes (5 MB * 1000 KB/MB * 1000 bytes/KB)
		updateCache: 5 * 60 * 1000, // updates the cache every 5 minutes in milliseconds (5 minutes * 60 seconds/minute * 1000 seconds/millisecond)
		backgroundRoutes: ["#/", "#/about", "#/text", "#/404", "#/403"]
	}
});

tApp.route("/", function(request) {
	tApp.redirect("#/");
});

tApp.route("#/index", function(request) {
	tApp.renderPath("#/");
});

tApp.route("#/", function(request) {
	tApp.renderFile("./views/index.html");
});

tApp.route("#/about", function(request) {
	tApp.renderFile("./views/about.html");
});

tApp.route("#/text", function(request) {
	tApp.render(`
		<h1>Text</h1>
		<p>You can place any text here.</p>
	`);
});

tApp.route("#/404", function(request) {
	tApp.render(`
		<h1>Error 404</h1>
		<p>Page not found.</p>
	`);
});

tApp.route("#/403", function(request) {
	tApp.render(`
		<h1>Error 403</h1>
		<p>Access denied.</p>
	`);
});

tApp.start();