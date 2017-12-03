// export * from 'domvm/dist/dev/domvm.dev.js';
export * from 'domvm/dist/mini/domvm.mini.js';

export function subscribeToRender(vm, subscribables, subscriptions) {
    const redraw = () => vm.redraw();
    const subList = subscribables
        .map(s => s.subscribe(redraw))
        .concat(subscriptions);

    vm.config({ hooks: { willUnmount: () => subList.forEach(s => s())}});
}


export function patchRefStyle(ref, style, evt, node, vm) {
    vm.refs[ref].patch({style});
}

export function patchRefStyleMap(refStylemap, ...args) {
    Object.entries(refStylemap).forEach(([r, s]) => patchRefStyle(r, s, ...args))
}

export function patchNodeStyle(style, evt, node) {
    node.patch({style});
}
