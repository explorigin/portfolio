import { createView } from 'domvm/dist/dev/domvm.dev.js';

import * as image from './data/image.js';
import * as index from './data/indexType.js';
import { getDatabase } from './services/db.js';
import * as imageTag from './context/manageImageTags.js';
import generateThumbnails from './contextLoaders/generateThumbnails.js';
import { GalleryView } from './interface/gallery.js';
import { router, routeChanged } from './services/router.js';

window.db = getDatabase();

const NAV_OPTIONS = {
    images: {
        model: image,
        title: 'Images'
    },
    albums: {
        model: index,
        title: 'Albums'
    }
};

async function update(route) {
    const o = NAV_OPTIONS[route.name];
    gallery.update({
        title: o.title,
        members: (await o.model.find({ attachments: true })).rows
    });
}
function redraw() { update(router.current()); }
function onRouteChange(router, route) { update(route); }

image.watcher(generateThumbnails);
image.imported.subscribe(redraw);
image.removed.subscribe(redraw);
index.added.subscribe(redraw);
index.removed.subscribe(redraw);
routeChanged.subscribe(onRouteChange);

const gallery = createView(GalleryView, {
    title: "",
    members: []
}).mount(document.querySelector('#app'));

router.start('home');
