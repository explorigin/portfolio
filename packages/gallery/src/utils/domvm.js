// export * from 'domvm/dist/dev/domvm.dev.js';
export * from 'domvm/dist/mini/domvm.mini.js';
import { defineView } from 'domvm/dist/mini/domvm.mini.js';
import { prop, computed, call } from 'frptools';
import { deepAssign } from './conversion.js';
import { error } from '../services/console.js';

export function subscribeToRender(vm, subscribables, subscriptions) {
    const redraw = () => vm.redraw();
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

export function renderSwitch(renderMap, switchValue) {
    const params = renderMap[switchValue];
    return params ? defineView.apply(null, params) : `VIEW ${switchValue} NOT FOUND`;
}

// Expose viewport size in a subscribable.
export const scrollbarSize = prop(0);
export const fullViewportSize = prop({width: window.innerWidth, height: window.innerHeight}, o => o ? `${o.width}x${o.height}`: '');
export const availableViewportSize = computed(
    (ss, vs) => ({
        width: vs.width - ss,
        height: vs.height - ss
    }), [scrollbarSize, fullViewportSize]);

(function getScrollbarSize() {
    const outer = document.createElement("div");
    const inner = document.createElement("div");
    outer.style.visibility = "hidden";
    outer.style.width = "100px";
    outer.style.msOverflowStyle = "scrollbar"; // needed for WinJS apps

    document.body.appendChild(outer);

    const widthNoScroll = outer.offsetWidth;
    // force scrollbars
    outer.style.overflow = "scroll";

    // add innerdiv
    inner.style.width = "100%";
    outer.appendChild(inner);

    const widthWithScroll = inner.offsetWidth;

    // remove divs
    outer.parentNode.removeChild(outer);

    scrollbarSize(widthNoScroll - widthWithScroll);
})();

const extractWindowSize = () => fullViewportSize({width: window.innerWidth, height: window.innerHeight});
window.addEventListener('resize', extractWindowSize);
// Prime our window size
extractWindowSize();

