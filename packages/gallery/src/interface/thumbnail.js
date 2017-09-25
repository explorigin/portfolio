import { defineElement as el } from 'domvm';

export function ThumbnailView(vm, model) {
    function onclick(evt) {
        model.remove(evt.currentTarget.dataset.id); // .then(refresh);
    }

    return function(vm, model, key, opts) {
        const { id, name, doc, tags } = model;
        const filteredTags = Object.entries(tags).filter(([_, visible]) => visible);

        return el(
            `figure#${id}.image`,
            [
                el('img',
                    {
                        src: `data:${doc.content_type};base64,${doc.data}`,
                        title: `${id} ${name}`,
                        "data-id": id,
                        onclick
                    }
                ),
                (
                    filteredTags.length
                    ? (
                        el('figcaption',
                            filteredTags.map(([title, _]) => el(
                                'span.tag',
                                { onclick: evt => model.removeTag(title, id) }, // .then(refresh)
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
