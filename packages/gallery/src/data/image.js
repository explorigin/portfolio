import ExifParser from 'exif-parser';

import { getDatabase, generateAttachmentUrl } from '../services/db.js';
import { log, error } from '../services/console.js';
import { sha256 } from '../utils/crypto.js';
import { blobToArrayBuffer, deepAssign } from '../utils/conversion.js';
import { Event, backgroundTask } from '../utils/event.js'


export const DB_NAME = 'gallery-images'
const db = getDatabase(DB_NAME);
const PROCESS_PREFIX = 'importing';

// Events
export const imported = new Event('Image.imported');

// Methods
export async function find(keys, options={}) {
    return await db.allDocs(Object.assign(
        { include_docs: true },
        options,
        { keys }
    ));
}

export async function add(imageFileList) {
    const docs = Array.prototype.map.call(imageFileList, f => ({
        _id: `${PROCESS_PREFIX}_${f.name}`,
        name: f.name,
        mimetype: f.type,
        size: f.size,
        modifiedDate: (new Date(f.lastModified)).toISOString(),
        uploadedDate: (new Date()).toISOString(),
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

export async function remove(ids, rev) {
    if (!Array.isArray(ids)) {
        try {
            const doc = rev ? { _id: ids, _rev: rev } : await db.get(ids)
            await db.remove(doc);
            return true;
        } catch (e) {
            if (e.status !== 404) {
                error(`Error removing Image ${_id}`, e);
            }
            return false;
        }
    }

    const docs = await find(ids);
    const result = await db.bulkDocs(docs.rows.map(r => (
        Object.assign(r.doc, { _deleted: true })
    )));
    return result.map(r => r.ok);
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
    const result = await db.allDocs({
        startkey: `${PROCESS_PREFIX}_0`,
        endkey: `${PROCESS_PREFIX}_z`,
        include_docs: true,
        attachments: true,
        binary: true,
        limit: 1,
    });

    if (!result.rows.length) {
        return;
    }

    const doc = result.rows[0].doc;
    const buffer = await blobToArrayBuffer(doc._attachments.image.data);
    const digest = await sha256(buffer);
    const exifData = ExifParser.create(buffer).parse();
    const { tags, imageSize } = exifData;
    const originalDate = new Date(
        tags.DateTimeOriginal
        ? (new Date(tags.DateTimeOriginal * 1000)).toISOString()
        : doc.modifiedDate
    );
    const { _id, _rev } = doc;
    const id = `image_${originalDate.getTime().toString(36)}_${digest.substr(0, 6)}`;

    let continueProcessing = true;
    try {
        const existingRecord = await find([id]);
        if (existingRecord.rows[0].doc.digest === digest) {
            continueProcessing = false;
        }
    } catch (e) {
        // Basically this means there are no existing records
    }

    if (continueProcessing) {
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
                    image: generateAttachmentUrl(DB_NAME, id, 'image'),
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
    } else {
        imported.fire(id, _id, false);
    }

    remove(_id, _rev);
    processImportables();
});

// Check if we have any unimported images.
processImportables();
