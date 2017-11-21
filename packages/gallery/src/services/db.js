import core from 'pouchdb-core';
import idb from 'pouchdb-adapter-idb';
import http from 'pouchdb-adapter-http';
import replication from 'pouchdb-replication';
import find from 'pouchdb-find';

import { log, warn } from './console.js';
import { isObject } from '../utils/comparators.js';
import { LiveArray } from '../utils/livearray.js';
import { deepAssign } from '../utils/conversion.js';


export const PouchDB = core.plugin(idb)
                    .plugin(http)
                    .plugin(replication)
                    .plugin(find)
                    .plugin(PouchORM);

export class TypeSpec {
    constructor(props) {
        this._populateId(props);
        Object.assign(this, props);
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

        if (!cls.hasOwnProperty('validate')) {
            warn(`${cls.name} has no validation.`)
        }

        const instantiate = (doc) => new cls(doc);

        async function find(idOrSelector, live=false) {
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
                    : {_id: {$gt: `${prefix}_0`, $lt: `${prefix}_\ufff0`,}}
                )
            );
            if (live) {
                return LiveArray(_db, idOrSelector, instantiate);
            }
            return (await _db.find({ selector: idOrSelector })).docs.map(instantiate);
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

        Object.defineProperties(cls.prototype, {
            _name: { value: name },
            _prefix: { value: prefix },
            _db: { value: _db },
            _cls: { value: cls },
        });

        Object.defineProperties(cls, {
            getOrCreate: { value: getOrCreate },
            find: { value: find },
            delete: { value: _delete },
            db: { value: _db },
            name: { value: name },
        });

        return cls;
    };
}
