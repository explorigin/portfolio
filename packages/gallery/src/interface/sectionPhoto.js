import { prop } from 'frptools';

import {
    defineView as vw,
    defineElement as el,
    patchRefStyleMap,
    patchNodeStyle,
    subscribeToRender
} from '../utils/domvm.js';
import { router } from '../services/router.js';
import { injectStyle, styled } from '../services/style.js';
import { DEFAULT_TRANSITION, FILL_STYLE, IMAGE_MARGIN, CLICKABLE } from './styles.js';
import { Icon } from './components/icon.js';
import { AttachmentImageView } from './components/attachmentImage.js';


export function SectionPhoto(vm, { doc }) {
    const photoSelectButtonRef = `pSB${doc._id}`;
    const photoOverlayRef = `pBkd${doc._id}`;
    const href = router.href('focus', {id: doc._id});
    const hover = prop(false);
    const hoverSelectButton = prop(false);

    subscribeToRender(vm, [hover, hoverSelectButton]);

    return function render(vm, { isSelected, selectMode, width, height }) {
        return photoContainer({
            href,
            class: 'sectionPhoto',
            onmouseenter: [hover, true],
            onmouseleave: [hover, false],
            css: {
                cursor: selectMode ? CLICKABLE.cursor : 'zoom-in',
            },
            style: {
                width,
                height
            },
            _data: doc,
        }, [
            AttachmentImageView({
                src: doc.sizes.thumbnail || doc.sizes.full,
                css: {
                    transform: isSelected ? 'translateZ(-50px)' : null
                },
                style: {
                    width,
                    height
                },
            }),
            photoSelectButton({
                _ref: photoSelectButtonRef,
                class: 'photoSelect',
                css: {
                    backgroundColor: isSelected ? 'white' : 'transparent',
                    opacity: (isSelected || hoverSelectButton()) ? 1 : selectMode || hover() ? 0.7 : 0,
                },
                onmouseenter: [hoverSelectButton, true],
                onmouseleave: [hoverSelectButton, false],
            }, [
                Icon({
                    name: selectMode && !isSelected && !hover() ? "circle_o" : "check_circle" ,
                    size: 0.75,
                    fill: isSelected ? '#00C800' : '#fff',
                })
            ]),
            photoOverlay({
                _ref: photoOverlayRef,
                class: 'photoOverlay',
                css: {
                    transform: isSelected ? 'translateZ(-50px)' : null,
                    opacity: (selectMode || hover()) ? 0.7 : 0,
                },
                style: {
                    width,
                    height
                },
            })
        ]);
    };
}


const photoContainer = styled('a', {
    position: 'relative',
    perspective: '1000px',
    backgroundColor: '#eee',
    margin: `${IMAGE_MARGIN}px`,
    cursor: 'zoom-in',
    display: 'inline-block'
});

const image = styled('img', FILL_STYLE, DEFAULT_TRANSITION, {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 0
});

const photoSelectButton = styled(DEFAULT_TRANSITION, CLICKABLE,{
    position: 'absolute',
    top: '4%',
    left: '4%',
    zIndex: 2,
    display: 'flex',
    borderRadius: '50%',
    padding: '2px',
    backgroundColor: 'transparent',
    opacity: 0,
});

const photoOverlay = styled(FILL_STYLE, DEFAULT_TRANSITION, {
    position: 'absolute', // Unnecessary but helps with a rendering bug in Chrome. https://gitlab.com/explorigin/gallery/issues/1
    top: '0px',
    left: '0px',
    zIndex: 1,
    backgroundImage: 'linear-gradient(to bottom,rgba(0,0,0,0.26),transparent 56px,transparent)',
});
