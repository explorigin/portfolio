import { defineView, defineElement as el } from 'domvm';
import * as image from '../data/image.js';
import * as index from '../data/indexType.js';
import * as imageTag from '../context/manageImageTags.js';
import { ImageView } from './image.js';
import { AlbumView } from './album.js';
import { router, routeChanged } from '../services/router.js';
import { LiveArray } from '../utils/livearray.js';


const NAV_OPTIONS = {
    images: {
        selector: image.SELECTOR,
        title: 'Images'
    },
    albums: {
        selector: index.SELECTOR,
        title: 'Albums'
    }
};


function uploadImages(evt) {
    image.add(evt.currentTarget.files);
}

export function GalleryView(vm, model) {
    let data = null;
    let title = "";

    routeChanged.subscribe(function onRouteChange(router, route) {
        if (data) {
            data.cleanup();
        }
        const o = NAV_OPTIONS[route.name];
        data = LiveArray(db, o.selector);
        title = o.title;
        data.subscribe(() => vm.redraw());
    });

    return function(vm, model, key, opts) {
        if (!data || !data.ready()) {
            return el('h1', "Loading...");
        }

        const members = data();

        return el('.gallery', [
            el('input#fInput',
                {
                    type: "file",
                    multiple: true,
                    accept: "image/jpeg",
                    onchange: uploadImages
                }),
            el('a', { href: router.href('images') }, 'Images'),
            el('a', { href: router.href('albums') }, 'Albums'),
            el('h1', title),
            ...(
                title === 'Images'
                ? members.map(i => {
                    return defineView(ImageView, {
                        doc: i,
                        showTags: true,
                        addTag: imageTag.add,
                        remove: image.remove,
                        removeTag: imageTag.remove
                    },
                    i._id);
                })
                : members.map(a => {
                    return defineView(AlbumView, {
                        doc: a,
                        addTag: imageTag.add,
                        remove: imageTag.remove
                    },
                    a._id)
                })
            )
        ]);
    };
}
