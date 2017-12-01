import { prop, computed, bundle } from 'frptools';

import { defineElement as el, subscribeToRender } from '../../utils/domvm.js';
import { injectStyle, styled } from '../../services/style.js';


export function AppBarView(vm, params, key, opts) {
    const title = prop(params.title);
    const renderButtons = prop(params.renderButtons || (() => []));
    const hasBackButton = prop(false);
    const companionScrollTop = prop(0);
    const boxShadowStyle = computed(t => (
        t === 0 ? 'none' : `0px ${Math.min(t/10, 3)}px 3px rgba(0, 0, 0, .2)`
    ), [companionScrollTop]);

    if (opts.appbar) {
        throw new Error('Cannot have more than one AppBar.');
    }

    opts.appbar = {
        title,
        renderButtons,
        hasBackButton,
        companionScrollTop,
    };

    subscribeToRender(vm, [boxShadowStyle, renderButtons]);

    return (vm, params) => {
        const { title } = params;
        return header({
            css: { boxShadow: boxShadowStyle() }
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
