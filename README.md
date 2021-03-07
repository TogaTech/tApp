# tApp
A framework for building tApps (TogaTech Apps) using modern web technologies (HTML, CSS, JavaScript)

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
Documentation is coming soon.

### Configuration File
Documentation is coming soon.

### Views
Documentation is coming soon.

### General Method Documentation
Documentation is coming soon.

## Interoperability
The tApp framework is interoperable with other front-end web frameworks. In your configuration file routes, instead of using a tApp render function, you can call a function from another framework and have that framework either render to the DOM using a function within that framework or return a value that can be rendered through a tApp render function.