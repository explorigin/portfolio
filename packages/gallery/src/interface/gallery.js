import { prop } from 'frptools';

import { defineView as vw, defineElement as el } from '../utils/domvm.js';
import { ImageType } from '../data/image.js';
import { AlbumType } from '../data/album.js';
import { ThumbnailTemplate } from './thumbnail.js';
import { AlbumView } from './album.js';
import { Dropzone } from './components/dropzone.js';
import { router, routeChanged } from '../services/router.js';
import { injectStyle, styled } from '../services/style.js';


export function GalleryView(vm, model) {
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
    const title = prop('');

    function uploadImages(files) {
        Array.from(files).forEach(ImageType.upload);
    }

    function deleteImage(i) {
        ImageType.delete(i._id);
    }

    function addAlbum() {
        const albumName = prompt("Album Name");
        if (albumName && albumName.trim()) {
            const a = new AlbumType({
                title: albumName.trim(),
                count: 0
            });
            a.save();
        }
    }

    routeChanged.subscribe(function onRouteChange(router, route) {
        if (laCleanup) {
            laCleanup();
        }
        const o = NAV_OPTIONS[route.name];
        title(o.title);

        return o.data.then(la => {
            data = la;
            laCleanup = data.subscribe(() => {
                vm.redraw()
            });
        });
    });

    function renderDropzone() {
        return [
            el('a', { href: router.href('images') }, 'Images'),
            el('a', { href: router.href('albums') }, 'Albums'),
            el('h1', title),
            ...(
                title() === 'Images'
                ? data().map(i => {
                    return ThumbnailTemplate(i, deleteImage, i._hash())
                })
                : data().map(a => {
                    return vw(AlbumView, a, a._hash())
                })
            )
        ];
    }

    return function render(vm, params, key, opts) {
        if (!data || !data.ready()) {
            return el('h1', "Loading...");
        }

        return el('.gallery', { class: slate }, [
            header([
                el('div', { style: "font-size: 20pt" }, 'Gallery'),
                headerRight({
                    css: { visibility: /* selectMode */ true ? 'visible' : 'hidden' }
                }, [
                    el('button', { onclick: addAlbum }, "Add Album")
                ])
            ]),
            vw(Dropzone, {
                className: slate,
                activeClassName: 'dropHover',
                ondrop: uploadImages,
                type: "file",
                multiple: true,  // FIXME - these don't carry through to the input tag
                accept: "image/jpeg",
                children: renderDropzone
            }, 'dz')
        ]);
    }
}

const header = styled({
    justifyContent: 'space-between',
    padding: '1em',
    zIndex: 1,
    display: 'flex',
    alignItems: 'center',
});

const headerRight = styled({
    display: 'flex',
    alignItems: 'center'
});

const slate = injectStyle({
    display: 'flex',
    flex: 1,
    flexDirection: 'column',
    // overflow: 'hidden',
});
