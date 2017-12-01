import { prop, computed, bundle } from 'frptools';

import { defineElement as el } from '../../utils/domvm.js';
import { injectStyle, styled } from '../../services/style.js';


export function AppBarView(vm, params, key, opts) {
    const title = prop(params.title);
    const renderButtons = prop(params.renderButtons || (() => []));
    const hasBackButton = prop(false);
    const showDropShadow = prop(false);

    if (opts.appbar) {
        throw new Error('Cannot have more than one AppBar.');
    }

    opts.appbar = {
        title,
        renderButtons,
        hasBackButton,
        showDropShadow,
    };

    return (vm, params) => {
        const { title } = params;
        return header({
            css: { boxShadow: showDropShadow() ? '0px 0px 7px gray' : 'none' }
        }, [
            el('div', { style: "font-size: 20pt" }, title),
            headerRight(renderButtons()())
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
