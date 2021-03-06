tApp.configure({
	target: document.querySelector("tapp-main"),
	ignoreRoutes: ["#id"],
	forbiddenRoutes: ["#/forbidden"],
	errorPages: {
		notFound: "#/404",
		forbidden: "#/403"
	},
	caching: {
		backgroundPages: ["./", "./config.js", "/tApp.js", "./views/index.html", "./views/about.html"],
		persistent: true
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

tApp.start().then(() => {
	tApp.install().then(() => {
		tApp.update();
	})
});