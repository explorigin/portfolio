import { defineElement as el } from 'domvm';
import { prop, computed, bundle } from 'frptools';

import * as imageType from '../data/image.js';


export function AttachmentImageView(vm, params) {
    const model = bundle({
        doc: prop(params.src),
        attachmentKey: prop(params.attachmentKey || 'image')
    });

    const blobURL = prop('');

    const imageID = computed(
        doc => doc._id,
        [model.doc]
    );
    const imageURL = computed(
        (doc, key, bURL) => bURL || doc.attachmentUrls[key],
        [model.doc, model.attachmentKey, blobURL]
    );
    const imageSignature = computed(
        (id, key) => id + ' ' + key,
        [imageID, model.attachmentKey]
    );

    async function loadImageFromBlob() {
        const id = imageID();
        const key = model.attachmentKey();

        try {
            const data = await imageType.getAttachment(id, key);
            if (blobURL()) {
                URL.revokeObjectURL(blobURL());
            }
            blobURL(URL.createObjectURL(data));
        } catch(err) {
            // Probably hasn't created the thumbnail yet.
            console.log("Probably hasn't created the thumbnail yet.", err);
        }
    }

    function cleanup() {
        redrawOff();
        URL.revokeObjectURL(blobURL());
    }

    const redrawOff = imageURL.subscribe(() => vm.redraw())

    return function render(vm, params) {
        const imgSig = imageSignature();
        model(params);
        if (imgSig !== imageSignature()) {
            URL.revokeObjectURL(blobURL());
            blobURL('');
        }

        return el('img',
            {
                src: imageURL(),
                onerror: loadImageFromBlob,
                _key: imageSignature(),
                _hooks: {
                    didRemove: cleanup
                }
            }
        );
    }
}
