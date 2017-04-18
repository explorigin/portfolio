import { log, error } from '../services/console.js';
import { getDatabase, getOrCreate } from '../services/db.js';


const db = getDatabase();
const PREFIX = 'index';

// Methods
export const hashString = name => name.trim().replace(/[ \-~!@#$%^&]/g, '_').toLowerCase();
const getId = (id) => id.startsWith(PREFIX) ? id : `${PREFIX}_${hashString(id)}`;

export async function find(keys, options={}) {
    return await db.allDocs(Object.assign(
        { include_docs: true },
        options,
        { keys: keys.map(getId) }
    ));
}

export async function add(id, members = []) {
    const _id = getId(id);
    const [results, created] = await getOrCreate({
        _id,
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
        } else {
            await db.remove(doc);
        }
    }
}
