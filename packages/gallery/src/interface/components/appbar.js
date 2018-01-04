import { prop, computed, container, pick } from 'frptools';

import { Icon } from './icon.js';
import { router } from '../../services/router.js';
import { defineElement as el, subscribeToRender } from '../../utils/domvm.js';
import { injectStyle, styled } from '../../services/style.js';
import { CLICKABLE } from '../styles.js';

let seq = 0;

export function AppBarView(vm, params, key, opts) {
    const stateStack = container([], arr => arr.length && arr[0]._seq);
    const companionScrollTop = prop(0);

    const currentState = computed(stack => stack[0] || {}, [stateStack]);
    const title = computed(pick('title', ''), [currentState]);
    const renderActions = computed(pick('actions'), [currentState]);
    const up = computed(pick('up'), [currentState]);
    const upButton = computed(pick('name', 'arrow_left'), [up]);
    const upAction = computed(upState => upState.onclick ? upState.onclick : [popState, upState.navigateTo], [up]);
    const stateStyle = computed(pick('style', {}), [currentState]);

    const boxShadowStyle = computed(t => (
        t === 0 ? 'none' : `0px 3px 3px rgba(0, 0, 0, .2)`
    ), [companionScrollTop]);

    const containerStyle = computed((boxShadow, style) => ({
            css: Object.assign({ boxShadow }, style)
        }), [boxShadowStyle, stateStyle])

    if (opts.appbar) {
        throw new Error('Cannot have more than one AppBar.');
    }

    function pushState(newState) {
        companionScrollTop(0);
        stateStack.unshift(Object.assign({_seq: seq++}, newState));
    }

    function popState(navigateTo) {
        companionScrollTop(0);
        stateStack.shift();
        if (navigateTo) {
            router.goto(navigateTo);
        }
    }

    function replaceState(newState) {
        companionScrollTop(0);
        stateStack._.shift();
        stateStack.unshift(Object.assign({_seq: seq++}, newState));
    }

    opts.appbar = {
        pushState,
        popState,
        replaceState,
        companionScrollTop
    };

    subscribeToRender(vm, [containerStyle, renderActions, up, title]);

    return (vm, params) => {
        const _buttons = renderActions() || (() => {});

        return appBarContainer(containerStyle(), [
            (
                up()
                ? upButtonContainer({
                    onclick: upAction()
                }, [
                    Icon({
                        name: upButton(),
                        size: 0.75,
                    })
                ])
                : null
            ),
            titleContainer(title()),
            headerRight(_buttons())
        ]);
    };
}

const appBarContainer = styled({
    justifyContent: 'space-between',
    padding: '1em',
    zIndex: 1000,
    display: 'flex',
    alignItems: 'center',
    width: '100%',
    transition: 'opacity .13s cubic-bezier(0.0,0.0,0.2,1)',
});

const upButtonContainer = styled({
    marginRight: '1em',
}, CLICKABLE);

const headerRight = styled({
    display: 'flex',
    alignItems: 'center'
});

const titleContainer = styled({
    fontSize: '20pt',
    flex: 1
});
