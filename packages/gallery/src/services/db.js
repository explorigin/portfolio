import core from 'pouchdb-core';
import idb from 'pouchdb-adapter-idb';
import http from 'pouchdb-adapter-http';
import replication from 'pouchdb-replication';
import find from 'pouchdb-find';

import { log } from './console.js';
import { isObject } from '../utils/comparators.js';
import { LiveArray } from '../utils/livearray.js';
import { deepAssign } from '../utils/conversion.js';


export const PouchDB = core.plugin(idb)
                    .plugin(http)
                    .plugin(replication)
                    .plugin(find)
                    .plugin(PouchORM);

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
    const db = getDatabase();
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


export function PouchORM(PouchDB) {

    async function update(props, save=true) {
        deepAssign(this, props);
        if (save) {
            await this.save();
        } else {
            this.validate();
        }
        return this;
    }

    PouchDB.registerType = (opts) => {
        const { getUniqueID, getSequence, schema, name } = opts;
        const prefix = name.toLowerCase();
        const db = opts.db || new PouchDB(prefix);

        function populateId(doc) {
            if (!doc._id) {
                const sequence = getSequence ? getSequence(doc).toString(36) : '';
                doc._id = `${prefix}_${sequence}_${getUniqueID(doc)}`;
            }
            return doc;
        }

        function validate() {
            // FIXME
            return this;
        }

        async function save() {
            const { rev } = await db.put(this.validate());
            this._rev = rev;
            return this;
        }

        async function addAttachment(attName, dataBlob) {
            const { rev } = await db.putAttachment(
                this._id,
                attName,
                this._rev,
                dataBlob,
                dataBlob.type);

            this._rev = rev;
            return this;
        }

        async function getAttachment(attName) {
            return await db.getAttachment(this._id, attName);
        }

        async function removeAttachment(attName) {
            return await db.removeAttachment(this._id, attName, this._rev);
        }

        function instantiate(docOrResultSet) {
            Object.defineProperties(docOrResultSet, {
                update: { value: update.bind(docOrResultSet) },
                save: { value: save.bind(docOrResultSet) },
                delete: { value: _delete.bind(docOrResultSet) },
                addAttachment: { value: addAttachment.bind(docOrResultSet) },
                getAttachment: { value: getAttachment.bind(docOrResultSet) },
                removeAttachment: { value: removeAttachment.bind(docOrResultSet) },
                validate: { value: validate.bind(docOrResultSet) }
            });
            return docOrResultSet;
        }

        async function find(idOrQuery, live=false) {
            let results = [];

            if (typeof idOrQuery === 'string') {
                results = await db.get(idOrQuery);
            } else {
                const selector = Object.assign(
                    { _deleted: {exists: false} },
                    (
                        isObject(idOrQuery)
                        ? idOrQuery
                        : {_id: {$gt: `${prefix}_0`, $lt: `${prefix}_\ufff0`,}}
                    )
                );
                if (live) {
                    return LiveArray(db, idOrQuery, instantiate);
                }
                results = await db.find({ selector: idOrQuery });
            }

            return instantiate(results);
        }

        async function _delete() {
            return await this.update({_deleted: true});
        }

        async function _new(props, save=true) {
            const doc = instantiate(populateId(props));
            if (save) {
                await doc.save();
            }
            return doc;
        }

        async function getOrCreate(props) {
            let doc = await _new(props, false);
            try {
                await doc.save();
            } catch(e) {
                if (e.status !== 409) {
                    throw e;
                }
                doc = await find(doc._id);
            }
            return doc;
        }

        return Object.assign({
            new: _new,
            getOrCreate,
            find,
            prefix,
            db,
            // delete: // FIXME
        }, opts.methods || {});
    };
}

export const TYPES = {
    STRING: { type: 'string' },
    INTEGER: { type: 'integer' },
    BOOLEAN: { type: 'boolean' },
    DATE: { type: 'date' },
}

// Add required types
Object.keys(TYPES).forEach(k => {
    TYPES["REQUIRED_"+k] = Object.assign({ required: true }, TYPES[k]);
});
