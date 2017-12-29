import { prop, computed, container } from 'frptools';

import {
    subscribeToRender,
    defineView,
    nodeParentWithType,
    defineElement as el
} from '../utils/domvm.js';

import { ImageType } from '../data/image.js';
import { pouchDocHash, pick } from '../utils/conversion.js';
import { AttachmentImageView } from './components/attachmentImage.js';
import { Overlay } from './components/overlay.js';
import { Icon } from './components/icon.js';
import { styled, injectStyle } from '../services/style.js';
import { error } from '../services/console.js';
import { CLICKABLE } from './styles.js';




export function FocusView(vm, params, key, { appbar }) {
    const id = params.vars.id;
    const { body } = document;
    const windowSize = prop({}, o => o ? `${o.width}x${o.height}`: '');

    const extractWindowSize = () => windowSize({width: window.innerWidth, height: window.innerHeight});

    const doc = container({}, pouchDocHash);

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
    }, [doc, windowSize]);

    async function goBack() {
        history.go(-1);
    }

    function navBack() {
        // appbar.popState();
        goBack();
    }

    async function clickTrash() {
        await ImageType.delete(id);
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

    // Prime our window size
    extractWindowSize();
    window.addEventListener('resize', extractWindowSize);

    // Set the appbar title.
    appbar.pushState({ title: '', buttons: renderAppBarButtons, style: {position: 'fixed'} });

    // Look for our image and set it.
    ImageType.find(id).then(d => {
        doc.src = d.sizes.full || d.sizes.preview || d.sizes.thumbnail;
        doc.width = d.width;
        doc.height = d.height;
        doc._id = d._id;
    }).catch(error);

    // Subscribe to our changables.
    subscribeToRender(vm, [doc, imageStyle], [
        appbar.subscribe(goBack),
        () => window.removeEventListener('resize', extractWindowSize)
    ]);

    return function() {
        if (!doc._id) {
            return Overlay('Loading...');
        }
        return focusContainer([
            AttachmentImageView({
                src: doc._id ? doc.src : null,
                style: imageStyle()
            })
        ]);
    };
}

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

const WIDE = injectStyle({width: "100%"});
const TALL = injectStyle({height: "100%"});
