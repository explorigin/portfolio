import pica from 'pica/dist/pica';

import { FileType } from '../data/file.js';

const THUMBNAIL_MAX_DIMENSION = 320;

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

    const { width, height } = maxLinearSize(doc.width, doc.height, THUMBNAIL_MAX_DIMENSION);

    if (width < doc.width && height < doc.height) {
        console.log('generating thumbnail');
        // Thumbnail would be smaller
        const attachment = (await FileType.getFromURL(doc.sizes.full));
        const mimetype = attachment.type;
        const resizedBlob = await resizeImage(attachment, mimetype, width, height);
        const thumbfile = await FileType.upload(resizedBlob);
        await doc.update({
            sizes: {
                thumbnail: FileType.getURL(thumbfile)
            }
        });
    } else {
        console.log('using original as thumbnail');
        // Thumbnail would be bigger so let's just use the original.
        await doc.update({
            sizes: {
                thumbnail: doc.sizes.full
            }
        });
    }
}
