export const id = a => a

export function hashSet(_a) {
    if (_a instanceof Set) {
        return Array.from(_a.keys())
            .sort()
            .map(k => `${(typeof k).substr(0, 1)}:${encodeURIComponent(k)}/`).join('?');
    }
    return _a
}
