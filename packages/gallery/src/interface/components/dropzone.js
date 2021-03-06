import { prop, computed } from 'frptools';

import { injectStyle } from '../../services/style';
import { defineElement as el } from '../../utils/domvm.js';


const CSS_DROPZONE = {
    width: '200px',
    height: '200px',
    border: '2px #666 dashed',
    borderRadius: '5px',
};

const CSS_DROPZONE_ACTIVE = {
    borderStyle: 'solid',
    backgroundColor: '#eee',
};

export function Dropzone(vm, params) {
    const {
        ondrop,
        ondragenter,
        ondragleave,
        className,
        hoverClassName,
        content,
        hoverContent,
        dropEffect
    } = params;

    const baseClassName = `dropzone ${className || injectStyle(CSS_DROPZONE)}`;
    const activeClassName = `${baseClassName} ${hoverClassName || injectStyle(CSS_DROPZONE_ACTIVE)}`;

    const enterCounter = prop(0);
    const active = computed(c => c > 0, [enterCounter]);
    const _class = computed(a => (a && hoverClassName) ? activeClassName : baseClassName, [active]);
    const _content = computed(a => a && hoverContent ? hoverContent : content, [active]);

    function onDragOver(evt) {
        // allows the browser to accept drops.
        evt.preventDefault();

        if (dropEffect) {
            evt.dataTransfer.dropEffect = dropEffect;
        }
    }

    function onDragEnter() {
        enterCounter(enterCounter() + 1);

        if (ondragenter) {
            ondragenter();
        }
    }

    function onDragLeave() {
        enterCounter(enterCounter() - 1);

        if (ondragleave) {
            ondragleave();
        }
    }

    function onDrop(evt) {
        evt.preventDefault();
        enterCounter(0);

        if (ondrop) {
            ondrop(evt, evt.dataTransfer.files);
        }
    }

    return function render() {
        return el('div',
            {
                class: _class,
                "data-hover": active,  // only here to subscribe to the change
                ondragenter: onDragEnter,
                ondragover: onDragOver,
                ondragleave: onDragLeave,
                ondrop: onDrop
            },
            _content()()
        );
    };
}
