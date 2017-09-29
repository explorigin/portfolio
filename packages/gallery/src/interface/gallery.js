import { defineView, defineElement as el } from 'domvm';
import * as image from '../data/image.js';
import * as imageTag from '../context/manageImageTags.js';
import { ImageView } from './image.js';
import { AlbumView } from './album.js';
import { router } from '../services/router.js';


export function GalleryView(vm, model) {
    function uploadImages(evt) {
        image.add(evt.currentTarget.files);
    }

    return function(vm, model, key, opts) {
        const { title, members } = model;

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
                        imageRow: i,
                        showTags: true,
                        addTag: imageTag.add,
                        remove: image.remove,
                        removeTag: imageTag.remove
                    },
                    i._id);
                })
                : members.map(a => {
                    return defineView(AlbumView, {
                        albumRow: a,
                        addTag: imageTag.add,
                        remove: imageTag.remove
                    },
                    a._id)
                })
            )
        ]);
    };
}
