import { bufferToHexString } from './conversion.js';


export async function sha256(buffer) {
    return bufferToHexString(await crypto.subtle.digest('sha-256', buffer));
}
