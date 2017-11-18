import { prop, computed } from 'frptools';

import { Watcher } from './watcher.js';
import { pouchDocArrayComparator } from './comparators.js';


// LiveArray is a subscribable property function that always returns the db results that match the provided selector and calls subscribers when the results change.
export function LiveArray(db, selector, mapper) {
    const _watcher = Watcher(db, selector);
    let changeSub = null;
    let _mapper = mapper || (doc => doc);

    const ready = prop(false);
    const data = prop({docs: []});
    const docs = computed(r => r.docs.map(_mapper), [data], pouchDocArrayComparator);

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
