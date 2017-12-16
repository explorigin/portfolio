import Styletron from 'styletron';
import { injectStyle as _injectStyle } from 'styletron-utils';
import { defineElement } from '../utils/domvm.js';
import { isObject, isString } from '../utils/comparators.js';
import { streamConfig } from '../utils/event.js';

const styletronSingleton = new Styletron();

export function injectStyle(...styles) {
    return _injectStyle(styletronSingleton, Object.assign({}, ...styles));
}

export function el(sig, ...attrsOrChildren) {
    let attrs = {};
    let children = attrsOrChildren;
    if (attrsOrChildren.length && isObject(attrsOrChildren[0]) && !streamConfig.is(attrsOrChildren[0])) {
        attrs = attrsOrChildren[0];
        children = attrsOrChildren.slice(1);
        if (isObject(attrs.css)) {
            const className = injectStyle(Object.assign({}, attrs.css, attrs.styles || {}));
            attrs.class = `${className} ${attrs.class || ''}`.trim();
            delete attrs.css;
            delete attrs.styles;
        }
        if (isObject(attrs.class)) {
            const oldClassObj = attrs.class;
            attrs.class = Object.entries(oldClassObj).reduce((acc, [key, value]) => {
                if (value) { acc.push(key) }
                return acc;
            }, []).join(' ');
        }
    }
    if (children.length === 1 && streamConfig.is(children[0])) {
        children = children[0];
    }
    return defineElement(sig, attrs, children);
}

export function styled(...styles) {
    let className;
    let tagName = 'div';
    if (styles.length > 1 && isString(styles[0])) {
        tagName = styles[0];
        className = injectStyle(...styles.slice(1));
    } else {
        className = injectStyle(...styles);
    }

    return (...props) => {
        const attrIndex = props.length && isObject(props[0]) ? 0 : -1;
        const attrs = (
            attrIndex === -1
            ? { class: className }
            : Object.assign(
                {},
                props[0],
                {class: `${className} ${props[0].class || ''}`.trim()})
        );

        if (isObject(attrs.css)) {
            attrs.class += ' ' + injectStyle(attrs.css);
        }

        let children = props.slice(attrIndex + 1);

        if (children.length === 1 && streamConfig.is(children[0])) {
            children = children[0];
        }

        return el(tagName, attrs, children);
    };
}
