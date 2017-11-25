import { createView, config } from './utils/domvm.js';

import * as styles from './app.css';
import { GalleryView } from './interface/gallery.js';
import { router } from './services/router.js';
import { streamConfig } from './utils/event.js';

import { EventEmitter } from 'events';

EventEmitter.defaultMaxListeners = 1000;  // https://github.com/pouchdb/pouchdb/issues/6123

config({ stream: streamConfig });

// Attach our root view to the DOM
createView(GalleryView, {}).mount(document.body);

// Start the router
router.start('home');
