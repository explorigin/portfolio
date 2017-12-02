import { prop, computed } from 'frptools';

import { subscribeToRender, defineView, defineElement as el } from '../utils/domvm.js';

import { ImageType } from '../data/image.js';
import { pouchDocArrayHash, pouchDocHash } from '../utils/conversion.js';
import { ThumbnailTemplate } from './components/thumbnail.js';
import { AlbumTemplate } from './components/albumTemplate.js';
import { injectStyle, styled } from '../services/style.js';

export function uploadImages(evt, files) {
    Array.from(files || evt.currentTarget.files).forEach(ImageType.upload);

    if (evt.currentTarget) {
        evt.currentTarget.value = null;
    }
}

export function AllImagesView(vm, params, key, opts) {
    const model = prop({}, pouchDocHash)
    const images = prop([], pouchDocArrayHash);

    ImageType.find({
        ["sizes.thumbnail"]: {$exists: true}
    }, true).then(la => {
        opts.appbar.renderButtons(renderAppBarButtons);
        subscribeToRender(vm, [images], [la.subscribe(images)]);
    });

    function renderAppBarButtons() {
        return [
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
        ];
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

    return function() {
        return AlbumTemplate({
            title: 'Test',
            id: 1,
            photos: []
        });
    };
}
