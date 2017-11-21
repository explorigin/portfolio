import { PouchDB, TypeSpec } from '../services/db.js';
import { sha256 } from '../utils/crypto.js';
import { blobToArrayBuffer } from '../utils/conversion.js';

class FileSpec extends TypeSpec {
    static getUniqueID(doc) {
        return doc.digest.substr(0, 16);
    }

    static getURL(doc, attachmentName='data') {
        const end = attachmentName ? '/' + attachmentName : ''
        return `/${doc._prefix}/${doc._id}` + end;
    }

    static async getDocFromURL(path) {
        if (path.endsWith('/')) {
            path = path.substr(0, path.length - 1);
        }
        const [_, db, id, attname] = path.split('/');
        return await FileType.find(id);
    }

    static async getFromURL(path) {
        if (path.endsWith('/')) {
            path = path.substr(0, path.length - 1);
        }
        const [_, db, id, attname] = path.split('/');
        const doc = await FileType.find(id);
        if (attname) {
            return await doc.getAttachment(attname);
        }
        return doc;
    }

    static async upload(blob) {
        const digest = await sha256(await blobToArrayBuffer(blob));
        const lastModified = blob.lastModified ? new Date(blob.lastModified) : new Date();
        return await FileType.getOrCreate({
            name: blob.name,
            mimetype: blob.type,
            size: blob.size,
            lastModified: lastModified.toISOString(),
            addDate: new Date().toISOString(),
            digest,
            tags: {},
            _attachments: {
                data: {
                    content_type: blob.type,
                    data: blob
                }
            }
        });
    }
    //
    // static validate(doc) {
    //     // TODO actually validate perhaps against a JSON schema
    //
    //     const schema = {
    //         name: t.REQUIRED_STRING,
    //         mimetype: t.REQUIRED_STRING,
    //         digest: t.REQUIRED_STRING,
    //         size: t.INTEGER,
    //         modifiedDate: t.DATE,
    //         addDate: t.DATE,
    //         hasData: t.REQUIRED_BOOLEAN,
    //         tags: {
    //             type: "object",
    //             additionalProperties: t.BOOLEAN
    //         }
    //     };
    // }
}

export const FileType = PouchDB.registerType("File", FileSpec);
