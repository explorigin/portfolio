import { defineView as vw, defineElement as el } from 'domvm';
import { prop, computed } from 'frptools';

import * as image from '../data/image.js';
import { AttachmentImageView } from './attachmentImage.js';

export function ThumbnailView(vm, model) {
    const { addTag } = model;

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

        return el('div', {_key: id}, [
            el(
                `figure#${doc._id}.image`,
                {
                    onclick: {"img":[remove, id, rev]}
                },
                [
                    vw(AttachmentImageView, {
                        src: doc,
                        attachmentKey: 'thumbnail'
                    }),
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
    };
}
