export const PouchDB = require('pouchdb-core')
    .plugin(require('pouchdb-adapter-websql'))
    .plugin(require('pouchdb-adapter-idb'))
    .plugin(require('pouchdb-adapter-http'))
    .plugin(require('pouchdb-replication'));

export function generateAttachmentUrl(dbName, docId, attachmentKey) {
    return `/_doc_attachments/${dbName}/${docId}/${attachmentKey}`;
}
