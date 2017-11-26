import { defineView as vw, defineElement as el } from '../utils/domvm.js';
import { AttachmentImageView } from './components/attachmentImage.js';

export function ThumbnailTemplate(doc, remove, key) {
    return el('div', [
        el(`figure.image`, {
            onclick: {"img":[remove, doc]},
        }, [
            vw(AttachmentImageView, doc, key)
        ])
    ]);
}
