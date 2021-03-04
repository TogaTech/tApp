class tApp {
	static config = {};
	static routes = {};
	static get version() {
		return "v0.1.0";
	}
	static route(path, renderFunction) {
		tApp.routes[path] = renderFunction;
	}
	static get(path) {
		return new Promise((resolve, reject) => {
			let xhr = new XMLHttpRequest();
			xhr.onreadystatechange = function() { 
				if (xhr.readyState == 4 && xhr.status == 200) {
					resolve(xhr.responseText);
				}
			}
			xhr.open("GET", path, true);
			xhr.send(null);

		})
	}
	static redirect(path) {
		window.location.href = path;
	}
	static render(html) {
		if(html == null) {
			throw "tAppError: No HTML specified for rendering."
		}
		if(tApp.config.target == null) {
			throw "tAppError: No target DOM specified, use tApp.config.target to set the target."
		}
		tApp.config.target.innerHTML = html;
	}
	static renderFile(path) {
		tApp.get(path).then((res) => {
			tApp.render(res);
		});
	}
	static renderPath(path) {
		if(path == null) {
			throw "tAppError: No path specified for rendering."
		}
		updatePage(path);
	}
	static updatePage(hash) {
		if(hash == null || hash == "") {
			hash = "/";
		}
		if(tApp.config.ignoreRoutes != null && tApp.config.ignoreRoutes instanceof Array && tApp.config.ignoreRoutes.includes(hash)) {
			
		} else if(tApp.routes[hash] != null) {
			tApp.routes[hash]();
		} else if(tApp.config.forbiddenRoutes != null && tApp.config.forbiddenRoutes instanceof Array && tApp.config.forbiddenRoutes.includes(hash) && tApp.config.errorPages != null && tApp.config.errorPages.forbidden != null) {
			tApp.updatePage(tApp.config.errorPages.forbidden);
		} else if(tApp.config.errorPages != null && tApp.config.errorPages.notFound != null) {
			tApp.updatePage(tApp.config.errorPages.notFound);
		} else {
			tApp.render("");
		}
	}
	static start() {
		window.addEventListener("hashchange", () => {
			tApp.updatePage(window.location.hash);
		}, false);
		tApp.updatePage(window.location.hash);
	}
}