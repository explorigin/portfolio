import { defineView, defineElement as el } from 'domvm';


export function ImageView(vm, model) {
    const { addTag } = model;

    function onAddTag(image_id) {
        addTag(prompt('Tag Name'), image_id);
    }

    return function(vm, model, key, opts) {
        const { imageRow, showTags, remove, addTag, removeTag } = model;
        const { doc } = imageRow;
        const { _id: id, _rev: rev, tags } = doc;
        const { thumbnail } = doc._attachments;
        const _showTags = showTags !== undefined ? showTags : true;
        const filteredTags = (
            _showTags
            ? Object.entries(doc.tags).filter(([_, visible]) => visible)
            : []
        );

        if (thumbnail) {
            return el('div', [
                el(
                    `figure#${doc._id}.image`,
                    [
                        el('img',
                            {
                                src: `data:${thumbnail.content_type};base64,${thumbnail.data}`,
                                title: `${id} ${name}`,
                                "data-id": id,
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
