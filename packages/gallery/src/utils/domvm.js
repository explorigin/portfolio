// export * from 'domvm/dist/dev/domvm.dev.js';
export * from 'domvm/dist/mini/domvm.mini.js';
import { deepAssign } from './conversion.js';

export function subscribeToRender(vm, subscribables, subscriptions) {
    const redraw = (...args) => vm.redraw();
    const subList = subscribables
        .map(s => s.subscribe(redraw))
        .concat(subscriptions);

    vm.config({ hooks: { willUnmount: () => subList.forEach(s => s())}});
}


export function patchRefStyle(ref, style, evt, node, vm) {
    vm.refs[ref].patch({style});
}

export function patchRefStyleMap(refStyleMap, ...args) {
    Object.entries(refStyleMap).forEach(([r, s]) => patchRefStyle(r, s, ...args))
}

export function patchNodeStyle(style, evt, node) {
    node.patch({style});
}

export function changeElementStateMap(refStateMap, evt, node, vm) {
    Object.entries(refStateMap).forEach(([r, state]) => {
        deepAssign(vm.refs[ref]._data, state);
    });
}
