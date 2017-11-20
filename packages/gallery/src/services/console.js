export function log(...args) {
    if (__DEV__) {
        console.log(...args);
    }
}

export function error(...args) {
    if (__DEV__) {
        console.error(...args);
    }
}

export function warn(...args) {
    if (__DEV__) {
        console.warn(...args);
    }
}

export function group(...args) {
    if (__DEV__) {
        console.group(...args);
    }
}

export function groupEnd(...args) {
    if (__DEV__) {
        console.groupEnd(...args);
    }
}
