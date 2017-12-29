import { prop, computed, id } from 'frptools';

import { Watcher } from './watcher.js';
import { pouchDocArrayHash } from './conversion.js';


// LiveArray is a subscribable property function that always returns the db results that match the provided selector and calls subscribers when the results change.
export function LiveArray(db, selector, opts={}) {
    const mapper = opts.mapper || id;
    opts.mapper && delete opts.mapper;
    opts.include_docs = true;
    const _watcher = Watcher(db, selector, opts);
    let changeSub = null;

    const ready = prop(false);
    const data = prop({docs: []});
    const docs = computed(r => r.docs.map(mapper), [data], pouchDocArrayHash);

    const cleanup = () => {
        docs.unsubscribeAll();
        ready.unsubscribeAll();
        if (changeSub) {
            changeSub();
            changeSub = null;
        }
        data({docs: []});
    };

    const refresh = async function refresh(...args) {
        data(await db.find({ selector }));
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
