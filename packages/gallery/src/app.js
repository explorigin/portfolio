// import { createView } from 'domvm/dist/dev/domvm.dev.js';
import { createView } from 'domvm/dist/micro/domvm.micro.js';

import * as styles from './app.css';
import { GalleryView } from './interface/gallery.js';
import { router } from './services/router.js';

import { EventEmitter } from 'events';

EventEmitter.defaultMaxListeners = 1000;  // https://github.com/pouchdb/pouchdb/issues/6123

// Attach our root view to the DOM
createView(GalleryView, {}).mount(document.querySelector('#app'));

// Start the router
router.start('home');
