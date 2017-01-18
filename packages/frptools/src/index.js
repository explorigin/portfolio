// observable is a simple value store that can report when its value changes.
// It is good for wrapping external props passed into a component so compute
// types can dependent on them.
// Usage:
//
// Creation:
// `const inViewport = observable(true);`
// Creates and sets initial value to `true`
//
// Read:
// `if (inViewport()) { }`
// Call it to receive the stored value.
//
// Change:
// `inViewport(false);`
// Call it passing the new value. If any computed stores depend on this value
// they will be marked dirty and re-evaluated the next time they are read from.
//
// Subscribe to changes:
// `inViewport.subscribe(console.log.bind(console))`
// Call the subscribe method with a callback that will be called when the
// observable is changed to a different value.

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

// computed is a functional store that depends on the values of observables or other computeds. They cannot be set directly.
//
// Behavior:
// computed will subscribe to its dependencies in such a way that it will be marked as "dirty" when any dependency changes.
//
// Usage:
//
// Creation:
// const showDialog = computed((inVP, shouldShow) => (inVP && shouldShow), [inViewport, shouldShow]);
//
// Read:
// `if (showDialog()) { alert("Hi"); }`
// Call it to receive the stored value.

export function computed(fn, dependencies = []) {
    const subscribers = new Set();
    const dependents = new Set();
    let val = undefined;
    let isDirty = true;

    function _computedDirtyReporter() {
        if (!isDirty) {
            isDirty = true;
        }
        dependents.forEach(runParam);

        if (subscribers.size) {
            accessor();
        }
    }

    const dependentSubscriptions = Array.from(dependencies).map(d => (
        d._d(_computedDirtyReporter)
    ));

    const accessor = function _computed() {
        if (isDirty) {
            const newVal = fn.apply(null, dependencies.map(runParam));
            isDirty = false;
            if (newVal !== val) {
                val = newVal;
                subscribers.forEach(s => s(val));
            }
        }
        return val;
    };

    accessor.subscribe = fn => {
        subscribers.add(fn);
        return () => subscribers.delete(fn);
    };

    accessor._d = fn => {
        dependents.add(fn);
        return () => dependents.delete(fn);
    };

    accessor.detach = () => {
        subscribers.clear();
        dependents.clear();
        dependentSubscriptions.forEach(runParam)
    }

    return accessor;
}

const runParam = a => a();
