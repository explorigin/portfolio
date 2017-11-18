import { readAsArrayBuffer } from 'pouchdb-binary-utils';

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

export const pick = id => doc => doc[id];
