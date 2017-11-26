import { prop, computed, bundle } from 'frptools';

import { defineElement as el } from '../../utils/domvm.js';
import { ImageType } from '../../data/image.js';
import { FileType } from '../../data/file.js';
import { pouchDocHash } from '../../utils/conversion.js';


export function AttachmentImageView(vm, image) {
    const model = prop(image, pouchDocHash)
    const id = computed(pouchDocHash, [model]);
    const sizes = computed(d => d.sizes, [model]);  // always update

    const blobURL = prop('');
    const imageURL = computed(
        (sizes, bURL) => bURL || sizes.thumbnail || sizes.full,
        [sizes, blobURL]
    );

    model.subscribe(() => {
        if (blobURL()) {
            URL.revokeObjectURL(blobURL());
            blobURL('');
        }
    })

    async function loadImageFromBlob() {
        const options = ['thumbnail', 'full'].filter(o => sizes().hasOwnProperty(o));

        for (let attempt of options) {
            try {
                const data = await FileType.getFromURL(sizes()[attempt]);

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
        URL.revokeObjectURL(blobURL());
    }

    return function render(vm, doc) {
        return el('img',
            {
                src: imageURL,
                onerror: loadImageFromBlob,
                _key: id(),
                _hooks: {
                    didRemove: cleanup
                }
            }
        );
    }
}
