import { prop, computed } from 'frptools';
import { injectStyle, el } from '../services/style';


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

export function Dropzone(vm, model) {
    const {
        ondrop,
        ondragenter,
        ondragleave,
    } = model;

    const enterCounter = prop(0);
    enterCounter.subscribe(() => vm.redraw());

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

    return function render(vm, model) {
        const {
            className,
            activeClassName,
            class: _class,
            children,
        } = model;

        const class_ = Object.assign({
            [className || injectStyle(CSS_DROPZONE)]: true,
            [activeClassName || injectStyle(CSS_DROPZONE_ACTIVE)]: enterCounter() > 0
        }, (_class || {}));

        return el('div',
            {
                class: class_,
                ondragenter: onDragEnter,
                ondragover: onDragOver,
                ondragleave: onDragLeave,
                ondrop: onDrop
            },
            ...children
        );
    };
}
