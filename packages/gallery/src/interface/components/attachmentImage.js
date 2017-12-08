import { prop, computed, bundle } from 'frptools';

import { defineElement as el } from '../../utils/domvm.js';
import { ImageType } from '../../data/image.js';
import { FileType } from '../../data/file.js';
import { pouchDocHash } from '../../utils/conversion.js';
import { styled } from '../../services/style.js';
import { DEFAULT_TRANSITION } from '../styles.js';

const srcMap = new Map();

async function loadImageFromBlob(doc, evt, node, vm) {
    const { sizes, _id } = doc;
    const options = [
        'thumbnail',
        'preview',
        'full'
    ].filter(o => sizes.hasOwnProperty(o));

    for (let attempt of options) {
        try {
            const data = await FileType.getFromURL(sizes[attempt]);
            let src = evt.target.src;
            if (src.startsWith('blob:')) {
                URL.revokeObjectURL(src);
            }
            src = URL.createObjectURL(data);
            node.patch({ src });
            srcMap.set(_id, src);
            // node.data = attempt;
            break;
        } catch(err) {
            continue;
        }
    }
}


function cleanup(id, evt) {
    const { src } = evt.target;
    if (src.startsWith('blob:')) {
        URL.revokeObjectURL(s);
        srcMap.remove(id);
    }
}

export function AttachmentImageView(doc, props) {
    const { sizes, _id } = doc;
    const src = srcMap.get(_id) || sizes.thumbnail || sizes.preview || sizes.full;

    return image(Object.assign({
        src,
        onerror: [loadImageFromBlob, doc],
        _key: _id,
        _hooks: {
            didRemove: [cleanup, _id]
        }
    }, (props || {})));
}

const image = styled('img', DEFAULT_TRANSITION);
