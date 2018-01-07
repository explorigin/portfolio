import { createView, config } from './utils/domvm.js';

import * as styles from './app.css';
import { GalleryView } from './interface/gallery.js';
import { router } from './services/router.js';
import { streamConfig } from './utils/event.js';
import { log } from './services/console.js';


config({ stream: streamConfig });

function go() {
	// Attach our root view to the DOM
	createView(GalleryView, {}).mount(document.body);

	// Start the router
	router.start('home');
}

if ('serviceWorker' in navigator && window.top === window) {
	navigator.serviceWorker.register('/assets/sw.bundle.js', { scope: '/' }).then(go).catch(go);
} else {
	go();
}
