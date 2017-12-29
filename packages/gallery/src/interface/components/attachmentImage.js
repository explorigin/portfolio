import { prop, computed, bundle } from 'frptools';

import { defineElement as el } from '../../utils/domvm.js';
import { ImageType } from '../../data/image.js';
import { FileType } from '../../data/file.js';
import { pouchDocHash } from '../../utils/conversion.js';
import { styled } from '../../services/style.js';
import { DEFAULT_TRANSITION } from '../styles.js';

const srcMap = new Map();

async function loadImageFromBlob(srcUrl, evt, node, vm) {
    try {
        const src = URL.createObjectURL(await FileType.getFromURL(srcUrl));
        node.patch({ src });
        srcMap.set(srcUrl, src);
    } catch (e) {
        // src is not a saved file source
    }
}

function cleanup(node) {
    const { src } = node.el;
    if (src.startsWith('blob:') && srcMap.has(node.key)) {
        URL.revokeObjectURL(src);
        srcMap.delete(node.key);
    }
}

export function AttachmentImageView(props) {
    const { src } = props;
    const cachedSrc = srcMap.get(src)
    const _src = cachedSrc || src;
    delete props.src;

    return image(Object.assign({
        src: _src,
        onerror: (!cachedSrc ? [loadImageFromBlob, _src] : null),
        _hooks: {
            willRemove: cleanup
        }
    }, (props || {})));
}

const image = styled('img', DEFAULT_TRANSITION);
