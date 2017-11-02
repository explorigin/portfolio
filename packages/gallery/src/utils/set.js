export function equals(a, b) {
    return (
        [...a].reduce((acc, d) => acc && b.has(d), true)
        && [...b].reduce((acc, d) => acc && a.has(d), true)
    );
}

export function intersection(a, b) {
    return new Set([...a].filter(x => b.has(x)));
}

export function difference(a, b) {
    return new Set([...a].filter(x => !b.has(x)));
}
