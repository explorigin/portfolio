import { prop } from 'frptools';

import {
    defineView as vw,
    defineElement as el,
    patchRefStyleMap,
    patchNodeStyle,
    subscribeToRender
} from '../../utils/domvm.js';
import { injectStyle, styled } from '../../services/style.js';
import { DEFAULT_TRANSITION, CSS_FULL_SIZE, IMAGE_MARGIN, CLICKABLE } from '../styles.js';
import { Icon } from './icon.js';
import { AttachmentImageView } from './attachmentImage.js';


const _imageHover = false;
const dim = "opacity: 0.7;";
const off = "opacity: 0;";
const full = "opacity: 1;";


export function AlbumPhotoTemplate(vm, { doc }) {
    const photoSelectButtonRef = `pSB${doc._id}`;
    const photoOverlayRef = `pBkd${doc._id}`;
    const hover = prop(false);
    const hoverSelectButton = prop(false);

    subscribeToRender(vm, [hover, hoverSelectButton]);

    return function render(vm, { isSelected, selectMode }) {
        return photoContainer({
            class: 'photoContainer',
            onmouseenter: [hover, true],
            onmouseleave: [hover, false],
            css: {
                cursor: selectMode ? CLICKABLE.cursor : 'zoom-in'
            },
            _data: doc,
        }, [
            AttachmentImageView(doc, {
                css: {
                    transform: isSelected ? 'translateZ(-50px)' : null
                }
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
                }
            })
        ]);
    };
}


const photoContainer = styled({
    position: 'relative',
    perspective: '1000px',
    backgroundColor: '#eee',
    margin: `${IMAGE_MARGIN}px`,
    cursor: 'zoom-in'
});

const image = styled('img', CSS_FULL_SIZE, DEFAULT_TRANSITION, {
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

const photoOverlay = styled(CSS_FULL_SIZE, DEFAULT_TRANSITION, {
    position: 'absolute', // Unnecessary but helps with a rendering bug in Chrome. https://gitlab.com/explorigin/gallery/issues/1
    top: '0px',
    left: '0px',
    zIndex: 1,
    backgroundImage: 'linear-gradient(to bottom,rgba(0,0,0,0.26),transparent 56px,transparent)',
});
