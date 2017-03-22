import { log, error, group, groupEnd } from '../services/console.js';

export class Event {
    constructor(name) {
        this.name = name;
        this.stages = [];
    }

    async fire(...args) {
        const groupName = `Feeding pipeline "${this.name}"`;
        group(groupName);
        log('params:', ...args);
        let i = this.stages.length;
        const _next = async (res) => {
            if (!i) {
                groupEnd(groupName);
                return res;
            }
            i -= 1;
            const stage = this.stages[i];
            try {
                const result = stage(...args);
                if (result && result.then) {
                    return result.then(_next);
                }
                return Promise.resolve(result).then(_next);
            } catch (e) {
                const stageName = stage.name || '<anonymous function>';
                error(`${stageName} threw error:`, e);
            }
        }

        return await _next();
    }

    subscribe(callback, position=0) {
        this.stages.splice(position, 0, callback);
    }

    unsubscribe(callback) {
        this.stages.splice(this.stages.indexOf(callback), 1);
    }
}

// requestIdleCallback sortof-polyfill
if (!global.requestIdleCallback) {
    const IDLE_TIMEOUT = 10;
    global.requestIdleCallback = cb => {
        let start = Date.now();
        return setTimeout( () => cb({
            timeRemaining: () => Math.max(0, IDLE_TIMEOUT - (Date.now() - start))
        }), 1);
    };
}

export function backgroundTask(fn) {
    let id = null;
    let reRunCount = 0;

    function runTask({ didTimeout, timeRemaining }) {
        if (didTimeout) {
            id = requestIdleCallback(runTask);
            return;
        }
        const start = Date.now();
        fn();
        if (reRunCount && Date.now() - start < timeRemaining()) {
            reRunCount -= 1;
            id = requestIdleCallback(runTask);
        } else {
            id = null;
        }
    }

    return () => {
        if (id !== null) {
            reRunCount += 1;
            return;
        }
        id = requestIdleCallback(runTask);
        return;
    };
}
