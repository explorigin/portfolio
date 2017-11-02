import { eq } from './util.js';

export function observable(store, comparator=eq) {
    const subscribers = new Set();

    const accessor = function _observable(newVal) {
        if (newVal !== undefined && !comparator(store, newVal)) {
            store = newVal;
            subscribers.forEach(s => s(store));
        }
        return store;
    };

    accessor.subscribe = accessor._d = fn => {
        subscribers.add(fn);
        return () => {
            subscribers.delete(fn);
            return subscribers.size;
        }
    };

    accessor.unsubscribeAll = () => subscribers.clear();

    return accessor;
}
