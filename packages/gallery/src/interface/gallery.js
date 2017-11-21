import { defineView as vw } from 'domvm';
import { ImageType } from '../data/image.js';
import { AlbumType } from '../data/album.js';
import { ThumbnailView } from './thumbnail.js';
import { AlbumView } from './album.js';
import { router, routeChanged } from '../services/router.js';
import { styled, el } from '../services/style.js';


export function GalleryView(vm, model) {
    const { db } = model;
    const NAV_OPTIONS = {
        images: {
            data: ImageType.find({
                importing: {$exists: false}
            }, true),
            title: 'Images'
        },
        albums: {
            data: AlbumType.find({}, true),
            title: 'Albums'
        }
    };

    let data = null;
    let laCleanup = null;
    let title = "";

    function uploadImages(evt) {
        Array.from(evt.currentTarget.files).forEach(ImageType.upload);
    }

    function deleteImage(i) {
        ImageType.delete(i._id);
    }

    function addAlbum() {
        const a = new AlbumType({
            title: prompt("Album Name"),
            members: []
        });
        a.save();
    }

    routeChanged.subscribe(function onRouteChange(router, route) {
        if (laCleanup) {
            laCleanup();
        }
        const o = NAV_OPTIONS[route.name];
        title = o.title;
        vm.redraw();

        return o.data.then(la => {
            data = la;
            laCleanup = data.subscribe(() => {
                vm.redraw()
            });
            data.ready.subscribe(() => vm.redraw);
        });
    });

    return function(vm, model, key, opts) {
        return el('.gallery', [
            header([
                el('div', { css: { fontSize: '20pt' } }, 'Gallery'),
                el('button', { onclick: addAlbum }, "Add Album"),
                el('input#fInput',
                    {
                        type: "file",
                        multiple: true,
                        accept: "image/jpeg",
                        onchange: uploadImages
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
                                // addTag: imageTag.add,
                                remove: deleteImage,
                                // removeTag: imageTag.remove
                            },
                            i._id + i._rev);
                        })
                        : data().map(a => {
                            return vw(AlbumView, {
                                doc: a,
                                // addTag: imageTag.add,
                                // remove: imageTag.remove
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
