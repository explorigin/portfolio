import { log, error } from '../services/console.js';

export function Watcher(db, selector) {
    const subscribers = new Set();
    let changes = null;

    return function subscribe(fn) {
        subscribers.add(fn);

        if (subscribers.size === 1 && !changes) {
            log('Watching:', db, selector);
            changes = db.changes({
                since: 'now',
                live: true,
                selector
            })
            .on("change", change => {
                log('changed:', change);
                subscribers.forEach(s => s(change.id, !!change.deleted));
            })
            .on("error", err => {
                error(err);
                subscribers.empty();
            });
        }
        return () => {
            subscribers.delete(fn);
            if (subscribers.size === 0 && changes) {
                log('Unwatching:', db, selector);
                changes.cancel();
                changes = null;
            }
        }
    };
}
