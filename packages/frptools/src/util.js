export const id = a => a

export const registerSubscriptions = subscriptionsArray => fn => {
    subscriptionsArray.push(fn);
    return () => {
        const idx = subscriptionsArray.indexOf(fn);
        if (idx !== -1) {
            subscriptionsArray.splice(idx, 1);
        }
        return subscriptionsArray.length;
    }
};

export const call = a => typeof a === 'function' ? a() : a;

export const registerFire = subscriptionsArray => val => {
    subscriptionsArray.map(s => s(val)).forEach(call);
};
