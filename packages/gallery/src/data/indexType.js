import { log, error } from '../services/console.js';
import { getDatabase, getOrCreate } from '../services/db.js';
import { Event } from '../utils/event.js'


const db = getDatabase();
const PREFIX = 'index';

// Events
export const added = new Event('Index.added');
export const removed = new Event('Index.removed');

// Methods
export const hashString = name => name.trim().replace(/[ \-~!@#$%^&]/g, '_').toLowerCase();
const getId = (id) => id.startsWith(PREFIX) ? id : `${PREFIX}_${hashString(id)}`;

export async function find(keys, options={}) {
    let opts = { include_docs: true };
    if (Array.isArray(keys)) {
        Object.assign(opts, options);
        opts.keys = keys.map(getId);
    } else {
        Object.assign(opts, keys);
        opts.startkey =`${PREFIX}_`;
        opts.endkey =`${PREFIX}_\ufff0`;
    }
    return await db.allDocs(opts);
}

export async function add(id, props={}, members=[]) {
    const _id = getId(id);
    const [results, created] = await getOrCreate({
        _id,
        props,
        members: []
    });

    if (members.length) {
        members.forEach(async m => await addMember(_id, m));
    }

    return created || results.ok;
}

export async function addMember(id, member) {
    const results = await find([id]);
    const doc = results.rows[0].doc;

    if (doc.members.indexOf(member) === -1) {
        doc.members.push(member);
        await db.put(doc);
        added.fire(doc._id, member);
    }

    return doc;
}

export async function removeMember(id, member) {
    const results = await find([id]);
    const doc = results.rows[0].doc;
    const idx = doc.members.indexOf(member);

    if (idx !== -1) {
        if (doc.members.length > 1) {
            doc.members.splice(idx, 1);
            await db.put(doc);
            removed.fire(doc._id, member);
        } else {
            await db.remove(doc);
            removed.fire(doc._id, member);
        }
    }
}
