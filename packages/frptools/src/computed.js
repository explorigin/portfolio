import { eq } from './util.js';

export function computed(fn, dependencies = [], comparator=eq) {
    const subscribers = new Set();
    const dependents = new Set();
    let isDirty = true;
    let val;

    // Receive dirty flag from parent logic node (dependency).  Pass it down.
    function _computedDirtyReporter(_, skipPropagation) {
        if (!isDirty) {
            isDirty = true;
            dependents.forEach(d => d(_, skipPropagation));
        }

        if (subscribers.size && !skipPropagation) {
            accessor();
        }
    }

    const dependentSubscriptions = Array.from(dependencies).map(d =>
        d._d(_computedDirtyReporter)
    );

    // Compute new value, call subscribers if changed.
    const accessor = function _computed() {
        if (isDirty) {
            const newVal = fn.apply(null, dependencies.map(runParam));
            isDirty = false;
            if (!comparator(val, newVal)) {
                val = newVal;
                subscribers.forEach(s => s(val));
            }
        }
        return val;
    };

    // Add child nodes to the logic graph (value-based)
    accessor.subscribe = fn => {
        subscribers.add(fn);
        return () => {
            subscribers.delete(fn);
            return subscribers.size;
        }
    };

    // Add child nodes to the logic graph (dirty-based)
    accessor._d = fn => {
        dependents.add(fn);
        return () => dependents.delete(fn);
    };

    // Remove this node from the logic graph completely
    accessor.detach = () => {
        subscribers.clear();
        dependents.clear();
        dependentSubscriptions.forEach(runParam);
    };

    // Remove child nodes from the logic graph
    accessor.unsubscribeAll = () => {
        subscribers.clear();
        dependents.clear();
    };

    return accessor;
}

const runParam = a => a();
