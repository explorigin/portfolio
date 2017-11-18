import * as image from '../data/image.js';
import * as index from '../data/indexType.js';
import { FileType } from '../data/file.js';
import * as imageTag from '../context/manageImageTags.js';
import { defineView as vw } from 'domvm';
import { ThumbnailView } from './thumbnail.js';
import { AlbumView } from './album.js';
import { router, routeChanged } from '../services/router.js';
import { styled, el } from '../services/style.js';
import { LiveArray } from '../utils/livearray.js';
import { Watcher } from '../utils/watcher.js';


export function GalleryView(vm, model) {
    const { db } = model;
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
        return el('.gallery', [
            header([
                el('div', { css: { fontSize: '20pt' } }, 'Gallery'),
                el('input#fInput',
                    {
                        type: "file",
                        multiple: true,
                        accept: "image/jpeg",
                        onchange: FileType.upload
                    }
                )
            ]),
            ...(
                (!data || !data.ready())
                ? [el('h1', "Loading...")]
                : [
                    el('a', { href: router.href('images') }, 'Images'),
                    el('a', { href: router.href('albums') }, 'Albums'),
                    el('h1', title),
                    ...(
                        title === 'Images'
                        ? data().map(i => {
                            return vw(ThumbnailView, {
                                doc: i,
                                showTags: true,
                                addTag: imageTag.add,
                                remove: image.remove,
                                removeTag: imageTag.remove
                            },
                            i._id + i._rev);
                        })
                        : data().map(a => {
                            return vw(AlbumView, {
                                doc: a,
                                db,
                                addTag: imageTag.add,
                                remove: imageTag.remove
                            },
                            a._id + a._rev)
                        })
                    )                ]
            )
        ]);
    };
}

const header = styled({
    justifyContent: 'space-between',
    padding: '1em',
    zIndex: 1,
    display: 'flex',
    alignItems: 'center',
});
