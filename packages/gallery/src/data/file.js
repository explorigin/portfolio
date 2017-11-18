import { PouchDB, TYPES as t } from '../services/db.js';
import { log } from '../services/console.js';
import { sha256 } from '../utils/crypto.js';
import { blobToArrayBuffer } from '../utils/conversion.js';


export const FileType = PouchDB.registerType({
    name: "File",
    getUniqueID: doc => doc.digest.substr(0, 16),
    // schema: {
    //     name: t.REQUIRED_STRING,
    //     mimetype: t.REQUIRED_STRING,
    //     digest: t.REQUIRED_STRING,
    //     size: t.INTEGER,
    //     modifiedDate: t.DATE,
    //     addDate: t.DATE,
    //     hasData: t.REQUIRED_BOOLEAN,
    //     tags: {
    //         type: "object",
    //         additionalProperties: t.BOOLEAN
    //     }
    // },
    methods: {
        getURL: doc => `/${FileType.prefix}/${doc._id}/data`,
        getFromURL: async path => {
            if (path.endsWith('/')) {
                path = path.substr(0, path.length - 1);
            }
            const [_, db, id, attname] = path.split('/');
            const doc = await FileType.find(id);
            return await doc.getAttachment(attname);
        },
        upload: async function(blob) {
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
    }
});
