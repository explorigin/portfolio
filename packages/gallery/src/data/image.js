import { PouchDB, TYPES as t } from '../services/db.js';
import { blobToArrayBuffer } from '../utils/conversion.js';
import { backgroundTask } from '../utils/event.js'
import { FileType } from './file.js';


export const ImageType = PouchDB.registerType({
    name: "Image",
    getUniqueID: doc => doc.digest.substr(0, 16),
    getSequence: doc => new Date(doc.originalDate).getTime(),
    // schema: {
    //     originalDate: t.REQUIRED_DATE,
    //     digest: t.REQUIRED_STRING,
    //     width: t.INTEGER,
    //     height: t.INTEGER,
    //     sizes: {
    //         type: 'object',
    //         properties: {
    //             full: t.REQUIRED_STRING,
    //             thumbnail: t.STRING,
    //         }
    //     },
    //     orientation: t.INTEGER,
    //     make: t.STRING,
    //     model: t.STRING,
    //     flash: t.BOOLEAN,
    //     iso: t.INTEGER,
    //     gps: {
    //         type: 'object',
    //         properties: {
    //             latitude: t.NUMBER,
    //             longitude: t.NUMBER,
    //             altitude: t.NUMBER,
    //             heading: t.NUMBER,
    //         }
    //     },
    //     tags: {
    //         type: "object",
    //         additionalProperties: t.BOOLEAN
    //     }
    // },
    methods: {
        upload: async function(blob) {
            const f = await FileType.upload(blob, false);
            return await ImageType.getOrCreate({
                digest: f.digest,
                originalDate: f.lastModified,
                importing: true,
                width: 0,
                height: 0,
                sizes: {
                    full: FileType.getURL(f)
                }
            });
        },
        processImportables: backgroundTask(async function _processImportables(importables) {
            if (!importables.length) { return; }

            const image = importables[0];
            const { _id, _rev } = image;
            const imageData = await FileType.getFromURL(image.sizes.full);

            const ExifParser = await import('exif-parser');

            const buffer = await blobToArrayBuffer(imageData);

            const exifData = ExifParser.create(buffer).parse();
            const { tags, imageSize } = exifData;
            const { width, height } = imageSize;
            const originalDate = new Date(
                tags.DateTimeOriginal
                ? (new Date(tags.DateTimeOriginal * 1000)).toISOString()
                : image.originalDate
            ).toISOString();

            const img = await ImageType.getOrCreate({
                originalDate,
                width,
                height,
                orientation: tags.Orientation,
                digest: image.digest,
                make: tags.Make,
                model: tags.Model,
                flash: !!tags.Flash,
                iso: tags.ISO,
                sizes: image.sizes,
                gps: {
                    latitude: tags.GPSLatitude,
                    longitude: tags.GPSLongitude,
                    altitude: tags.GPSAltitude,
                    heading: tags.GPSImgDirection,
                }
            });

            image.delete();

            const module = await import('../context/generateThumbnails');
            await module.generateThumbnailForImage(img);
        }, false)
    }
});

ImageType.find({importing: true}, true)
    .then(fw => fw.subscribe(ImageType.processImportables));
