import { defineElement as el } from 'domvm';
import { prop, computed, bundle } from 'frptools';

import { ImageType } from '../data/image.js';
import { FileType } from '../data/file.js';
import { pouchDocComparator } from '../utils/comparators.js'


export function AttachmentImageView(vm, doc) {
    const model = bundle({
        _id: prop(doc._id),
        _rev: prop(doc._rev),
        sizes: prop(doc.sizes)
    });

    const blobURL = prop('');
    const imageURL = computed(
        (sizes, bURL) => bURL || sizes.thumbnail || sizes.full,
        [model.sizes, blobURL]
    );
    const _key = computed((id, rev) => id + rev, [model._id, model._rev]);

    async function loadImageFromBlob() {
        const options = ['thumbnail', 'full'].filter(o => model.sizes().hasOwnProperty(o));

        for (let attempt of options) {
            try {
                const data = await FileType.getFromURL(model.sizes()[attempt]);

                if (blobURL()) {
                    URL.revokeObjectURL(blobURL());
                }
                blobURL(URL.createObjectURL(data));
                return;
            } catch(err) {
                continue;
            }
        }
    }

    function cleanup() {
        redrawOff();
        URL.revokeObjectURL(blobURL());
    }

    const redrawOff = imageURL.subscribe(() => vm.redraw())

    return function render(vm, doc) {
        if (!pouchDocComparator(doc, {_id:model._id(), _rev:model._rev()})) {
            URL.revokeObjectURL(blobURL());
            blobURL('');
        }
        model(doc);

        return el('img',
            {
                src: imageURL(),
                onerror: loadImageFromBlob,
                _key: _key(),
                _hooks: {
                    didRemove: cleanup
                }
            }
        );
    }
}
