import Styletron from 'styletron';
import { injectStyle as _injectStyle } from 'styletron-utils';
import { defineElement } from 'domvm';

const styletronSingleton = new Styletron();

export function injectStyle(...styles) {
    return _injectStyle(styletronSingleton, Object.assign({}, ...styles));
}

function isObject(obj) {
    return typeof obj === 'object' && !Array.isArray(obj);
}

export function el(sig, ...attrsOrChildren) {
    let attrs = {};
    let children = attrsOrChildren;
    if (attrsOrChildren.length && isObject(attrsOrChildren[0])) {
        attrs = attrsOrChildren[0];
        children = attrsOrChildren.slice(1);
        if (isObject(attrs.css)) {
            const className = injectStyle(Object.assign(attrs.css, attrs.styles || {}));
            attrs.class = `${className} ${attrs.class || ''}`.trim();
            delete attrs.css;
            delete attrs.styles;
        }
    }
    return defineElement(sig, attrs, ...children);
}

export function styled(styles, tagName='div') {
    const className = injectStyle(styles);

    return (...props) => {
        const attrIndex = props.length && isObject(props[0]) ? 0 : -1;
        const attrs = (
            attrIndex === -1
            ? { class: className }
            : Object.assign(
                {},
                props[0],
                {className: `${className} ${props[0].className || ''}`.trim()})
        );

        if (isObject(attrs.css)) {
            attrs.styles = styles;
            attrs.class = props[0].class || '';
        }

        const children = props.slice(attrIndex + 1);
        return el(tagName, attrs, children);
    };
}
