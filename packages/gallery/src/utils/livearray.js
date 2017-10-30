import { observable, computed } from 'frptools';
import { group, groupEnd, log } from '../services/console.js';
import { Watcher } from './watcher.js';

export function LiveArray(db, selector) {
    const watcher = Watcher(db, selector);
    const data = observable({docs: []});
    const docs = computed(r => r.docs, [data]);
    let changeSub = null;

    const accessor = docs;
    accessor.ready = observable(false);
    accessor.cleanup = () => {
        docs.detach();
        if (changeSub) {
            changeSub();
        }
        accessor.ready.unsubscribeAll();
        data({docs: []});
    }

    async function refresh() {
        group("LiveArray Refreshing");
        log(selector)
        data(await db.find({ selector }));
        log(data());
        groupEnd("LiveArray Refreshing");
    }

    refresh().then(() => {
        changeSub = watcher(refresh);
        accessor.ready(true);
    })
    return accessor;
}
