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
        activeClassName,
        content,
    } = params;

    const baseClassName = className || injectStyle(CSS_DROPZONE);
    const hoverClassName = `${baseClassName} ${activeClassName || injectStyle(CSS_DROPZONE_ACTIVE)}`;

    const enterCounter = prop(0);
    const class_ = computed(c => c === 0 ? baseClassName : hoverClassName, [enterCounter]);

    function onDragOver(evt) {
        // allows the browser to accept drops.
        evt.preventDefault();
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
            ondrop(evt.dataTransfer.files);
        }
    }

    return function render() {
        return el('div',
            {
                class: class_,
                ondragenter: onDragEnter,
                ondragover: onDragOver,
                ondragleave: onDragLeave,
                ondrop: onDrop
            },
            content()
        );
    };
}
