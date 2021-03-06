class tApp {
	static config = {};
	static routes = {};
	static cache = {};
	static cacheSize = 0;
	static started = false;
	static database;
	static currentHash = "/";
	static get version() {
		return "v0.6.1";
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
	static getOfflineData(key) {
		return new Promise((resolve, reject) => {
			let request = tApp.database.transaction(["offlineStorage"], "readwrite").objectStore("offlineStorage").get(key);
			request.onerror = (event) => {
				reject("tAppError: Offline storage is not available in this browser.");
			};
			request.onsuccess = (event) => {
				resolve(request.result);
			};
		});
	}
	static setOfflineData(key, value) {
		return new Promise((resolve, reject) => {
			let request = tApp.database.transaction(["offlineStorage"], "readwrite").objectStore("offlineStorage").put(value, key);
			request.onerror = (event) => {
				reject("tAppError: Offline storage is not available in this browser.");
			};
			request.onsuccess = (event) => {
				resolve(true);
			}
		});
	}
	static removeOfflineData(key) {
		return new Promise(async (resolve, reject) => {
			let tmp = await tApp.getOfflineData(key);
			let request = tApp.database.transaction(["offlineStorage"], "readwrite").objectStore("offlineStorage").delete(key);
			request.onerror = (event) => {
				reject("tAppError: Offline storage is not available in this browser.");
			};
			request.onsuccess = (event) => {
				resolve(tmp);
			};
		});
	}
	static getAllOfflineDataKeys() {
		return new Promise((resolve, reject) => {
			let request = tApp.database.transaction(["offlineStorage"], "readwrite").objectStore("offlineStorage").getAllKeys();
			request.onerror = (event) => {
				reject("tAppError: Offline storage is not available in this browser.");
			};
			request.onsuccess = (event) => {
				resolve(request.result);
			};
		});
	}
	static getAllOfflineData() {
		return new Promise(async (resolve, reject) => {
			let keys = await tApp.getAllOfflineDataKeys();
			let offline = {};
			for(let i = 0; i < keys.length; i++) {
				offline[keys[i]] = await tApp.getOfflineData(keys[i]);
			}
			resolve(offline);
		});
	}
	static clearOfflineData() {
		return new Promise((resolve, reject) => {
			let request = tApp.database.transaction(["offlineStorage"], "readwrite").objectStore("offlineStorage").clear();
			request.onerror = (event) => {
				reject("tAppError: Offline storage is not available in this browser.");
			};
			request.onsuccess = (event) => {
				resolve(true);
			};
		});

	}
	static get(path) {
		return new Promise(async (resolve, reject) => {
			let fullPath = new URL(path, window.location.href).href;
			let cachedPage = await tApp.getCachedPage(fullPath);
			let xhr = new XMLHttpRequest();
			xhr.onreadystatechange = async () => {
				if (xhr.readyState === 4) {
					if (xhr.status === 200) {
						tApp.setCachedPage(fullPath, {
							data: xhr.responseText,
							cachedAt: new Date().getTime()
						});
						if(cachedPage == null) {
							resolve(xhr.responseText);
						}
					} else {
						if(cachedPage == null) {
							reject({
								error: "GET " + xhr.responseURL + " " + xhr.status + " (" + xhr.statusText + ")",
								errorCode: xhr.status
							});
						}
					}
				}
			}
			xhr.open("GET", path, true);
			xhr.send(null);
			if(cachedPage != null) {
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
		function nodeScriptReplace(node) {
			if (nodeScriptIs(node) === true) {
				node.parentNode.replaceChild(nodeScriptClone(node), node);
			} else {
				var i = -1, children = node.childNodes;
				while (++i < children.length) {
					nodeScriptReplace(children[i]);
				}
			}
			return node;
		}
		function nodeScriptClone(node){
			var script  = document.createElement("script");
			script.text = node.innerHTML;
			
			var i = -1, attrs = node.attributes, attr;
			while (++i < attrs.length) {                                    
				script.setAttribute((attr = attrs[i]).name, attr.value);
			}
			return script;
		}
			
		function nodeScriptIs(node) {
			return node.tagName === 'SCRIPT';
		}
		nodeScriptReplace(tApp.config.target);
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
			tApp.routes[hash]({
				type: "GET",
				referrer: tApp.currentHash,
				data: null
			});
		} else if(tApp.config.forbiddenRoutes != null && tApp.config.forbiddenRoutes instanceof Array && tApp.config.forbiddenRoutes.includes(hash) && tApp.config.errorPages != null && tApp.config.errorPages.forbidden != null) {
			tApp.updatePage(tApp.config.errorPages.forbidden);
		} else if(tApp.config.errorPages != null && tApp.config.errorPages.notFound != null) {
			tApp.updatePage(tApp.config.errorPages.notFound);
		} else {
			tApp.render("");
		}
		tApp.currentHash = hash;
	}
	static loadBackgroundPages() {
		for(let i = 0; i < tApp.config.caching.backgroundPages.length; i++) {
			tApp.get(tApp.config.caching.backgroundPages[i]);
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
					let request = window.indexedDB.open("tAppCache", 5);
					request.onerror = (event) => {
						console.warn("tAppWarning: Persistent caching is not available in this browser.");
						tApp.config.caching.persistent = false;
						window.addEventListener("hashchange", () => {
							tApp.updatePage(window.location.hash);
						}, false);
						tApp.updatePage(window.location.hash);
						tApp.loadBackgroundPages();
						resolve(true);
					};
					request.onsuccess = async (event) => {
						tApp.database = request.result;
						window.addEventListener("hashchange", () => {
							tApp.updatePage(window.location.hash);
						}, false);
						tApp.updatePage(window.location.hash);
						tApp.loadBackgroundPages();
						resolve(true);
						
					};
					request.onupgradeneeded = (event) => {
						tApp.database = request.result;
						if(!tApp.database.objectStoreNames.contains("cachedPages")) {
							tApp.database.createObjectStore("cachedPages");
						}
						if(!tApp.database.objectStoreNames.contains("offlineStorage")) {
							tApp.database.createObjectStore("offlineStorage");
						}
					};
				} else {
					window.addEventListener("hashchange", () => {
						tApp.updatePage(window.location.hash);
					}, false);
					tApp.updatePage(window.location.hash);
					tApp.loadBackgroundPages();
					resolve(true);
				}
			} else {
				reject("tAppError: tApp has already started.");
			}
		});
	}
	static install(pathToServiceWorker = '/tApp-service-worker.js') {
		return new Promise((resolve, reject) => {
			if ('serviceWorker' in navigator) {
				navigator.serviceWorker.register(pathToServiceWorker).then(function() {
					resolve(true);
				}, function() {
					reject("tAppError: Unable to install full offline functionality, an error occurred.");
				});
			} else {
				reject("tAppError: Full offline functionality is not supported for this website. This issue can occur in unsupported browsers (such as IE) or in insecure contexts (HTTPS/SSL is required for full offline functionality).");
			}
		});
	}
	static uninstall() {
		return new Promise((resolve, reject) => {
			navigator.serviceWorker.getRegistrations().then(function(registrations) {
				for(let registration of registrations) {
					registration.unregister()
				}
				resolve(true);
			});
		});
	}
	static update() {
		return new Promise((resolve, reject) => {
			navigator.serviceWorker.getRegistrations().then(function(registrations) {
				for(let registration of registrations) {
					registration.update()
				}
				resolve(true);
			});
		});
	}
}