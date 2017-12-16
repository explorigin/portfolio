import { id, registerSubscriptions, registerFire } from './util.js';

export function container(store, hash) {
    let subscribers = [];
    let id = hash(store);

    const containerMethods = {
        subscribe: registerSubscriptions(subscribers),
        fire: registerFire(subscribers),
        unsubscribeAll: () => { subscribers = []; }
    };

    function checkUpdate(target) {
        const newId = hash(target);
        if (id !== newId) {
            id = newId;
            containerMethods.fire(target);
        }
    }

    const p = new Proxy(store, {
        apply: (target, context, args) => {
            return target;
        },
        get: (target, name) => {
            if (name in containerMethods) {
                return containerMethods[name];
            }
            if (name === '_') {
                return target;
            }
            const thing = target[name];
            if (typeof thing === 'function') {
                return (...args) => {
                    const ret = target[name](...args);
                    checkUpdate(target);
                    return ret;
                };
            }
            return thing;
        },
        set: (target, name, newVal) => {
            if (name in containerMethods) {
                throw new ReferenceError(`Cannot set ${name} in ${target}`);
            }
            target[name] = newVal;
            checkUpdate(target);

            return newVal;
        }
    });

    return p;
}
