export function bundle(props) {
    const activeSubscribers = new Set();
    let activeUpdate = false;

    const accessor = function _bundle(values) {
        const result = {};
        activeUpdate = true;
        Object.keys(values)
            .filter(k => typeof props[k] === 'function')
            .forEach(k => {
                result[k] = props[k](values[k]);
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

    Object.keys(props).forEach(k => {
        const obs = props[k];

        accessor[k] = obs;
        obs._d = subscriptionFactory(obs._d);
    });

    return accessor;
}
