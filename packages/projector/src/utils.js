
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
