import { PouchDB, TYPES as t } from '../services/db.js';
import { log } from '../services/console.js';
import { sha256 } from '../utils/crypto.js';
import { blobToArrayBuffer } from '../utils/conversion.js';


export const FileType = PouchDB.registerType({
    name: "File",
    getUniqueID: doc => doc.digest.substr(0, 16),
    getSequence: doc => (
        new Date(doc.modifiedDate
            ? doc.modifiedDate
            : (new Date()).toISOString()
        ).getTime()
    ),
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
        upload: async function(fileListOrEvent) {
            const files = Array.from(
                fileListOrEvent instanceof Event
                ? fileListOrEvent.currentTarget.files
                : fileListOrEvent
            );
            return files.map(async f => {
                const digest = await sha256(await blobToArrayBuffer(f));
                const file = FileType.new({
                    name: f.name,
                    mimetype: f.type,
                    size: f.size,
                    modifiedDate: new Date(f.lastModified),
                    addDate: new Date(),
                    digest,
                    tags: {},
                    _attachments: {
                        data: {
                            content_type: f.type,
                            data: f
                        }
                    }
                });
                await file.save();
                return file;
            });
        }
    }
});
