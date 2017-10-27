import { getDatabase, generateAttachmentUrl } from '../services/db.js';
import { log, error } from '../services/console.js';
import { sha256 } from '../utils/crypto.js';
import { blobToArrayBuffer, deepAssign } from '../utils/conversion.js';
import { Event, backgroundTask } from '../utils/event.js'
import { Watcher } from '../utils/watcher.js';



const db = getDatabase();
const PROCESS_PREFIX = 'importing';
const PREFIX = 'image';
const SELECTOR = {
    _id: {
        $gt:`${PREFIX}_`,
        $lt:`${PREFIX}_\ufff0`,
    }
};
const IMPORT_SELECTOR = {
    _id: {
        $gt:`${PROCESS_PREFIX}_`,
        $lt:`${PROCESS_PREFIX}_\ufff0`,
    }
};

// Events
export const imported = new Event('Image.imported');
export const removed = new Event('Image.removed');

// Watchers
export const watcher = Watcher(db, SELECTOR);

// Methods
const getId = (id) => id.startsWith(PREFIX) ? id : `${PREFIX}_${id}`;

export async function find(keys, options={}) {
    let opts = { include_docs: true };
    if (Array.isArray(keys)) {
        Object.assign(opts, options);
        opts.keys = keys.map(getId);
    } else {
        Object.assign(opts, keys);
        opts.startkey =`${PREFIX}_0`;
        opts.endkey =`${PREFIX}_\ufff0`;
    }
    return await db.allDocs(opts);
}

export async function add(imageFileList) {
    const docs = Array.prototype.map.call(imageFileList, f => ({
        _id: `${PROCESS_PREFIX}_${f.name}`,
        name: f.name,
        mimetype: f.type,
        size: f.size,
        modifiedDate: (new Date(f.lastModified)).toISOString(),
        uploadedDate: (new Date()).toISOString(),
        tags: {},
        _attachments: {
            image: {
                content_type: f.type,
                data: f,
            }
        }
    }));
    const results = await db.bulkDocs(docs);

    processImportables();

    return docs.filter((d, i) => results[i].ok);
}

export async function remove(ids) {
    const docs = await find(Array.isArray(ids) ? ids : [ids]);
    const foundDocs = docs.rows.filter(r => !r.error);
    const result = await db.bulkDocs(foundDocs.map(r => (
        Object.assign(r.doc, { _deleted: true })
    )));
    foundDocs.filter((_, i) => result[i].ok).map(r => removed.fire(r.doc));
    return result.reduce((a, r) => a && r.ok, true);
}

export async function update(id, properties) {
    const results = await find([id]);
    const doc = results.rows[0].doc;

    deepAssign(doc, properties);

    await db.put(doc);
    return doc;
}

export async function addAttachment(doc, key, blob) {
    return db.putAttachment(doc._id, key, doc._rev, blob, blob.type);
}

// Internal Functions
const processImportables = backgroundTask(async function _processImportables() {
    const result = await db.find({
        selector: IMPORT_SELECTOR,
        limit: 1,
    });

    if (!result.docs.length) {
        return;
    }

    const doc = result.docs[0];
    const { _id, _rev } = doc;
    const imageData = await db.getAttachment(_id, "image")

    const ExifParser = await import('exif-parser');

    const buffer = await blobToArrayBuffer(imageData);
    const digest = await sha256(buffer);

    // Check if this image already exists
    // TODO - Create an image.digest index
    const digestQuery = await db.find({
        selector: { digest },
        fields: ["_id"],
        limit: 1,
    });

    if (digestQuery.docs.length) {
        imported.fire(digestQuery.docs[0]._id, _id, false);
    } else {
        const exifData = ExifParser.create(buffer).parse();
        const { tags, imageSize } = exifData;
        const originalDate = new Date(
            tags.DateTimeOriginal
            ? (new Date(tags.DateTimeOriginal * 1000)).toISOString()
            : doc.modifiedDate
        );
        const id = `${PREFIX}_${originalDate.getTime().toString(36)}_${digest.substr(0, 6)}`;

        const newDoc = Object.assign(
            {},
            doc,
            {
                _id: id,
                originalDate: originalDate.toISOString(),
                orientation: tags.Orientation,
                digest,
                make: tags.Make,
                model: tags.Model,
                flash: !!tags.Flash,
                ISO: tags.ISO,
                attachmentUrls: {
                    image: generateAttachmentUrl(db.name, id, 'image'),
                },
                gps: {
                    latitude: tags.GPSLatitude,
                    longitude: tags.GPSLongitude,
                    altitude: tags.GPSAltitude,
                    heading: tags.GPSImgDirection,
                }
            },
            imageSize // width & height
        );
        delete newDoc._rev; // assigned from doc but not desired.

        try {
            await db.put(newDoc);
            imported.fire(id, _id, true);
        } catch (e) {
            error(`Error processing Image ${id}`, e);
        }
    }

    await db.remove({ _id, _rev });
    processImportables();
});
