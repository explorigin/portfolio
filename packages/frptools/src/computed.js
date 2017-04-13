export function computed(fn, dependencies = []) {
    const subscribers = new Set();
    const dependents = new Set();
    let isDirty = true;
    let val;

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
        dependentSubscriptions.forEach(runParam);
    };

    return accessor;
}

const runParam = a => a();
