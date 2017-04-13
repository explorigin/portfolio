export function bundle(observables) {
    const activeSubscribers = new Set();
    let activeUpdate = false;

    const accessor = function _bundle(values) {
        const result = {};
        activeUpdate = true;
        Object.keys(values)
            .filter(k => typeof observables[k] === 'function')
            .forEach(k => {
                result[k] = observables[k](values[k]);
            });

        const subscribers = Array.from(activeSubscribers);
        // Set them dirty but don't propagate.
        subscribers.forEach(s => s(result, true));
        // Now propagate.
        subscribers.forEach(s => s(result));
        activeSubscribers.clear();
        activeUpdate = false;
        return result;
    };

    const subscriptionFactory = obsFn => fn => {
        return obsFn(v => {
            if (activeUpdate) {
                activeSubscribers.add(fn);
            } else {
                fn(v);
            }
            return v;
        });
    };

    Object.keys(observables).forEach(k => {
        const obs = observables[k];

        accessor[k] = obs;
        obs._d = subscriptionFactory(obs._d);
    });

    return accessor;
}
