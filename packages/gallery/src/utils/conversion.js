import { readAsArrayBuffer } from 'pouchdb-binary-utils';
import { pick } from 'frptools';

import { isObject } from './comparators';

export function bufferToHexString(buffer) {
    const hexCodes = [];
    const view = new DataView(buffer);

    for (let i = 0; i < view.byteLength; i += 4) {
        // Using getUint32 reduces the number of iterations needed (we process 4 bytes each time)
        const value = view.getUint32(i);
        // toString(16) will give the hex representation of the number without padding
        // We use concatenation and slice for padding
        hexCodes.push(`00000000${value.toString(16)}`.slice(-8));
    }

    // Join all the hex strings into one
    return hexCodes.join('');
}

export function blobToArrayBuffer(blob) {
    return new Promise(resolve => readAsArrayBuffer(blob, resolve));
}

export const arrayHashWrapper = hash => arr => Array.isArray(arr) ? arr.map(hash).join('?') : arr;

export function pouchDocHash(d) {
    return isObject(d) ? `${d._id}:${d._rev}` : d;
}

export const pouchDocArrayHash = arrayHashWrapper(pouchDocHash);

export function deepAssign(to, ...rest) {
    for (let src of rest) {
        for (let prop in src) {
            const value = src[prop];
            if (typeof value === 'object' && !Array.isArray(value)) {
                to[prop] = deepAssign(to[prop] || {}, value);
            } else if (value === undefined && to[prop] !== undefined){
                delete to[prop];
            } else {
                to[prop] = value;
            }
        }
    }
    return to;
}

export const extractID = pick('_id');
export const extractREV = pick('_rev');

export function hashSet(_a) {
    if (_a instanceof Set) {
        return Array.from(_a.keys())
            .sort()
            .map(k => `${(typeof k).substr(0, 1)}:${encodeURIComponent(k)}/`).join('?');
    }
    return _a
}
