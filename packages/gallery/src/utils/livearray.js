import { observable, computed } from 'frptools';
import { matchesSelector } from 'pouchdb-selector-core';

import { getDatabase } from '../services/db.js';
import { Watcher } from './watcher.js';
import { pouchDocArrayComparator } from './comparators.js';
import { difference } from './set.js';


// The point of the globalWatcher mechanism is that PouchDB.changes doesn't register when a document changes in such a way that removes it from the selector specifications.
// For Example: a selector looks for images with a specific tag. If a change removes that tag, the changes API will not register a change event.  globalWatcher watches the document IDs for exactly this type of change and triggers the LiveArray to refresh.

const globalWatcher = Watcher(getDatabase(), {}, true);
const watchingIDs = new Map();
let globalWatcherSubscription = null;

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

function addID(id, selector, refresher) {
    if (!watchingIDs.has(id)) {
        watchingIDs.set(id, new Map());
    }
    watchingIDs.get(id).set(selector, refresher);
    if (globalWatcherSubscription === null) {
        globalWatcherSubscription = globalWatcher(checkDocs);;
    }
}

function removeID(id, selector) {
    if (watchingIDs.has(id)) {
        const idSet = watchingIDs.get(id);
        idSet.delete(selector);
        if (idSet.size === 0) {
            watchingIDs.delete(selector);
            if (watchingIDs.size === 0) {
                globalWatcherSubscription();
                globalWatcherSubscription = null;
            }
        }
    }
}

// LiveArray is a subscribable property function that always returns the db results that match the provided selector and calls subscribers when the results change.
export function LiveArray(db, selector, watcher) {
    const _watcher = watcher || Watcher(db, selector);
    let changeSub = null;

    const ready = observable(false);
    const data = observable({docs: []});
    const docs = computed(r => r.docs, [data], pouchDocArrayComparator);

    const idSet = () => docs().reduce((acc, d) => acc.add(d._id), new Set());
    const addThisID = id => addID(id, selector, refresh);
    const removeThisID = id => removeID(id, selector);

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
