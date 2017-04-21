import pica from 'pica/dist/pica';

import { generateAttachmentUrl, getDatabase } from '../services/db.js'
import { imported, find, update, addAttachment } from '../data/image.js';


export function maxLinearSize(width, height, max) {
    const ratio = width / height;
    if (width > height) {
        return {
            width: max,
            height: max / ratio
        };
    }
    return {
        width: max * ratio,
        height: max
    };
}

async function getLoadedImage(src) {
    return new Promise((resolve) => {
        const i = new Image('image');
        i.onload = () => resolve(i);
        i.src = src;
    });
}

async function resizeImage(imageBlob, mimetype, width, height) {
    const url = URL.createObjectURL(imageBlob);
    const $img = await getLoadedImage(url);
    const $destinationCanvas = document.createElement('canvas');

    $destinationCanvas.width = width;
    $destinationCanvas.height = height;

    const afterResize = (resolve, reject) => (err) => {
        if (err) { return reject(err); }
        $destinationCanvas.toBlob(resolve, mimetype);
    };

    return new Promise((resolve, reject) => {
        pica.resizeCanvas($img, $destinationCanvas, {}, afterResize(resolve, reject));
    });
}

export async function generateThumbnailForImage(id) {
    const results = await find([id], { attachments: true, binary: true });
    const doc = results.rows[0].doc;

    if (doc.attachmentUrls.thumbnail && doc._attachments.thumbnail) {
        return;
    }

    const attachment = doc._attachments.image;
    const mimetype = attachment.content_type;
    const { width, height } = maxLinearSize(doc.width, doc.height, 320);
    const resizedBlob = await resizeImage(attachment.data, mimetype, width, height);
    const url = generateAttachmentUrl(getDatabase().name, id, 'thumbnail');

    await addAttachment(doc, 'thumbnail', resizedBlob)
    await update(
        doc._id,
        {
            attachmentUrls: {
                thumbnail: url
            },
        }
    );

    return resizedBlob;
}


export const invoke = generateThumbnailForImage;
