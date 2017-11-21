import { defineView, defineElement as el } from 'domvm';

import { ImageType } from '../data/image.js';
import { FileType } from '../data/file.js';
import { pouchDocArrayHash, pouchDocHash } from '../utils/conversion.js';
import { ThumbnailView } from './thumbnail.js';
import { prop, computed, bundle } from 'frptools';

export function AlbumView(vm, params) {
    const model = prop({}, pouchDocHash)
    const images = prop([], pouchDocArrayHash);

    const id = computed(pouchDocHash, [model]);
    const members = computed(d => d.members, [model]);  // always update
    const title = computed(d => d.title, [model]);  // always update

    let laCleanup = null;

    id.subscribe(async () => {
        const la = await ImageType.find({
            _id: {$in: members()}
        }, true);

        function refresh() {
            images(la());
            vm.redraw();
        }

        if (laCleanup) {
            laCleanup();
        }

        laCleanup = la.subscribe(refresh);
        la.ready.subscribe(refresh)
    });

    function removeImageFromAlbum(image) {
        model().removeMember(image._id);
    }

    function removeAlbum() {
        model().delete();
    }

    function uploadImages(album, evt) {
        Promise.all(Array.from(evt.currentTarget.files).map(ImageType.upload))
        .then(images => {
            images.forEach(i => album.addMember(i._id));
        });
    }

    model(params.doc);

    return function(vm, params, key, opts) {
        model(params.doc);

        return el('.album', [
            el('h2', [
                title(),
                el('button', { onclick: removeAlbum }, 'X')
            ]),
            el('input#fInput',
                {
                    type: "file",
                    multiple: true,
                    accept: "image/jpeg",
                    onchange: [uploadImages, model()]
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
