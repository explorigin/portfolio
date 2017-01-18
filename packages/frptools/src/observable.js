export function observable(store) {
    const subscribers = new Set();

    const accessor = function _observable(newVal) {
        if (newVal !== undefined && store !== newVal) {
            store = newVal;
            subscribers.forEach(s => s(store));
        }
        return store;
    };

    accessor.subscribe = accessor._d = fn => {
        subscribers.add(fn);
        return () => subscribers.delete(fn);
    };

    accessor.unsubscribeAll = () => subscribers.clear();

    return accessor;
}
