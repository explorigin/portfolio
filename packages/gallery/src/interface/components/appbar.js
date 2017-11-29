import { defineElement as el } from '../../utils/domvm.js';
import { prop, computed, bundle } from 'frptools';
import { injectStyle, styled } from '../../services/style.js';


export function AppBarView(vm, params, key, opts) {
    if (opts.appbar) {
        throw new Error('Cannot have more than one AppBar.');
    }

    const title = prop(params.title);
    const renderButtons = prop(params.renderButtons)

    return (vm, params) => {
        const { title } = params;
        return header([
            el('div', { style: "font-size: 20pt" }, title),
            headerRight({
                css: { visibility: /* selectMode */ true ? 'visible' : 'hidden' }
            }, renderButtons()())
        ]);
    };
}

const header = styled({
    justifyContent: 'space-between',
    padding: '1em',
    zIndex: 1,
    display: 'flex',
    alignItems: 'center',
});

const headerRight = styled({
    display: 'flex',
    alignItems: 'center'
});
