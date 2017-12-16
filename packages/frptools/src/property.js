import { id, registerSubscriptions, registerFire } from './util.js';

export function prop(store, hash=id) {
    let subscribers = [];
    let id = hash(store);

    const accessor = function _prop(newVal) {
        const newId = hash(newVal);
        if (newVal !== undefined && id !== newId) {
            id = newId;
            store = newVal;
            accessor.fire(store);
        }
        return store;
    };
    accessor.subscribe = registerSubscriptions(subscribers);
    accessor.fire = registerFire(subscribers);
    accessor.unsubscribeAll = () => subscribers = [];

    return accessor;
}
