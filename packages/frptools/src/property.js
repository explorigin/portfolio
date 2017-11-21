import { id } from './util.js';

export function prop(store, hash=id) {
    const subscribers = new Set();
    let id = hash(store);

    const accessor = function _prop(newVal) {
        const newId = hash(newVal);
        if (newVal !== undefined && id !== newId) {
            id = newId;
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
