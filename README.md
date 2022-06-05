# tApp
An extremely lightweight, modern web framework for building offline-ready apps and websites using components, templates, and/or view files

- [Why tApp](#why-tapp)
- [Key Features](#key-features)
- [Example](#example)
- [Documentation](#documentation)
	* [Library Files](#library-files)
	* [Loader File](#loader-file)
		+ [Static Code](#static-code)
		+ [Rendering Section](#rendering-section)
		+ [tApp Import](#tapp-import)
		+ [Configuration File Import](#configuration-file-import)
		+ [Recap](#recap)
	* [Configuration File](#configuration-file)
		+ [Parameters](#parameters)
			- [Configuration Parameters](#configuration-parameters)
			- [Sample Configuration](#sample-configuration)
		+ [Routes](#routes)
			- [Redirects](#redirects)
			- [Rendering From HTML](#rendering-from-html)
			- [Rendering From File](#rendering-from-file)
			- [Rendering From Template](#rendering-from-template)
			- [Rendering With Path Parameters](#rendering-with-path-parameters)
		+ [Starting and Installing](#starting-and-installing)
	* [Views](#views)
	* [General Method Documentation](#general-method-documentation)
- [Interoperability](#interoperability)
- [Shout-outs](#shout-outs)

## Why tApp?
tApps are different than regular websites. Users expect apps to work differently. They don't want page loads when navigating an app, they want a smooth and instantaneous experience. Additionally, users want apps to be accessible offline. tApp helps achieve this goal.

## Key Features
- tApps can work offline, just like normal apps. Since all server-like routing and computation can be handled in the client through tApp, users can load and browse the tApp offline at a later time after only loading the tApp once.
- Content (like header, navbar, and footer) can remain the same between pages. That means that while the rest of the page is loading, this content stays persistent and doesn't disappear, just like any normal app navbar.
- You can serve custom 403 forbidden and 404 not found error messages and pages right from your client, since all routing is done in the client. However, the 403 page should not be used as a replacement to server-side blocking on password-protected pages, it should merely be utilized as an enhancement to the tApp experience.
- Caching allows your tApp to be blazingly fast. tApp will save loaded pages in the cache so that they load instantly the next time the user navigates to that section of the tApp.
- tApps can utilize persistent caching, so after the very first page load, all requests are redirected to the cache until the cache time expires.
- Routes can be specified to automatically load and cache asynchronously in the background when the user first loads your tApp, making the next page loads instantaneous.

## Example
See `/example` for an example tApp. The tApp loads and installs when `/example/index.html` is loaded, provided that `tApp.js` and `tApp-service-worker.js` are installed in the root directory. By downloading the repository and navigating to `file:///.../example/index.html`, the tApp should function as intended.

## Documentation
tApps are made up of 4 main components: library files (`tApp.js` and `tApp-service-worker.js`), the loader file, the configuration file, and views.

### Library Files
You do not need to worry about library files, as we take care of the development and maintenance of these files. All you need to do is to make sure that `tApp.js` is uploaded somewhere accessbile in your app and that `tApp-service-worker.js` is uploaded to the base/root directory of your app (if not, the app can only load pages within a scoped directory when offline). For example, if the service worker is uploaded to `/`, all of your tApp will be accessible offline, and if the worker is only uploaded to `/subdirectory/`, only pages in `/subdirectory/` can be loaded offline.

### Loader File
The loader file is the static part of the page as well as the entry point to the tApp. The convention for the loader file name is `index.html`, since `https://www.example.com/index.html` can usually be replaced by just `https://www.example.com/` when loading a website.

#### Static Code
This file can include a static navigation bar or header which doesn't change across pages. Additionally, this file is where style, favicons, global scripts, or any other code is loaded in the head. The loader file should be a full HTML file with a section specifically for rendering.

#### Rendering Section
The convention for the rendering section is `<tapp-main></tapp-main>`, but any tag can work as long as you can select it using the DOM methods `document.querySelector(selector)` or `document.getElementById(id)` later in your configuration file. You may want to have some static loading or preset text within the rendering section if your application takes a while to load.

#### tApp Import
The loader file will also require tApp to be imported: `<script src="/tApp.js"></script>`
The convention for importing tApp is to place this code in the head, but at the very least, tApp must be imported before your configuration file.

#### Configuration File Import
Lastly, the configuration file must be imported in the tApp: `<script src="/config.js"></script>`
The convention for importing the configuration file is to place this code at the bottom of the body, but at the very least, the configuration file must be imported after the rendering section. More information on the configuration file is in the next section.

#### Recap
To recap, here are the mandatory parts of the loader file:
- Static HTML structural elements, style, favicons, global scripts, other code in head
- Rendering section in the body (convention is `<tapp-main></tapp-main>`)
- tApp import: `<script src="/tApp.js"></script>` (convention is in head)
- Configuration file import: `<script src="/config.js"></script>` (convention is at bottom of body)

### Configuration File
The configuration file sets up all of the parameters and routes of the tApp, starting and/or installing when finished. The convention for the tApp configuration file name is `config.js`.

#### Parameters
At the top of the configuration file is where many settings of the tApp are configured.

##### Configuration Parameters
Below is a description of all available configuration parameters. For routes, see the routes section a few sections down. The `target` parameter is the only required option for the configuration, all other parameters of the argument object can be discarded if not necessary for the tApp.
```javascript
tApp.configure({
	target: /* The DOM element for the render section */,
	ignoreRoutes: /* An array of routes to ignore, this parameter is useful if you have elements with ids on the page and use #id in the URL to navigate to these sections of the page */,
	forbiddenRoutes: /* An array of "forbidden" routes, example usage is to protect a page to logged in users, in which case the forbidden routes should only be used to display the forbidden error page and not as the sole logic to check user authentication, the authentication should still be checked server-side with forbidden routes not present for logged in users (hackers can easily circumvent forbidden routes, so they should serve only as an improvement to UX and not as a functional role) */,
	errorPages: {
		notFound: /* The route to the 404 not found page for when no routes are present to match the URL */,
		forbidden: /* The route to the 403 forbidden page for when a forbidden route is present in the URL */
	},
	caching: { /* Note that if caching is null, the tApp will not cache. To have caching without any background page, periodic updates, or persistence, use caching: {} */
		backgroundPages: /* An array of pages to cache in the background asynchronously once the content loads, the convention is to add the configuration file, tApp.js, the loader file, and any view files so that they load faster */,
		periodicUpdate: /* Millisecond interval to update the cached background pages, if left blank, the background pages will not be continouusly updated and cached */,
		persistent: /* Boolean whether to use persistent caching for offline (true) or just temporary caching for improved speed (false), defaults to false */
	}
});
```

##### Sample Configuration
```javascript
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
		periodicUpdate: 60 * 1000,
		persistent: true
	}
});
```

#### Routes
A route is the end of the URL. The route can either be `/` or start with a `#`. The convention is to use routes like `#/page/subpage/deeperpage` (which serves the page `https://www.example.com/#/page/subpage/deeperpage`). The route limitations are due to the limits of client-side URL parsing.

`tApp.route(path, renderFunction)` sets up the route. The `renderFunction` is called whenever the route is triggered and takes one parameter: `request`. The `request` is an object with parameters including the type of request (for example, `GET`), the path of the request (for example, `#/custom/Custom%20Text%20Here`), the referrer/previous path (for example, `#/`), and a data object (for example, `{text: "Custom Text Here"}`). Below is an example of a `request`:
```javascript
{
	type: "GET",
	path: "#/custom/Custom%20Text%20Here",
	referrer: "#/",
	data: {
		text: "Custom Text Here"
	}
}
```

##### Redirects
The `tApp.redirect(path, title = document.title)` function redirects the URL to `path` with title `title` (defaults to current page title). The `path` can be relative (`#/`) or absolute (`https://www.example.com/`).
```javascript
tApp.route("/", function(request) {
	tApp.redirect("#/");
});
```

The `tApp.renderPath(path)` function redirects to a different path and renders `path` as if the user visited `path`, without changing the URL.
```javascript
tApp.route("#/index", function(request) {
	tApp.renderPath("#/");
});
```

##### Rendering From HTML
The `tApp.render(html)` function renders HTML code onto the rendering section. The HTML code can contain resource imports and scripts.
```javascript
tApp.route("#/text", function(request) {
	tApp.render(`
		<h1>Text</h1>
		<p>You can place any text here.</p>
	`);
});
```

##### Rendering From File
The `tApp.renderFile(path)` function renders like `tApp.render(html)`, except the `html` is supplied from an external file. This file is cached if the `caching` parameter of `configure` is not `null`.
```javascript
tApp.route("#/", function(request) {
	tApp.renderFile("./views/index.html");
});
```

##### Rendering From Template
The `tApp.renderTemplate(path, options)` function renders like `tApp.renderFile(path)`, except there is support for templating. While this templating is in the early stages, by including `{{ varName }}` (spaces optional) in your template and passing in `varName: "value"`, `{{ varName.subVar }}` and `varName: {subVar: "value"}`, or `{{ varName.0 }}` and `varName: ["value", "second", "third"]`, the `{{ varName }}` is replaced with `value`. To override this functionality in the template, use `{\{ varName }}` instead.

`renderTemplateHTML(html, options)` provides the similar functionality to `tApp.renderTemplate(path, options)` but uses HTML instead of a file.
```javascript
tApp.route("#/template", function(request) {
	tApp.renderTemplate("./views/template.html", {
		header: "Template Header",
		text: "Sample template text...",
		list: {
			header: "Example template list (nested options)",
			elements: [
				"First element",
				"Second element",
				"Third element"
			]
		}
	});
});
```

##### Rendering With Path Parameters
Path parameters are a way to add more reusability into routes. By using `<varName>` anywhere in the route as its own section of the path (at the beginning with `/` at the end, at the end with `/` at the beginning, or surrounded by `/`), whenever a path fits the format, the route is triggered, and the `request.data` includes an object with keys of the parameters and values of the input in the URL. Note that path parameter setup (`<varName>`) is only allowed within `tApp.route(path, renderFunction)` and not in other places such as `configuration`.
```javascript
tApp.route("#/custom/<text>", function(request) {
	tApp.render(`
		<h1>` + request.data.text + `</h1>
		<p>To customize the above text, change the url above to "#/custom/YOUR_TEXT_HERE"<br><br>See <a href="#/custom/` + request.data.text + `/subpage">subpage</a> here.</p>
	`);
});
```

```javascript
tApp.route("#/custom/<text>/subpage", function(request) {
	tApp.render(`
		<h1>Subpage For: ` + request.data.text + `</h1>
		<p>To customize the above text, change the url above to "#/custom/YOUR_TEXT_HERE/subpage"<br><br>See <a href="#/custom/` + request.data.text + `">main page</a> here.</p>
	`);
});
```

#### Starting and Installing
At the bottom of the configuration file (after everything else has been defined), the tApp must be started to begin listening for routes and updating the page accordingly. `tApp.start()` starts the app and returns a promise, `tApp.install(pathToServiceWorker)` installs the app and service worker based on the path to service worker (default is `/tApp-service-worker.js`), and `tApp.update()` attempts to update the app's service worker (updates may not be applied until all instances of the tApp are closed). Note that installing the tApp for full offline usage is restricted to a secure context only (HTTPS) and not supported in IE due to service worker limitations, but persistent caching is still possible, only the loader file, configuration file, and library files need to be opened before going offline.

To start, install, and update the app (with the service worker at `/tApp-service-worker.js`):
```javascript
tApp.start().then(() => {
	tApp.install().then(() => {
		tApp.update();
	}).catch((err) => {
		console.log("Installation not supported due to service worker limitations.");
	})
});
```

The service worker `/tApp-service-worker.js` must be installed at the route of the app to have access to serving offline cached data to the entire app, since service workers are scope restricted.

### Views
Views are just the rendered files. When requested, views are automatically cached if the `caching` parameter of `configuration` is not `null`. Views can also contain template-like features when combined with template-based render functions. While this templating is in the early stages, by including `{{ varName }}` (spaces optional) in your template and passing in `varName: "value"`, `{{ varName.subVar }}` and `varName: {subVar: "value"}`, or `{{ varName.0 }}` and `varName: ["value", "second", "third"]`, the `{{ varName }}` is replaced with `value`. To override this functionality in the template, use `{\{ varName }}` instead.

### General Method Documentation
Documentation is coming soon. However, the above documentation is extremely comprehensive and contains most of the information you need to get started with this framework.

## Interoperability
The tApp framework is interoperable with other front-end web frameworks. In your configuration file routes, instead of using a tApp render function, you can call a function from another framework and have that framework either render to the DOM using a function within that framework or return a value that can be rendered through a tApp render function. Combining frameworks allows for the flexibility of choice when it comes to picking from a wide variety of framework options while keeping some of the best features of tApp such as client-side routing, caching, and offline mode.

## Shout-outs
Are you using this framework to build an amazing tApp? Let us know in `Issues` or `Discussions`, and if we like it, we will most certainly feature your tApp down here!
