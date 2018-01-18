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

const url = `https://${location.host}${location.pathname}${location.hash}`;
const msg = `This photo gallery will not work properly unless accessed securely.  Connect to ${url} instead?`;

// We use subtleCrypto which is only available from secure domains and localhost.
if (location.protocol !== 'https:' && (!crypto.subtle || !crypto.subtle.digest) && confirm(msg)) {
	location.assign(url);
} else if ('serviceWorker' in navigator && window.top === window) {
	navigator.serviceWorker.register('/assets/sw.bundle.js', { scope: '/' }).then(go).catch(go);
} else {
	go();
}
