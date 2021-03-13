class tApp {
	static config = {};
	static routes = {};
	static cache = {};
	static cacheSize = 0;
	static started = false;
	static database;
	static currentHash = "/";
	static get version() {
		return "v0.9.1";
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
		if(params.caching != null && params.caching.backgroundPages != null && !(params.caching.backgroundPages instanceof Array)) {
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
	static get(path, ignoreCache = false) {
		return new Promise(async (resolve, reject) => {
			let fullPath = new URL(path, window.location.href).href.split("#")[0];
			let cachedPage = await tApp.getCachedPage(fullPath);
			function responseToJSON(request) {
				let jsonRequest = {};
				for(let property in request) {
					if(property != "bodyUsed" && typeof request[property] != "object" && typeof request[property] != "function") {
						jsonRequest[property] = request[property];
					}
				}
				if(request.headers != null) {
					jsonRequest.headers = {};
					request.headers.forEach((value, key) => {
						jsonRequest.headers[key] = value;
					});
				}
				return jsonRequest;
			}
			fetch(path, {
				headers: {
					"tApp-Ignore-Cache": "Ignore-Cache"
				}
			}).then((response) => {
				if(ignoreCache) {
					resolve(response);
				} else {
					response.clone().arrayBuffer().then((data) => {
						
						if(response.status === 200) {
							tApp.setCachedPage(fullPath, {
								data: data,
								cachedAt: new Date().getTime(),
								response: responseToJSON(response)
							});
							if(cachedPage == null) {
								resolve(response);
							}
						} else {
							reject(response);
						}
					});
				}
			}).catch((err) => {
				if(cachedPage == null) {
					reject(response);
				}
			});
			if(!ignoreCache && cachedPage != null) {
				let res = new Response(cachedPage.data, cachedPage.response);
				Object.defineProperty(res, "url", {value: fullPath});
				resolve(res);
			}
		});
	}
	static redirect(path, title = document.title) {
		history.replaceState(history.state, title, path);
		tApp.updatePage(path);
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
			res.clone().text().then((text) => {
				tApp.render(text);
			});
		});
	}
	static eval(code) {
		return (function(code) {
			return eval(code);
		})(code);
	}
	static optionsToEval(data) {
		let evalStr = "";
		let keys = Object.keys(data);
		for(let i = 0; i < keys.length; i++) {
			if(typeof data[keys[i]] == "function") {
				evalStr += "let " + keys[i] + " = " + data[keys[i]].toString() + ";";
			} else {
				try {
					evalStr += "let " + keys[i] + " = " + JSON.stringify(data[keys[i]]) + ";";
				} catch(err) {
					evalStr += "let " + keys[i] + " = " + data[keys[i]] + ";";
				}
			}
		}
		return evalStr;
	}
	static restoreOptions(data) {
		let evalStr = "let _____tApp_____returnOptions = {};";
		let keys = Object.keys(data);
		for(let i = 0; i < keys.length; i++) {
			evalStr += "_____tApp_____returnOptions." + keys[i] + " = " + keys[i] + ";";
		}
		return evalStr;
	}
	static evalInContext(code, data) {
		if(data == null) {
			data = {};
		}
		return tApp.eval(tApp.optionsToEval(data) + "let _____tApp_____result = (function() {return eval(\"" + code.replaceAll("\"", "\\\"") + "\")})();" + tApp.restoreOptions(data) + "[_____tApp_____result, _____tApp_____returnOptions]");
	}
	static compileTemplate(html, options) {
		function convertTemplate(template, parameters, prefix) {
			let keys = Object.keys(parameters);
			for(let i = 0; i < keys.length; i++) {
				if(parameters[keys[i]] instanceof Object) {
					template = convertTemplate(template, parameters[keys[i]], prefix + keys[i] + ".");
				} else {
					template = template.replaceAll(new RegExp("{{[\\s|\\t]*" + prefix + keys[i] + "[\\s|\\t]*}}", "g"), parameters[keys[i]]);
				}
			}
			return template;
		}
		function trim(str) {
			let returnStr = "";
			let word = false;
			for(let i = 0; i < str.length; i++) {
				if(!word && str[i] != " " && str[i] != "\t") {
					word = true;
				}
				if(word) {
					returnStr += str[i];
				}
			}
			word = false;
			let index = returnStr.length - 1;
			for(let i = returnStr.length - 1; i >= 0; i--) {
				if(!word && returnStr[i] != " " && returnStr[i] != "\t") {
					word = true;
					index = i;
				}
			}
			returnStr = returnStr.substring(0, index + 1);
			return returnStr;
		}
		let it = html.matchAll(new RegExp("{#.+?(?=#})#}", "g"));
		let next = it.next();
		while(!next.done) {
			html = html.replace(next.value[0], "");
			next = it.next();
		}
		html = html.replaceAll("{{\\{", "{{\\\\{");
		html = html.replaceAll("{{{", "{{\\{");
		html = convertTemplate(html, options, "");
		html = html.replaceAll("{\\{", "{{");
		html = html.replaceAll("{\\\\{", "{\\{");
		let splitLines = html.split("\n");
		let tokenStack = [];
		let stateStack = [];
		let newHTML = "";
		for(let i = 0; i < splitLines.length; i++) {
			let trimmed = trim(splitLines[i]);
			if(tokenStack[tokenStack.length - 1] == "IF" && trimmed.replaceAll(" ", "").replaceAll("\t", "") == "{%endif%}") {
				tokenStack.pop();
				stateStack.pop();
			} else if(tokenStack[tokenStack.length - 1] == "WHILE" && trimmed.replaceAll(" ", "").replaceAll("\t", "") == "{%endwhile%}") {
				stateStack[stateStack.length - 1].result = tApp.eval(tApp.optionsToEval(options) + stateStack[stateStack.length - 1].condition);
				if(!stateStack[stateStack.length - 1].result) {
					tokenStack.pop();
					stateStack.pop();
				} else {
					i = stateStack[stateStack.length - 1].startLine;
				}
			} else if(trimmed.substring(0, 2) == "{%" && trimmed.substring(trimmed.length - 2, trimmed.length) == "%}") {
				let parsedStatement = trim(trimmed.substring(2, trimmed.length - 2));
				if(["if ", "if\t", "if("].includes(parsedStatement.substring(0, 3))) {
					tokenStack.push("IF");
					let condition = trim(parsedStatement.substring(2));
					stateStack.push({
						result: tApp.eval(tApp.optionsToEval(options) + condition)
					});
					stateStack[stateStack.length - 1].executed = stateStack[stateStack.length - 1].result;
				} else if(["elseif ", "elseif\t", "elseif("].includes(parsedStatement.substring(0, 7))) {
					if(tokenStack[tokenStack.length - 1] == "IF") {
						if(!stateStack[stateStack.length - 1].executed) {
							let condition = trim(parsedStatement.substring(6));
							stateStack[stateStack.length - 1].result = tApp.eval(tApp.optionsToEval(options) + condition);
							stateStack[stateStack.length - 1].executed = stateStack[stateStack.length - 1].result;
						} else {
							stateStack[stateStack.length - 1].result = false;
						}
					} else {
						throw "tAppError: Else-if missing an if-statement on line " + (i + 1) + ".";
					}
				} else if(["else if ", "else if\t", "else if("].includes(parsedStatement.substring(0, 8))) {
					if(tokenStack[tokenStack.length - 1] == "IF") {
						if(!stateStack[stateStack.length - 1].executed) {
							let condition = trim(parsedStatement.substring(7));
							stateStack[stateStack.length - 1].result = tApp.eval(tApp.optionsToEval(options) + condition);
							stateStack[stateStack.length - 1].executed = stateStack[stateStack.length - 1].result;
						} else {
							stateStack[stateStack.length - 1].result = false;
						}
					} else {
						throw "tAppError: Else-if missing an if-statement on line " + (i + 1) + ".";
					}
				} else if(trimmed.replaceAll(" ", "").replaceAll("\t", "") == "{%else%}") {
					if(tokenStack[tokenStack.length - 1] == "IF") {
						stateStack[stateStack.length - 1].result = !stateStack[stateStack.length - 1].executed;
						stateStack[stateStack.length - 1].executed = stateStack[stateStack.length - 1].result;
					} else {
						throw "tAppError: Else missing an if-statement on line " + (i + 1) + ".";
					}
				} else if(["while ", "while\t", "while("].includes(parsedStatement.substring(0, 6))) {
					tokenStack.push("WHILE");
					let condition = trim(parsedStatement.substring(5));
					stateStack.push({
						condition: condition,
						result: tApp.eval(tApp.optionsToEval(options) + condition),
						startLine: i
					});
				}
			} else if((tokenStack[tokenStack.length - 1] == "IF" && stateStack[stateStack.length - 1].result) || tokenStack[tokenStack.length - 1] == null || (tokenStack[tokenStack.length - 1] == "WHILE" && stateStack[stateStack.length - 1].result)) {
				let newRes = splitLines[i];
				let it = newRes.matchAll(new RegExp("{{{@[\\s|\\t]*(.+?(?=}}}))[\\s|\\t]*}}}", "g"));
				let next = it.next();
				while(!next.done) {
					let contextEval = tApp.evalInContext(trim(next.value[1]), options);
					options = contextEval[1];
					newRes = newRes.replace(next.value[0], "");
					next = it.next();
				}
				it = newRes.matchAll(new RegExp("{{{[\\s|\\t]*(.+?(?=}}}))[\\s|\\t]*}}}", "g"));
				next = it.next();
				while(!next.done) {
					let contextEval = tApp.evalInContext(trim(next.value[1]), options);
					if(contextEval[0] == null) {
						contextEval[0] = "";
					}
					options = contextEval[1];
					newRes = newRes.replace(next.value[0], contextEval[0]);
					next = it.next();
				}
				newHTML += newRes + "\n";
			}
		}
		newHTML = newHTML.replaceAll("{\\%", "{%");
		newHTML = newHTML.replaceAll("{{\\{", "{{{");
		return newHTML;
	}
	static renderTemplateHTML(html, options) {
		html = tApp.compileTemplate(html, options);
		tApp.render(html);
	}
	static renderTemplate(path, options) {
		tApp.get(path).then((res) => {
			res.clone().text().then((text) => {
				tApp.renderTemplateHTML(text, options);
			});
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
		let tmpCurrentHash = tApp.currentHash;
		tApp.currentHash = hash;
		let splitHash = hash.split("/").filter(s => s != "");
		if(tApp.config.ignoreRoutes != null && tApp.config.ignoreRoutes instanceof Array && tApp.config.ignoreRoutes.includes(hash)) {
			
		} else if(tApp.config.forbiddenRoutes != null && tApp.config.forbiddenRoutes instanceof Array && tApp.config.forbiddenRoutes.includes(hash) && tApp.config.errorPages != null && tApp.config.errorPages.forbidden != null) {
			tApp.updatePage(tApp.config.errorPages.forbidden);
		} else if(tApp.routes[hash] != null) {
			tApp.routes[hash]({
				type: "GET",
				path: hash,
				referrer: tmpCurrentHash,
				data: null
			});
		} else {
			let routeHashes = Object.keys(tApp.routes);
			let routeHash;
			let routeParams = {};
			for(let i = 0; i < routeHashes.length; i++) {
				if(routeHash == null) {
					let splitRoute = routeHashes[i].split("/").filter(s => s != "");
					if(splitHash.length == splitRoute.length) {
						let correctRoute = true;
						for(let j = 0; j < splitHash.length; j++) {
							if(correctRoute) {
								if(splitHash[j] == splitRoute[j]) {
									
								} else if(splitRoute[j][0] == "<" && splitRoute[j][splitRoute[j].length - 1] == ">") {
									routeParams[splitRoute[j].substring(1, splitRoute[j].length - 1)] = decodeURI(splitHash[j]);
								} else {
									correctRoute = false;
								}
							}
						}
						if(correctRoute) {
							routeHash = routeHashes[i];
						} else {
							routeParams = {};
						}
					}
				}
			}
			if(routeHash != null) {
				tApp.routes[routeHash]({
					type: "GET",
					path: hash,
					referrer: tmpCurrentHash,
					data: routeParams
				});
			} else if(tApp.config.errorPages != null && tApp.config.errorPages.notFound != null) {
				tApp.updatePage(tApp.config.errorPages.notFound);
			} else {
				tApp.render("");
			}
		}
	}
	static loadBackgroundPages() {
		if(tApp.config.caching != null) {
			for(let i = 0; i < tApp.config.caching.backgroundPages.length; i++) {
				tApp.get(tApp.config.caching.backgroundPages[i]);
			}
			if(tApp.config.caching.periodicUpdate != null) {
				setTimeout(() => {
					tApp.loadBackgroundPages();
				}, tApp.config.caching.periodicUpdate)
			}
		}
	}
	static start() {
		return new Promise((resolve, reject) => {
			if(!tApp.started) {
				tApp.started = true;
				if(tApp.config.caching != null && tApp.config.caching.persistent) {
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
						if(Object.keys(tApp.routes).length > 0) {
							window.addEventListener("hashchange", () => {
								tApp.updatePage(window.location.hash);
							}, false);
							tApp.updatePage(window.location.hash);
						}
						tApp.loadBackgroundPages();
						resolve(true);
					};
					request.onsuccess = async (event) => {
						tApp.database = request.result;
						if(Object.keys(tApp.routes).length > 0) {
							window.addEventListener("hashchange", () => {
								tApp.updatePage(window.location.hash);
							}, false);
							tApp.updatePage(window.location.hash);
						}
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
					if(Object.keys(tApp.routes).length > 0) {
						window.addEventListener("hashchange", () => {
							tApp.updatePage(window.location.hash);
						}, false);
						tApp.updatePage(window.location.hash);
					}
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