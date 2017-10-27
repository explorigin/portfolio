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

export function backgroundTask(fn, initialDelay=500) {
    let id = null;
    const params = [];

    async function runTask({ didTimeout }) {
        if (didTimeout) {
            id = requestIdleCallback(runTask);
            return;
        }
        const start = Date.now();
        group(fn.name);
        const p = params.shift();
        if (p.length) {
            log(`${fn.name} params: `, ...p);
        }
        await fn(...p);
        const executionTime = Date.now() - start;
        log(`${fn.name} execution time: ${executionTime}ms`);
        groupEnd(fn.name);
        if (params.length) {
            id = requestIdleCallback(runTask);
        } else {
            id = null;
        }
    }

    const wrapper = (...args) => {
        params.push(args);
        if (id !== null) {
            return false;
        }
        id = requestIdleCallback(runTask);
        return true;
    };

    if (initialDelay) {
        setTimeout(wrapper, initialDelay);
    }

    return wrapper;
}
