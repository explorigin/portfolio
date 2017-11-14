import { prop, computed } from 'frptools';
import { matchesSelector } from 'pouchdb-selector-core';

import { getDatabase } from '../services/db.js';
import { Watcher } from './watcher.js';
import { pouchDocArrayComparator } from './comparators.js';
import { difference } from './set.js';


// The point of the watcher mechanism is that PouchDB.changes doesn't register
// when a document changes in such a way that removes it from the selector
// specifications.  For Example: a selector looks for images with a specific
// tag. If a change removes that tag, the changes API will not register a change
// event.  globalWatcher watches the document IDs for exactly this type of
// change and triggers the LiveArray to refresh.
const watcherMap = new Map();
const watchingIDs = new Map();
const dbIDs = new Map();

function checkDocs(id, deleted, doc) {
    // Is the changed doc one that we're watching?
    if (watchingIDs.has(id)) {
        const refresherMap = watchingIDs.get(id);
        // if the doc doesn't match a watching selector, then refresh its LA
        [...refresherMap.keys()]
                    .filter(s => !matchesSelector(doc, s))
                    .forEach(s => refresherMap.get(s)());
        return;
    }
}

function addID(db, id, selector, refresher) {
    if (!watcherMap.has(db)) {
        watcherMap.set(db, Watcher(db, {}, true)(checkDocs));
    }

    if (!dbIDs.has(db)) { dbIDs.set(db, new Set()); }
    dbIDs.get(db).add(id);

    if (!watchingIDs.has(id)) { watchingIDs.set(id, new Map()); }
    watchingIDs.get(id).set(selector, refresher);
}

function removeID(db, id, selector) {
    if (watchingIDs.has(id)) {
        const idSet = watchingIDs.get(id);
        idSet.delete(selector);
        if (idSet.size === 0) {
            watchingIDs.delete(selector);
        }

        const dbIDMap = dbIDs.get(db);
        dbIDMap.delete(id);
        if (dbIDMap.size === 0) {
            // Unsubscribe from this watcher
            watcherMap.get(db)();
            dbIDs.delete(db);
        }
    }
}

// LiveArray is a subscribable property function that always returns the db results that match the provided selector and calls subscribers when the results change.
export function LiveArray(db, selector, mapper) {
    const _watcher = Watcher(db, selector);
    let changeSub = null;
    let _mapper = mapper || (doc => doc);

    const ready = prop(false);
    const data = prop({docs: []});
    const docs = computed(r => r.docs.map(_mapper), [data], pouchDocArrayComparator);

    const idSet = () => docs().reduce((acc, d) => acc.add(d._id), new Set());
    const addThisID = id => addID(db, id, selector, refresh);
    const removeThisID = id => removeID(db, id, selector);

    const cleanup = () => {
        docs.unsubscribeAll();
        ready.unsubscribeAll();
        if (changeSub) {
            changeSub();
            changeSub = null;
        }
        [...idSet()].forEach(removeThisID);
        data({docs: []});
    }

    const refresh = async function refresh() {
        const oldIdSet = idSet();
        data(await db.find({ selector }));
        const currentIDSet = idSet();
        // Removes IDs not in the new set
        [...difference(oldIdSet, currentIDSet)].forEach(removeThisID);
        // Add IDs in the new set
        [...difference(currentIDSet, oldIdSet)].forEach(addThisID);
    };

    docs.ready = ready;
    docs.cleanup = cleanup;
    docs.selector = selector;
    docs.db = db;

    refresh().then(() => {
        changeSub = _watcher(refresh);
        ready(true);
    })
    return docs;
}
