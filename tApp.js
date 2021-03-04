class tApp {
	static config = {};
	static routes = {};
	static cache = {};
	static cacheSize = 0;
	static get version() {
		return "v0.2.0";
	}
	static configure(params) {
		if(params == null) {
			throw "tAppError: No params specified for configuring."
		}
		let validation = tApp.validateConfig(params);
		if(validation.valid) {
			tApp.config = validation.params;
		} else {
			throw validation.error;
		}
	}
	static validateConfig(params) {
		if(params.target != null && !(params.target instanceof HTMLElement)) {
			return {
				valid: false,
				error: "tAppError: Invalid configure parameter, target is not of type HTMLElement."
			}
		}
		if(params.ignoreRoutes != null && !(params.ignoreRoutes instanceof Array)) {
			return {
				valid: false,
				error: "tAppError: Invalid configure parameter, ignoreRoutes is not of type Array."
			}
		}
		if(params.forbiddenRoutes != null && !(params.forbiddenRoutes instanceof Array)) {
			return {
				valid: false,
				error: "tAppError: Invalid configure parameter, forbiddenRoutes is not of type Array."
			}
		}
		if(params.errorPages != null && !(params.errorPages instanceof Object)) {
			return {
				valid: false,
				error: "tAppError: Invalid configure parameter, errorPages is not of type Object."
			}
		}
		if(params.caching != null && !(params.caching instanceof Object)) {
			return {
				valid: false,
				error: "tAppError: Invalid configure parameter, caching is not of type Object."
			}
		}
		if(params.caching.backgroundRoutes != null && !(params.caching.backgroundRoutes instanceof Array)) {
			return {
				valid: false,
				error: "tAppError: Invalid configure parameter, caching.backgroundRoutes is not of type Array."
			}
		}
		if(params.caching != null && params.caching.maxBytes == null) {
			params.caching.maxBytes = Infinity;
		}
		if(params.caching != null && params.caching.updateCache == null) {
			params.caching.updateCache = Infinity;
		}
		if(params.caching != null && params.caching.backgroundRoutes == null) {
			params.caching.backgroundRoutes = [];
		}
		return {
			valid: true,
			params: params
		};
	}
	static route(path, renderFunction) {
		tApp.routes[path] = renderFunction;
	}
	static get(path) {
		return new Promise((resolve, reject) => {
			let fullPath = new URL(path, window.location.href).href;
			if(tApp.config.caching == null || (tApp.cache[fullPath] == null || tApp.cache[fullPath].cachedAt + tApp.config.caching.updateCache < new Date().getTime())) {
				let xhr = new XMLHttpRequest();
				xhr.onreadystatechange = function() {
					if (xhr.readyState === 4) {
						if (xhr.status === 200) {
							if(tApp.cache[fullPath] != null) {
								tApp.cacheSize -= new Blob([tApp.cache[fullPath].data]).size;
							}
							let size = new Blob([xhr.responseText]).size;
							while(tApp.cacheSize + size > tApp.config.caching.maxBytes) {
								let keys = Object.keys(tApp.cache);
								let num = Math.floor(Math.random() * keys.length);
								if(num < keys.length) {
									tApp.cacheSize -= new Blob([tApp.cache[keys[num]].data]).size;
									delete tApp.cache[keys[num]];
								}
							}
							tApp.cacheSize += size;
							tApp.cache[fullPath] = {
								data: xhr.responseText,
								cachedAt: new Date().getTime()
							};
							tApp.cacheSize += new Blob([fullPath]).size;
							resolve(xhr.responseText);
						} else {
							reject("GET " + xhr.responseURL + " " + xhr.status + "(" + xhr.statusText + ")");
						}
					}
				}
				xhr.open("GET", path, true);
				xhr.send(null);
			} else {
				resolve(tApp.cache[new URL(path, window.location.href).href].data);
			}
		});
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
		tApp.updatePage(path);
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