class tApp {
	static config = {};
	static routes = {};
	static cache = {};
	static cacheSize = 0;
	static started = false;
	static database;
	static get version() {
		return "v0.3.0";
	}
	static configure(params) {
		if(params == null) {
			throw "tAppError: No params specified for configuring."
		}
		if(!tApp.started) {
			let validation = tApp.validateConfig(params);
			if(validation.valid) {
				tApp.config = validation.params;
			} else {
				throw validation.error;
			}
		} else {
			throw "tAppError: tApp has already started.";
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
		if(params.caching.backgroundPages != null && !(params.caching.backgroundPages instanceof Array)) {
			return {
				valid: false,
				error: "tAppError: Invalid configure parameter, caching.backgroundPages is not of type Array."
			}
		}
		if(params.caching != null && params.caching.maxBytes == null) {
			params.caching.maxBytes = Infinity;
		}
		if(params.caching != null && params.caching.updateCache == null) {
			params.caching.updateCache = Infinity;
		}
		if(params.caching != null && params.caching.backgroundPages == null) {
			params.caching.backgroundPages = [];
		}
		if(params.caching != null && params.caching.persistent == null) {
			params.caching.persistent = false;
		}
		if (window.indexedDB == null) {
			if(params.caching.persistent) {
				console.warn("tAppWarning: Persistent caching is not available in this browser.");
				params.caching.persistent = false;
			}
		}

		return {
			valid: true,
			params: params
		};
	}
	static route(path, renderFunction) {
		if(path == "/" || path.substring(0, 1) == "#") {
			tApp.routes[path] = renderFunction;
		} else {
			throw "tAppError: Invalid path, the path can only be \"/\" or start with \"#\".";
		}
	}
	static getCachedPage(fullPath) {
		return new Promise((resolve, reject) => {
			if(tApp.config.caching == null) {
				resolve(null);
			} else if(tApp.config.caching.persistent) {
				let request = tApp.database.transaction(["cachedPages"], "readwrite").objectStore("cachedPages").get(fullPath);
				request.onerror = (event) => {
					reject("tAppError: Persistent caching is not available in this browser.");
				};
				request.onsuccess = (event) => {
					resolve(request.result);
				};
			} else {
				resolve(tApp.cache[fullPath]);
			}
		});
	}
	static setCachedPage(fullPath, value) {
		return new Promise((resolve, reject) => {
			if(tApp.config.caching == null) {
				resolve(false);
			} else if(tApp.config.caching.persistent) {
				let request = tApp.database.transaction(["cachedPages"], "readwrite").objectStore("cachedPages").put(value, fullPath);
				request.onerror = (event) => {
					reject("tAppError: Persistent caching is not available in this browser.");
				};
				request.onsuccess = (event) => {
					resolve(true);
				}
			} else {
				tApp.cache[fullPath] = value;
				resolve(true);
			}
		});
	}
	static removeCachedPage(fullPath) {
		return new Promise(async (resolve, reject) => {
			if(tApp.config.caching == null) {
				resolve(null);
			} else if(tApp.config.caching.persistent) {
				let tmp = await tApp.getCachedPage(fullPath);
				let request = tApp.database.transaction(["cachedPages"], "readwrite").objectStore("cachedPages").delete(fullPath);
				request.onerror = (event) => {
					reject("tAppError: Persistent caching is not available in this browser.");
				};
				request.onsuccess = (event) => {
					resolve(tmp);
				};
			} else {
				let tmp = tApp.cache[fullPath];
				delete tApp.cache[fullPath];
				resolve(tmp);
			}
		});
	}
	static getCachedPaths() {
		return new Promise((resolve, reject) => {
			if(tApp.config.caching == null) {
				resolve([]);
			} else if(tApp.config.caching.persistent) {
				let request = tApp.database.transaction(["cachedPages"], "readwrite").objectStore("cachedPages").getAllKeys();
				request.onerror = (event) => {
					reject("tAppError: Persistent caching is not available in this browser.");
				};
				request.onsuccess = (event) => {
					resolve(request.result);
				};
			} else {
				resolve(Object.keys(tApp.cache));
			}
		});
	}
	static getCachedPages() {
		return new Promise(async (resolve, reject) => {
			if(tApp.config.caching == null) {
				resolve({});
			} else if(tApp.config.caching.persistent) {
				let keys = await tApp.getCachedPaths();
				let cached = {};
				for(let i = 0; i < keys.length; i++) {
					cached[keys[i]] = await tApp.getCachedPage(keys[i]);
				}
				resolve(cached);
			} else {
				resolve(tApp.cache);
			}
		});
	}
	static clearCachedPages() {
		return new Promise((resolve, reject) => {
			if(tApp.config.caching == null) {
				resolve(false);
			} else if(tApp.config.caching.persistent) {
				let request = tApp.database.transaction(["cachedPages"], "readwrite").objectStore("cachedPages").clear();
				request.onerror = (event) => {
					reject("tAppError: Persistent caching is not available in this browser.");
				};
				request.onsuccess = (event) => {
					resolve(true);
				};
			} else {
				tApp.cache = {};
				resolve(true);
			}
		});

	}
	static get(path) {
		return new Promise(async (resolve, reject) => {
			let fullPath = new URL(path, window.location.href).href;
			let cachedPage = await tApp.getCachedPage(fullPath);
			if(cachedPage == null || cachedPage.cachedAt + tApp.config.caching.updateCache < new Date().getTime()) {
				let xhr = new XMLHttpRequest();
				xhr.onreadystatechange = async () => {
					if (xhr.readyState === 4) {
						if (xhr.status === 200) {
							if(cachedPage != null) {
								tApp.cacheSize -= new Blob([cachedPage.data]).size;
							}
							let size = new Blob([xhr.responseText]).size;
							while(tApp.cacheSize + size > tApp.config.caching.maxBytes) {
								let keys = await tApp.getCachedPaths();
								let num = Math.floor(Math.random() * keys.length);
								if(num < keys.length) {
									let removedPage = await tApp.removeCachedPage(keys[num]);
									tApp.cacheSize -= new Blob([removedPage.data]).size;											}
							}
							tApp.cacheSize += size;
							tApp.setCachedPage(fullPath, {
								data: xhr.responseText,
								cachedAt: new Date().getTime()
							});
							resolve(xhr.responseText);
						} else {
							reject({
								error: "GET " + xhr.responseURL + " " + xhr.status + " (" + xhr.statusText + ")",
								errorCode: xhr.status
							});
						}
					}
				}
				xhr.open("GET", path, true);
				xhr.send(null);
			} else {
				resolve(cachedPage.data);
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
	static loadBackgroundPages() {
		for(let i = 0; i < tApp.config.caching.backgroundPages.length; i++) {
			tApp.get(tApp.config.caching.backgroundPages[i]);
		}
		if(tApp.config.caching.updateCache < 60000) {
			setTimeout(() => {
				tApp.loadBackgroundPages();
			}, tApp.config.caching.updateCache);
		} else {
			setTimeout(() => {
				tApp.loadBackgroundPages();
			}, 60000);
		}
	}
	static start() {
		return new Promise((resolve, reject) => {
			if(!tApp.started) {
				tApp.started = true;
				if(tApp.config.caching.persistent) {
					Object.defineProperty(window, 'indexedDB', {
						value: window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB
					});
					Object.defineProperty(window, 'IDBTransaction', {
						value: window.IDBTransaction || window.webkitIDBTransaction || window.msIDBTransaction
					});
					Object.defineProperty(window, 'IDBKeyRange', {
						value: window.IDBKeyRange = window.IDBKeyRange || window.webkitIDBKeyRange || window.msIDBKeyRange
					});
					let request = window.indexedDB.open("tAppCache", 2);
					request.onerror = (event) => {
						console.warn("tAppWarning: Persistent caching is not available in this browser.");
						tApp.config.caching.persistent = false;
						window.addEventListener("hashchange", () => {
							tApp.updatePage(window.location.hash);
						}, false);
						tApp.updatePage(window.location.hash);
						tApp.loadBackgroundPages();
					};
					request.onsuccess = (event) => {
						tApp.database = request.result;
						window.addEventListener("hashchange", () => {
							tApp.updatePage(window.location.hash);
						}, false);
						tApp.updatePage(window.location.hash);
						tApp.loadBackgroundPages();
	
					};
					request.onupgradeneeded = (event) => {
						tApp.database = request.result;
						tApp.database.createObjectStore("cachedPages");
					};
				} else {
					window.addEventListener("hashchange", () => {
						tApp.updatePage(window.location.hash);
					}, false);
					tApp.updatePage(window.location.hash);
					tApp.loadBackgroundPages();
				}
				resolve(true);
			} else {
				reject("tAppError: tApp has already started.");
			}
		});
	}
}