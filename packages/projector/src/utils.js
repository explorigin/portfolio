
export const NORMAL_OBJECT_PROP_TYPES = ['number', 'string', 'boolean'];

export function sanitizeObject(obj) {
    const output = {};
    for (const key in evt) {
        const value = evt[key];
        if (NORMAL_OBJECT_PROP_TYPES.includes(typeof value)) {
            output[key] = value;
        }
    }
    return output;
}

// Extrapolated from https://github.com/zzarcon/default-passive-events/blob/master/default-passive-events.js
export let supportsPassive = false;
try {
    const opts = Object.defineProperty({}, 'passive', {
        get: function() {
            supportsPassive = true;
        }
    });
    addEventListener('test', null, opts);
} catch (e) {}
