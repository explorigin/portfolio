// import { createView } from 'domvm/dist/dev/domvm.dev.js';
import { createView } from 'domvm/dist/full/domvm.full.js';

import * as image from './data/image.js';
import generateThumbnails from './contextLoaders/generateThumbnails.js';
import { GalleryView } from './interface/gallery.js';
import { router } from './services/router.js';

import { getDatabase } from './services/db.js';
import { EventEmitter } from 'events';

EventEmitter.defaultMaxListeners = 1000;  // https://github.com/pouchdb/pouchdb/issues/6123
window.db = getDatabase();

// Watch for new images, generate thumbnails if they need them.
image.watcher(generateThumbnails);

// Attach our root view to the DOM
createView(GalleryView, {}).mount(document.querySelector('#app'));

// Start the router
router.start('home');
