import { defineView, defineElement as el } from 'domvm';
import { ThumbnailView } from './thumbnail.js';


export function ImageView(vm, model) {
    const { addTag } = model;

    function onAddTag(image_id) {
        addTag(prompt('Tag Name'), image_id);
    }

    return function(vm, model, key, opts) {
        const { imageRow, showTags, remove, addTag, removeTag } = model;
        const { doc } = imageRow;
        const { thumbnail } = doc._attachments;
        const _showTags = showTags !== undefined ? showTags : true;

        if (thumbnail) {
            return el('div', [
                defineView(ThumbnailView, {
                    id: doc._id,
                    rev: doc._rev,
                    name: 'thumbnail',
                    doc: thumbnail,
                    tags: _showTags ? doc.tags : [],
                    remove: remove,
                    removeTag: removeTag
                }),
                (
                    addTag
                    ? el('button', { onclick: [onAddTag, doc._id] }, '+')
                    : null
                )

            ]);
        }

        return el('span');
    };
}
