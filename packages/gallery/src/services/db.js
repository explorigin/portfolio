import core from 'pouchdb-core';
import idb from 'pouchdb-adapter-idb';
import http from 'pouchdb-adapter-http';
import replication from 'pouchdb-replication';
import find from 'pouchdb-find';

import { log, warn } from './console.js';
import { isObject } from '../utils/comparators.js';
import { LiveArray } from '../utils/livearray.js';
import { Watcher } from '../utils/watcher.js';
import { deepAssign, pouchDocHash } from '../utils/conversion.js';


export const PouchDB = core.plugin(idb)
                    .plugin(http)
                    .plugin(replication)
                    .plugin(find)
                    .plugin(PouchORM);

export class TypeSpec {
    constructor(props) {
        this._populateId(props);
        Object.assign(this, { $links: {} }, props, { type: this._prefix });
    }

    static getSequence(doc) { return ''; }

    static getUniqueID(doc) { throw "NotImplemented"; }

    static validate(doc) { }

    instantiate(doc) {
        return new this._cls(docs);
    }

    _populateId(doc) {
        if (!doc._id) {
            doc._id = `${this._prefix}_${this._cls.getSequence(doc)}_${this._cls.getUniqueID(doc)}`;
        }
        return doc;
    }

    _hash() {
        return pouchDocHash(this);
    }

    async delete() {
        return await this.update({_deleted: true});
    }

    async save() {
        this._cls.validate(this);
        const { rev } = await this._db.put(this);
        this._rev = rev;
        return this;
    }

    async addAttachment(attName, dataBlob) {
        const { rev } = await this._db.putAttachment(
            this._id,
            attName,
            this._rev,
            dataBlob,
            dataBlob.type);

        this._rev = rev;
        return this;
    }

    async getAttachment(attName) {
        return await this._db.getAttachment(this._id, attName);
    }

    async removeAttachment(attName) {
        return await this._db.removeAttachment(this._id, attName, this._rev);
    }

    async update(props, save=true) {
        deepAssign(this, props);
        if (save) {
            await this.save();
        }
        return this;
    }
}

export function PouchORM(PouchDB) {
    PouchDB.registerType = (name, cls, db) => {
        const prefix = name.toLowerCase();
        const _db = db || PouchDB(prefix);
        _db.setMaxListeners(1000);
        const _baseSelector = Object.freeze({
            _id: {$gt: `${prefix}_0`, $lt: `${prefix}_\ufff0`,}
        });
        const watch = Watcher(_db, _baseSelector, { include_docs: true });

        if (!cls.hasOwnProperty('validate')) {
            warn(`${cls.name} has no validation.`)
        }

        const instantiate = (doc) => new cls(doc);

        async function find(idOrSelector, opts={}) {
            if (typeof idOrSelector === 'string') {
                return instantiate(await _db.get(idOrSelector));
            }

            const isSelector = isObject(idOrSelector);

            const selector = Object.assign(
                (
                    isSelector && idOrSelector._deleted
                    ? { _deleted: true }
                    : { _deleted: {exists: false} }
                ),
                (
                    isSelector
                    ? idOrSelector
                    : _baseSelector
                )
            );
            if (opts.live) {
                opts.mapper = instantiate;
                return LiveArray(_db, idOrSelector, opts);
            }
            return (await _db.find(Object.assign({ selector: idOrSelector }, opts))).docs.map(instantiate);
        }

        async function getOrCreate(props) {
            let doc = await new cls(props);
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

        async function _delete(id) {
            try {
                const doc = await find(id);
                doc._deleted = true;
                await _db.put(doc);
            } catch(e) {
                if (e.status !== 404) {
                    throw e;
                }
            }
        }

        async function next(key, previous=false, limit=1, inclusive=false) {
            const res = await _db.allDocs({
                startkey: key,
                descending: previous,
                sort: ['id'],
                skip: inclusive ? 0 : 1,
                limit
            });
            return res.rows;
        }

        Object.defineProperties(cls.prototype, {
            _name: { value: name },
            _prefix: { value: prefix },
            _db: { value: _db },
            _cls: { value: cls },
            _baseSelector: { value: _baseSelector }
        });

        Object.defineProperties(cls, {
            getOrCreate: { value: getOrCreate },
            find: { value: find },
            next: { value: next },
            delete: { value: _delete },
            subscribe: { value: watch },
            db: { value: _db },
            name: { value: name },
            prefix: { value: prefix },
            selector: { value: _baseSelector }
        });

        return cls;
    };
}
