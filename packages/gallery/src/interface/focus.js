import { prop, computed, container } from 'frptools';

import {
    subscribeToRender,
    defineView,
    nodeParentWithType,
    viewportSize,
    defineElement as el
} from '../utils/domvm.js';

import { router } from '../services/router.js';
import { ImageType } from '../data/image.js';
import { pouchDocHash, pick } from '../utils/conversion.js';
import { AttachmentImageView } from './components/attachmentImage.js';
import { Overlay } from './components/overlay.js';
import { Icon } from './components/icon.js';
import { styled, injectStyle } from '../services/style.js';
import { error } from '../services/console.js';
import { CLICKABLE } from './styles.js';


export function FocusView(vm, params, key, { appbar }) {
    const id = prop();
    const doc = prop(null, pouchDocHash);
    const { body } = document;
    const nextLink = prop();
    const prevLink = prop();

    const imageStyle = computed(({ width: iw, height: ih }, { width: vw, height: vh }) => {
        const imageRatio = iw / ih;
        const windowRatio = vw / vh;

        if (windowRatio > imageRatio) {
            return {
                height: vw / windowRatio,
                width: vw / windowRatio * imageRatio
            }
        } else {
            return {
                height: vh * windowRatio / imageRatio,
                width: vh * windowRatio
            }
        }
    }, [doc, viewportSize]);

    function navBack() {
        appbar.popState('home');
    }

    async function clickTrash() {
        await ImageType.delete(id());
        navBack();
    }

    function renderAppBarButtons() {
        return [
            trashButtonContainer({
                onclick: clickTrash
            }, [
                Icon({
                    name: "trash" ,
                    size: 0.75,
                })
            ])
        ];
    }

    // Set the appbar title.
    appbar.pushState({
        title: '',
        actions: renderAppBarButtons,
        style: {position: 'fixed'},
        up: {
            navigateTo: 'home'
        }
    });

    // Subscribe to our changables.
    subscribeToRender(vm, [doc, imageStyle, nextLink, prevLink], [
        // Look for our image and set it.
        id.subscribe(async _id => {
            if (!_id) {
                return;
            }
            const image = await ImageType.find(_id)
            doc(image);

            Promise.all([
                ImageType.find({"_id": {$lt: _id}}, {limit: 2, sort: [{_id: 'desc'}]}),
                ImageType.find({"_id": {$gt: _id}}, {limit: 2})
            ]).then(([prev, next]) => {
                nextLink(next.length ? router.href('focus', {id: next[0]._id}) : null);
                prevLink(prev.length ? router.href('focus', {id: prev[0]._id}) : null);
            });
        })
    ]);

    // Watch for focus changes
    vm.config({ hooks: { willUpdate: (vm, { vars }) => id(vars.id) }});

    // Start navigation
    id(params.vars.id);

    return function() {
        const _id = doc() && doc()._id;

        if (!_id) {
            return Overlay('Loading...');
        }

        return focusContainer({ class: 'focus' }, [
            (
                prevLink()
                ? prevClickZone({href: prevLink()}, [
                    Icon({
                        name: "chevron_left" ,
                        size: 0.75,
                    })
                ])
                : null
            ),
            AttachmentImageView({
                src: _id ? doc().sizes.full : null,
                style: imageStyle()
            }),
            (
                nextLink()
                ? nextClickZone({href: nextLink()}, [
                    Icon({
                        name: "chevron_right" ,
                        size: 0.75,
                    })
                ])
                : null
            )
        ]);
    };
}

const WIDE = injectStyle({width: "100%"});
const TALL = injectStyle({height: "100%"});
const CSS_CLICK_ZONE = {
    'position': 'absolute',
    'width': '33%',
    'height': '70%',
    'display': 'flex',
    'alignItems': 'center',
    'padding': '2em',
    'top': '15%',
    'transition': 'opacity .13s cubic-bezier(0.0,0.0,0.2,1)',
    'opacity': 0,
    'cursor': 'pointer',
    ':hover': {
        opacity: 1
    }
};

const trashButtonContainer = styled({
    marginRight: '1em',
}, CLICKABLE);

const focusContainer = styled({
    display: 'flex',
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden'
});

const nextClickZone = styled('a', {
    right: '0px',
    justifyContent: 'flex-end'
}, CSS_CLICK_ZONE);

const prevClickZone = styled('a', {
    left: '0px',
    justifyContent: 'flex-start',
}, CSS_CLICK_ZONE);
