import { defineView, defineElement as el } from 'domvm';
import { prop, computed } from 'frptools';

import * as image from '../data/image.js';

export function ImageView(vm, model) {
    const { addTag } = model;
    const imageData = prop(null);
    let imageId = null;

    function onAddTag(image_id) {
        addTag(prompt('Tag Name'), image_id);
    }

    return function(vm, model, key, opts) {
        const { doc, showTags, remove, removeTag } = model;
        const { _id: id, _rev: rev, tags } = doc;
        const _showTags = showTags !== undefined ? showTags : true;
        const filteredTags = (
            _showTags
            ? Object.entries(doc.tags).filter(([_, visible]) => visible)
            : []
        );
        if (imageId !== id) {
            image.getAttachment(id, "thumbnail")
            .then(thumbnail => {
                if (imageData()) {
                    URL.revokeObjectURL(imageData());
                }
                imageData(URL.createObjectURL(thumbnail));
                vm.redraw();
            }).catch(err => {
                // Probably hasn't created the thumbnail yet.
                console.log("Probably hasn't created the thumbnail yet.", err);
                imageId = null;
            });
            imageId = id;
        }

        if (imageData()) {
            return el('div', {_key: id}, [
                el(
                    `figure#${doc._id}.image`,
                    [
                        el('img',
                            {
                                src: imageData(),
                                title: `${id} ${name}`,
                                onclick: [remove, id, rev]
                            }
                        ),
                        (
                            filteredTags.length
                            ? (
                                el('figcaption',
                                    filteredTags.map(([title, _]) => el(
                                        'span.tag',
                                        { onclick: [removeTag, title, id] },
                                        [ title ]
                                    ))
                                )
                            )
                            : null
                        )
                    ]
                ),
                (
                    addTag
                    ? el('button', { onclick: [onAddTag, id] }, '+')
                    : null
                )
            ]);
        }

        return el('span');
    };
}
