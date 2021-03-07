var version = 'v17::';

self.addEventListener("install", function(event) {
	event.waitUntil(() => {
		self.skipWaiting();
	});
});

self.addEventListener("fetch", function(event) {
	let fetchResponse = (async () => {
		return new Promise((resolve, reject) => {
			if (event.request.method !== 'GET') {
				// Handle other requests such as POST here
				return;
			}
			let url = event.request.url.split("#")[0];
			let requestInit = indexedDB.open("tAppCache", 5);
			let db;
			function myFetch(page) {
				return new Promise((resolve, reject) => {
					fetch(page).then((response) => {
						resolve(response);
					}).catch(() => {
						resolve(new Response("", {
							status: 500,
							statusText: 'Service Unavailable',
							headers: new Headers({
								'Content-Type': 'text/html'
							})
						}));
					});
				});
			}
			requestInit.onupgradeneeded = function() {
				db = requestInit.result;
				if(!db.objectStoreNames.contains("cachedPages")) {
					db.createObjectStore("cachedPages");
				}
				if(!db.objectStoreNames.contains("offlineStorage")) {
					db.createObjectStore("offlineStorage");
				}
			}
			requestInit.onsuccess = async function() {
				db = requestInit.result;
				function setCachedPage(fullPath, value) {
					return new Promise((resolve, reject) => {
						let request = db.transaction(["cachedPages"], "readwrite").objectStore("cachedPages").put(value, fullPath);
						request.onerror = () => {
							reject("tAppError: Persistent caching is not available in this browser.");
						};
						request.onsuccess = () => {
							resolve(true);
						}
					});
				}
				function getCachedPage(fullPath) {
					return new Promise((resolve, reject) => {
						let request = db.transaction(["cachedPages"], "readwrite").objectStore("cachedPages").get(fullPath);
						request.onerror = (err) => {
							myFetch(url).then((response) => {
								resolve(response);
							});
						};
						request.onsuccess = () => {
							myFetch(url).then((response) => {
								if(response.status === 200) {
									response.text().then((text) => {
										setCachedPage(url, {
											data: text,
											cachedAt: new Date().getTime()
										});
									});
								}
							});
							if(request.result != null) {
								resolve(new Response(request.result.data, {
									status: 200,
									statusText: 'OK',
									headers: new Headers({
										'Content-Type': 'text/html'
									})
								}));
							} else {
								myFetch(url).then((response) => {
									resolve(response);
								});
							}
						};
					});
				}
				getCachedPage(url).then((response) => {
					resolve(response);
				});
			};
			requestInit.onerror = (err) => {
				myFetch(url).then((response) => {
					resolve(response);
				});
			}
		});
	})();
	event.respondWith(fetchResponse);
});

self.addEventListener("activate", function(event) {
	event.waitUntil(() => {
		
	});
});
