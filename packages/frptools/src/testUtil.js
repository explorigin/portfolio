
export function dirtyMock(count) {
    const result = {};
    let state = 'init';

    const fakeProp = function(i) {
        const a = (val) => {
            if (state === 'dirty') {
                expect(Object.keys(result).length).toEqual(count);
                state = 'cleaning';
            }
            if (val === undefined) {
                if (result[i] === false) {
                    delete result[i];
                } else {
                    result[i] = true;
                }
            }
            if (Object.keys(result).length === 0) {
                state = 'clean';
            }
        };
        a.setDirty = () => {
            state = 'dirty';
            result[i] = false;
            return a;
        }
        return a;
    } ;
    const output = [];
    for (let i = 0; i < count; ++i) {
        output.push(fakeProp(i))
    }
    output.push(() => Object.keys(result).length === 0 && state === 'clean')
    return output;
}

export function hashSet(_a) {
    if (_a instanceof Set) {
        return Array.from(_a.keys())
            .sort()
            .map(k => `${(typeof k).substr(0, 1)}:${encodeURIComponent(k)}/`).join('?');
    }
    return _a
}
