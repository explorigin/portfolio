import { id, registerFire, registerSubscriptions, call } from './util.js';

export function computed(fn, dependencies = [], hash=id) {
    let subscribers = [];
    let isDirty = true;
    let val;
    let id;

    // Compute new value, call subscribers if changed.
    const accessor = function _computed() {
        if (isDirty) {
            const newVal = fn.apply(null, dependencies.map(runParam));
            isDirty = false;
            const newId = hash(newVal);
            if (id !== newId) {
                id = newId;
                val = newVal;
                accessor.fire(val);
            }
        }
        return val;
    };

    // Add child nodes to the logic graph (value-based)
    accessor.subscribe = registerSubscriptions(subscribers);
    accessor.fire = registerFire(subscribers);

    // Receive dirty flag from parent logic node (dependency).  Pass it down.
    accessor.setDirty = function setDirty() {
        if (!isDirty) {
            isDirty = true;
            subscribers.forEach(s => s.setDirty && s.setDirty());
        }
        return subscribers.length && accessor;
    }

    // Remove this node from the logic graph completely
    accessor.detach = () => {
        subscribers = [];
        dependentSubscriptions.forEach(call);
    };

    // Remove child nodes from the logic graph
    accessor.unsubscribeAll = () => {
        subscribers = [];
    };

    const dependentSubscriptions = dependencies.map(d =>
        d.subscribe(accessor.setDirty)
    );

    return accessor;
}

const runParam = a => typeof a === 'function' ? a() : a;
