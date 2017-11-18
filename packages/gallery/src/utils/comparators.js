import { pick } from './conversion.js';

const extractID = pick('_id');
const extractREV = pick('_rev');

export function pouchDocComparator(a, b) {
    return extractID(a) === extractID(b) && extractREV(a) === extractREV(b)
}

export function pouchDocArrayComparator(a, b) {
    if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) {
        return false;
    }

    return a.every((aRec, index) => pouchDocComparator(aRec, b[index]));
}

export function isObject(obj) {
    return typeof obj === 'object' && !Array.isArray(obj);
}
