import { prop, computed, container } from 'frptools';

import {
    subscribeToRender,
    defineView,
    nodeParentWithType,
    fullViewportSize,
    defineElement as el,
    injectView as iv
} from '../utils/domvm.js';

import { router } from '../services/router.js';
import { ImageType } from '../data/image.js';
import { pouchDocHash, pick } from '../utils/conversion.js';
import { AttachmentImageView } from './components/attachmentImage.js';
import { Overlay } from './components/overlay.js';
import { Icon } from './components/icon.js';
import { AppBar } from './components/appbar.js';
import { styled, injectStyle } from '../services/style.js';
import { error } from '../services/console.js';
import { CLICKABLE, FILL_STYLE } from './styles.js';


export function FocusView(vm, params) {
    const id = prop();
    const doc = prop({}, pouchDocHash);
    const nextLink = prop();
    const prevLink = prop();
    const mouseActive = prop(true);
    let mouseMoveTimeout = null;

    const appBarStyle = computed(
        mA => ({
            position: 'fixed',
            opacity: mA ? 1 : 0,
            backgroundImage: 'linear-gradient(0deg,rgba(0,0,0,0),rgba(0,0,0,0.4))'
        }),
        [mouseActive],
        s => s.opacity
    );
    const imageStyle = computed(({ width: iw, height: ih }, { width: vw, height: vh }) => {
        const imageRatio = iw / ih;
        const windowRatio = vw / vh;
        if (iw < vw && ih < vh) {
            return {
                height: ih,
                width: iw
            }
        }
        if (windowRatio > imageRatio) {
            return {
                height: vw / windowRatio,
                width: vw / windowRatio * imageRatio
            }
        }
        return {
            height: vh * windowRatio / imageRatio,
            width: vh * windowRatio
        }
    }, [doc, fullViewportSize]);

    function navBack() {
        router.goto('home');
    }

    async function clickTrash() {
        if (confirm('Delete this image?')) {
            await ImageType.delete(id());
            navBack();
        }
    }

    const mouseLeave = () => {
        mouseActive(false);
    };

    const mouseMove = () => {
        if (mouseMoveTimeout !== null) {
            clearTimeout(mouseMoveTimeout);
        }
        mouseMoveTimeout = setTimeout(mouseLeave, 3000);
        mouseActive(true);
    };

    const mouseClick = () => {
        if (mouseMoveTimeout !== null) {
            clearTimeout(mouseMoveTimeout);
        }
        mouseActive(!mouseActive());
    }

    // Subscribe to our changables.
    subscribeToRender(vm, [
        doc,
        nextLink,
        prevLink,
        appBarStyle,
        // Look for our image and set it.
        () => id.subscribe(async _id => {
            if (!_id) {
                return;
            }
            doc(await ImageType.find(_id));

            const n = await ImageType.next(_id);
            nextLink(n.length ? router.href('focus', {id: n[0].id}) : null);
            const p = await ImageType.next(_id, true);
            prevLink(p.length ? router.href('focus', {id: p[0].id}) : null);
        })
    ], true);

    // Watch for focus changes
    vm.config({ hooks: { willUpdate: (vm, { vars }) => id(vars.id) }});

    // Start navigation
    id(params.vars.id);
    mouseMove();

    return function() {
        const _id = doc() && doc()._id;

        if (!_id) {
            return Overlay('Loading...');
        }

        return focusContainer({
            class: 'focus',
            onmousemove: mouseMove,
            onmouseleave: mouseLeave,
            onclick: mouseClick,
        }, [
            AppBar({
                style: appBarStyle(),
                title: '',
                up: { action: navBack, fill: 'white' },
                actions: [
                    trashButtonContainer({
                        onclick: clickTrash
                    }, [
                        Icon({
                            name: "trash" ,
                            size: 0.75,
                            fill: 'white'
                        })
                    ])
                ]
            }),
            focusContent([
                (
                    prevLink()
                    ? prevClickZone({href: prevLink()}, [
                        Icon({
                            name: "chevron_left" ,
                            size: 0.75,
                            fill: 'white'
                        })
                    ])
                    : null
                ),
                AttachmentImageView({
                    src: _id ? doc().sizes.full : null,
                    style: imageStyle
                }),
                (
                    nextLink()
                    ? nextClickZone({href: nextLink()}, [
                        Icon({
                            name: "chevron_right" ,
                            size: 0.75,
                            fill: 'white',
                        })
                    ])
                    : null
                )
            ])
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
    overflow: 'hidden',
    flexDirection: 'column',
    alignItems: 'center',
    backgroundColor: 'black'
}, FILL_STYLE);

const focusContent = styled({
    flex: 1,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center'
});

const nextClickZone = styled('a', {
    right: '0px',
    justifyContent: 'flex-end'
}, CSS_CLICK_ZONE);

const prevClickZone = styled('a', {
    left: '0px',
    justifyContent: 'flex-start',
}, CSS_CLICK_ZONE);
