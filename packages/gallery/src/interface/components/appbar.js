import { prop, computed, container } from 'frptools';

import { Icon } from './icon.js';
import { defineElement as el, subscribeToRender } from '../../utils/domvm.js';
import { injectStyle, styled } from '../../services/style.js';
import { pick } from '../../utils/conversion.js';

let seq = 0;
const getSeq = pick('_seq');

export function AppBarView(vm, params, key, opts) {
    const stateStack = container([], arr => arr.length);
    const companionScrollTop = prop(0);
    const previousState = prop({_seq: seq}, getSeq);

    const currentState = computed(stack => stack[0] || {}, [stateStack]);
    const title = computed(state => state.title || '', [currentState]);
    const renderButtons = computed(state => state.buttons, [currentState]);
    const hasBackButton = computed(stack => stack.length > 1, [stateStack]);
    const stateChange = computed(
        (c, p) => ({ newState: c, oldState: p }),
        [currentState, previousState]
    );

    const boxShadowStyle = computed(t => (
        t === 0 ? 'none' : `0px ${Math.min(t/10, 3)}px 3px rgba(0, 0, 0, .2)`
    ), [companionScrollTop]);

    if (opts.appbar) {
        throw new Error('Cannot have more than one AppBar.');
    }

    function pushState(newState) {
        const oldState = currentState() || {};
        stateStack.unshift(Object.assign({_seq: seq++}, newState));
        previousState(oldState);
    }

    function popState() {
        const oldState = currentState();
        stateStack.shift();
        previousState(oldState);
    }

    opts.appbar = {
        pushState,
        popState,
        companionScrollTop,
        subscribe: stateChange.subscribe
    };

    subscribeToRender(vm, [boxShadowStyle, renderButtons, hasBackButton, title]);

    return (vm, params) => {
        const _buttons = renderButtons() || (() => {});

        return header({
            css: { boxShadow: boxShadowStyle() }
        }, [
            (
                hasBackButton()
                ? backButtonContainer([
                    Icon({
                        name: "arrow_left" ,
                        size: 0.75,
                        attrs: {
                            onclick: popState
                        }
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
});

const headerRight = styled({
    display: 'flex',
    alignItems: 'center'
});

const titleContainer = styled({
    fontSize: '20pt',
    flex: 1
});
