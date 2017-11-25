import { defineView, defineElement as el } from '../utils/domvm.js';

import { ImageType } from '../data/image.js';
import { FileType } from '../data/file.js';
import { pouchDocArrayHash, pouchDocHash } from '../utils/conversion.js';
import { ThumbnailView } from './thumbnail.js';
import { prop, computed } from 'frptools';

export function AlbumView(vm, doc) {
    const model = prop({}, pouchDocHash)
    const images = prop([], pouchDocArrayHash);

    const id = computed(pouchDocHash, [model]);
    const members = computed(d => d.members, [model]);  // always update
    const title = computed(d => d.title, [model]);  // always update

    let laCleanup = null;
    const refresh = _ => vm.redraw();
    const subscriptions = [
        images.subscribe(refresh),
        model.subscribe(async album => {
            if (!album.findImages) { return; }
            const imagesLiveArray = await album.findImages(true);

            if (laCleanup) { laCleanup(); }

            function refresh() {
                images(imagesLiveArray());
                vm.redraw();
            }

            laCleanup = imagesLiveArray.subscribe(refresh);
            imagesLiveArray.ready.subscribe(refresh)
        })
    ];

    function removeImageFromAlbum(image) {
        model().removeImage(image);
    }

    function removeAlbum(album) {
        album.delete();
    }

    function uploadImages(album, evt) {
        Array.from(evt.currentTarget.files).forEach(f => album.addImageBlob(f));
    }

    function cleanup() {
        if (laCleanup) { laCleanup(); }
        subscriptions.forEach(s => s());
    }

    model(doc);

    return function(vm, album, key, opts) {
        return el('.album', [
            el('h2', title),
            el('button', { onclick: [removeAlbum, album] }, 'X'),
            el('input#fInput',
                {
                    type: "file",
                    multiple: true,
                    accept: "image/jpeg",
                    onchange: [uploadImages, album]
                }
            ),
            ...images().map(i => {
                return defineView(ThumbnailView, {
                    doc: i,
                    showTags: false,
                    remove: removeImageFromAlbum,
                }, id())
            })
        ]);
    };
}
