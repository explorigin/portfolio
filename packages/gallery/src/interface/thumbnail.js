import { defineElement as el } from 'domvm';


export function ThumbnailView(vm, model) {
    return function(vm, model, key, opts) {
        const { id, rev, name, doc, tags, remove, removeTag } = model;
        const filteredTags = Object.entries(tags).filter(([_, visible]) => visible);

        return el(
            `figure#${id}.image`,
            [
                el('img',
                    {
                        src: `data:${doc.content_type};base64,${doc.data}`,
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
        );
    };
}
