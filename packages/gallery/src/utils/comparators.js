import { extractID } from './conversion.js';
import { equals } from './set.js';


export function pouchDocArrayComparator(a, b) {
    const aIDs = a.map(extractID);
    const bIDs = b.map(extractID);

    return equals(new Set(...aIDs), new Set(...bIDs));
}
