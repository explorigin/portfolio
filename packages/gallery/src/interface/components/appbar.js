import { prop, computed, container } from 'frptools';

import { Icon } from './icon.js';
import { defineElement as el, subscribeToRender } from '../../utils/domvm.js';
import { injectStyle, styled } from '../../services/style.js';
import { CLICKABLE } from '../styles.js';

let seq = 0;

export function AppBarView(vm, params, key, opts) {
    let previousState = {_seq: seq};
    const stateStack = container([], arr => arr.length);
    const companionScrollTop = prop(0);

    const currentState = computed(stack => stack[0] || {}, [stateStack]);
    const title = computed(state => state.title || '', [currentState]);
    const renderButtons = computed(state => state.buttons, [currentState]);
    const backButton = computed(
        (state, stack) => (
            stack.length > 1
            ? (state.backButton !== undefined ? state.backButton : 'arrow_left')
            : null
        ),
        [currentState, stateStack]
    );
    const stateChange = computed(
        c => ({ newState: c, oldState: previousState }),
        [currentState]
    );

    const boxShadowStyle = computed(t => (
        t === 0 ? 'none' : `0px ${Math.min(t/10, 3)}px 3px rgba(0, 0, 0, .2)`
    ), [companionScrollTop]);

    if (opts.appbar) {
        throw new Error('Cannot have more than one AppBar.');
    }

    function pushState(newState) {
        previousState = currentState();
        stateStack.unshift(Object.assign({_seq: seq++}, newState));
    }

    function popState() {
        previousState = currentState();
        stateStack.shift();
    }

    opts.appbar = {
        pushState,
        popState,
        companionScrollTop,
        subscribe: stateChange.subscribe
    };

    subscribeToRender(vm, [boxShadowStyle, renderButtons, backButton, title]);

    return (vm, params) => {
        const _buttons = renderButtons() || (() => {});

        return header({
            css: { boxShadow: boxShadowStyle() }
        }, [
            (
                backButton() !== null
                ? backButtonContainer({
                    onclick: popState
                }, [
                    Icon({
                        name: backButton(),
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

const header = styled({
    justifyContent: 'space-between',
    padding: '1em',
    zIndex: 1000,
    display: 'flex',
    alignItems: 'center',
});

const backButtonContainer = styled({
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
