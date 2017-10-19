import core from 'pouchdb-core';
import idb from 'pouchdb-adapter-idb';
import http from 'pouchdb-adapter-http';
import replication from 'pouchdb-replication';
import find from 'pouchdb-find';

const PouchDB = core.plugin(idb).plugin(http).plugin(replication).plugin(find);

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
