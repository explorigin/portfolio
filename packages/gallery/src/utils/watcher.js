import { log, error } from '../services/console.js';


export function Watcher(db, selector, opts) {
    const subscribers = new Set();
    let changes = null;

    return function subscribe(fn) {
        subscribers.add(fn);

        if (subscribers.size === 1 && !changes) {
            log(`Watching "${db.name}" for ${JSON.stringify(selector)}`);
            changes = db.changes(Object.assign({
                since: 'now',
                live: true,
                selector
            }, opts))
            .on("change", change => {
                const { id, deleted, doc } = change;
                log(`Change from "${db.name}" for ${JSON.stringify(selector)} ${id} ${deleted ? 'deleted' : ''}`);
                subscribers.forEach(s => s(id, !!deleted, doc));
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
