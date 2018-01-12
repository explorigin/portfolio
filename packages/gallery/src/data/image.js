import { PouchDB, TypeSpec } from '../services/db.js';
import { blobToArrayBuffer, deepAssign } from '../utils/conversion.js';
import { backgroundTask } from '../utils/event.js'
import { FileType } from './file.js';
import { error } from '../services/console.js';


class ImageSpec extends TypeSpec {
    static async upload(blob) {
        const f = await FileType.upload(blob, false);
        const doc = await ImageType.getOrCreate({
            digest: f.digest,
            originalDate: f.lastModified,
            importing: true,
            width: 0,
            height: 0,
            sizes: {
                full: FileType.getURL(f)
            }
        });
        processImportables(doc);
        return doc;
    };

    static getUniqueID(doc) {
        return doc.digest.substr(0, 16);
    }

    async delete(cascade=true) {
        if (cascade) {
            new Set(Object.keys(this.sizes)).forEach(async key => {
                const f = await FileType.getDocFromURL(this.sizes[key])
                f.delete();
            });
        }
        return await this.update({_deleted: true});
    }
    //
    // static validate(doc) {
    //     // TODO actually validate perhaps against a JSON schema
    //
    //     const schema = {
    //         originalDate: t.REQUIRED_DATE,
    //         digest: t.REQUIRED_STRING,
    //         width: t.INTEGER,
    //         height: t.INTEGER,
    //         sizes: {
    //             type: 'object',
    //             properties: {
    //                 full: t.REQUIRED_STRING,
    //                 thumbnail: t.STRING,
    //             }
    //         },
    //         orientation: t.INTEGER,
    //         make: t.STRING,
    //         model: t.STRING,
    //         flash: t.BOOLEAN,
    //         iso: t.INTEGER,
    //         gps: {
    //             type: 'object',
    //             properties: {
    //                 latitude: t.NUMBER,
    //                 longitude: t.NUMBER,
    //                 altitude: t.NUMBER,
    //                 heading: t.NUMBER,
    //             }
    //         },
    //         tags: {
    //             type: "object",
    //             additionalProperties: t.BOOLEAN
    //         }
    //     };
    // }
}

const processImportables = backgroundTask(async function _processImportables(image) {
    const { _id, _rev, sizes, digest } = image;
    const imageData = await FileType.getFromURL(sizes.full);

    const img = new Image();
    const imageProps = await new Promise(resolve => {
        img.onload = () => {
            resolve({width: img.width, height: img.height});
            URL.revokeObjectURL(img.src);
        }
        img.src = URL.createObjectURL(imageData);
    });


    if (new Set(['image/jpg', 'image/jpeg']).has(imageData.type)) {
        const ExifParser = await import('exif-parser');
        const buffer = await blobToArrayBuffer(imageData);

        const exifData = ExifParser.create(buffer).parse();
        const { tags } = exifData;
        const originalDate = new Date(
            tags.DateTimeOriginal
            ? (new Date(tags.DateTimeOriginal * 1000)).toISOString()
            : image.originalDate
        ).toISOString();

        deepAssign(imageProps, {
            originalDate,
            orientation: tags.Orientation,
            digest,
            make: tags.Make,
            model: tags.Model,
            flash: !!tags.Flash,
            iso: tags.ISO,
            sizes,
            gps: {
                latitude: tags.GPSLatitude,
                longitude: tags.GPSLongitude,
                altitude: tags.GPSAltitude,
                heading: tags.GPSImgDirection,
            }
        });
    }

    delete image.importing;
    image.update(imageProps);

    const module = await import('../context/generateThumbnails');
    module.generateThumbnailForImage(image);
}, false);

export const ImageType = PouchDB.registerType("Image", ImageSpec);

ImageType.index('originalDate', ['originalDate', 'id']);

ImageType.find({importing: true})
    .then(results => results.forEach(processImportables));
