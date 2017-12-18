// export * from 'domvm/dist/dev/domvm.dev.js';
export * from 'domvm/dist/mini/domvm.mini.js';
import { call } from 'frptools';
import { deepAssign } from './conversion.js';
import { error } from '../services/console.js';

export function subscribeToRender(vm, subscribables, subscriptions) {
    const redraw = (...args) => vm.redraw();
    const subList = subscribables
        .map(s => s.subscribe(redraw));

    vm.config({ hooks: {
        willUnmount: () => subList.concat(subscriptions).forEach(call)
    }});
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

export function nodeParentWithType(node, type) {
    let parentNode = node;
    while (parentNode && (!parentNode.data || parentNode.data.type !== type)) {
        parentNode = parentNode.parent;
    }
    if (!parentNode) {
        error(`Could not find {"type": "${type}"} parent.`);
        return;
    }
    return parentNode;
}
