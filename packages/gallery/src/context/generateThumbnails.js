import pica from 'pica/dist/pica';

import { FileType } from '../data/file.js';


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

export async function generateThumbnailForImage(doc) {
    if (doc.sizes.thumbnail) { return; }

    const attachment = (await FileType.getFromURL(doc.sizes.full))
    const mimetype = attachment.content_type || attachment.type;
    const { width, height } = maxLinearSize(doc.width, doc.height, 320);
    const resizedBlob = await resizeImage(attachment, mimetype, width, height);

    const thumbfile = await FileType.upload(resizedBlob);

    await doc.update({
        sizes: {
            thumbnail: FileType.getURL(thumbfile)
        }
    });
}
