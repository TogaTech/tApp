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

#### Routes

#### Starting and Installing

#### Recap

### Views
Documentation is coming soon.

### General Method Documentation
Documentation is coming soon.

## Interoperability
The tApp framework is interoperable with other front-end web frameworks. In your configuration file routes, instead of using a tApp render function, you can call a function from another framework and have that framework either render to the DOM using a function within that framework or return a value that can be rendered through a tApp render function.