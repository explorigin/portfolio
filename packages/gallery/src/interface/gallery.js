import { prop } from 'frptools';

import { defineView as vw, defineElement as el } from '../utils/domvm.js';
import { ImageType } from '../data/image.js';
import { AlbumType } from '../data/album.js';
import { ThumbnailTemplate } from './thumbnail.js';
import { AlbumView } from './album.js';
import { Dropzone } from './components/dropzone.js';
import { Overlay } from './components/overlay.js';
import { Icon } from './components/icon.js';
import { router, routeChanged } from '../services/router.js';
import { injectStyle, styled } from '../services/style.js';


export function GalleryView(vm) {
    const NAV_OPTIONS = {
        images: {
            data: ImageType.find({
                ["sizes.thumbnail"]: {$exists: true}
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

    function uploadImages(evt, files) {
        Array.from(files || evt.currentTarget.files).forEach(ImageType.upload);

        if (evt.currentTarget) {
            evt.currentTarget.value = null;
        }
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


    function renderWelcomePane() {
        return [
            Overlay([
                el('h1', "Hi")
            ])
        ];
    }

    function renderDropPane() {
        return [
            Overlay([
                Icon({
                    name: 'upload',
                    size: 4,
                }),
                el('h1', 'Drop pictures here to upload to your gallery'),
            ])
        ];
    }

    function renderMain() {
        return [
            header([
                el('div', { style: "font-size: 20pt" }, 'Gallery'),
                headerRight({
                    css: { visibility: /* selectMode */ true ? 'visible' : 'hidden' }
                }, [
                    el('button', [
                        el('label', {"for": 'uploadButton'}, "Upload"),
                    ]),
                    el('input', {
                        id: 'uploadButton',
                        name: 'uploadButton',
                        type: 'file',
                        multiple: true,
                        accept: '.png,.jpg,.jpeg', // no love for gifs yet
                        onchange: uploadImages,
                        class: injectStyle({display: 'none'})
                    })
                ])
            ]),
            ...(
                data().length
                ? data().map(i => {
                    return ThumbnailTemplate(i, deleteImage, i._hash())
                })
                : [
                    renderWelcomePane()
                ]
            )
        ];
    }

    return function render() {
        if (!data || !data.ready()) {
            return Overlay([el('h1', "Loading...")]);
        }

        return el('.gallery', { class: fill }, [
            vw(Dropzone, {
                className: fill,
                dropEffect: 'copy',
                ondrop: uploadImages,
                content: renderMain,
                hoverContent: renderDropPane
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

const fill = injectStyle({
    display: 'flex',
    flex: 1,
    flexDirection: 'column',
});
