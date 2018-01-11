import { prop, computed, container, pick } from 'frptools';

import { Icon } from './icon.js';
import { defineElement as el } from '../../utils/domvm.js';
import { injectStyle, styled } from '../../services/style.js';
import { CLICKABLE } from '../styles.js';

export function AppBar(params) {
    const { title, up, actions } = params;
    const props = Object.assign({}, params);

    delete props.title;
    delete props.up;
    delete props.actions;

    const upProps = Object.assign({}, up || {})
    const { button, action } = upProps;

    delete upProps.button;
    delete upProps.action;

    return appBarContainer(props, [
        (
            up
            ? upButtonContainer({
                onclick: up.action
            }, [
                Icon(Object.assign({
                    name: up.button || 'arrow_left',
                    size: 0.75,
                    style: {verticalAlign: 'middle'}
                }, upProps))
            ])
            : null
        ),
        titleContainer(title),
        actionContainer(actions)
    ]);
};

const appBarContainer = styled({
    justifyContent: 'space-between',
    padding: '1em',
    zIndex: 1000,
    display: 'flex',
    alignItems: 'center',
    width: '100%',
    transition: 'opacity .5s cubic-bezier(0.0,0.0,0.2,1)',
});

const upButtonContainer = styled({
    marginRight: '1em',
}, CLICKABLE);

const actionContainer = styled({
    display: 'flex',
    alignItems: 'center'
});

const titleContainer = styled({
    fontSize: '20pt',
    flex: 1
});
