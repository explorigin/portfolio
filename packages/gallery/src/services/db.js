const PouchDB = require('pouchdb-core')
    .plugin(require('pouchdb-adapter-websql'))
    .plugin(require('pouchdb-adapter-idb'))
    .plugin(require('pouchdb-adapter-http'))
    .plugin(require('pouchdb-replication'));

export function generateAttachmentUrl(dbName, docId, attachmentKey) {
    return `/_doc_attachments/${dbName}/${docId}/${attachmentKey}`;
}

const dbs = new Map();
export function getDatabase(name='gallery') {
    if (!dbs.has(name)) {
        dbs.set(name, new PouchDB(name));
    }
    return dbs.get(name);
}

export async function getOrCreate(doc) {
    try {
        const results = await db.get(doc._id)
        return [results, false];
    } catch (e) {
        if (e.status === 404) {
            const results = db.put(doc);
            return [results, true];
        }
        throw e;
    }
}