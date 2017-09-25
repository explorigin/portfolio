import { defineView, defineElement as el } from 'domvm';
import { ThumbnailView } from './thumbnail.js';


export function ImageView(vm, model) {
    return function(vm, model, key, opts) {
        const { imageRow, imageContainer, showTags, remove, removeTag } = model;
        const { thumbnail } = imageRow.doc._attachments;
        const _showTags = showTags !== undefined ? showTags : true;

        if (thumbnail) {
            return el('div', [
                defineView(ThumbnailView, {
                    id: imageRow.doc._id,
                    name: 'thumbnail',
                    doc: thumbnail,
                    tags: _showTags ? imageRow.doc.tags : [],
                    remove: remove,
                    removeTag: removeTag
                })
            ]);
        }

        return el('span');
    };
}
