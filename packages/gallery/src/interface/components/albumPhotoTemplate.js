import {
    defineView as vw,
    defineElement as el,
    patchRefStyleMap,
    patchNodeStyle
} from '../../utils/domvm.js';
import { injectStyle, styled } from '../../services/style.js';

import { Icon } from './icon.js';
import { AttachmentImageView } from './attachmentImage.js';


export function AlbumPhotoTemplate(doc, isSelected, selectMode) {
    const photoSelectButtonRef = `pSB${doc._id}`;
    const photoBackgroundRef = `pBkd${doc._id}`;

    return photoContainer({
        onmouseenter: [patchRefStyleMap, {[photoSelectButtonRef]: "opacity: 0.7;", [photoBackgroundRef]: "opacity: 0.7;"}],
        onmouseleave: [patchRefStyleMap, {[photoSelectButtonRef]: "opacity: 0;", [photoBackgroundRef]: "opacity: 0;"}],
    }, [
        vw(AttachmentImageView, doc, doc._hash()),
        photoSelectButton({
            _ref: photoSelectButtonRef,
            css: {
                // backgroundColor: isSelected ? 'white' : 'transparent',
                // opacity: isSelected ? 1 : selectMode || _imageHover ? 0.7 : 0,
            },
            onmouseenter: [patchNodeStyle, "opacity: 1;"],
            onmouseleave: [patchNodeStyle, "opacity: 0.7;"],
        }, [
            Icon({
                name: "check_circle",
                size: 0.75,
                fill: '#fff' // isSelected ? '#00C800' : '#fff'
            })
        ]),
        photoBackdrop({
            _ref: photoBackgroundRef,
            css: {
                // transform: isSelected ? 'translateZ(-50px)' : null,
                // opacity: selectMode || _imageHover ? 0.7 : 0,
            }
        })
    ]);
}

const IMAGE_MARGIN = 2;

const CSS_FULL_SIZE = {
    width: "100%",
    height: "100%"
}

const photoContainer = styled({
    position: 'relative',
    perspective: '1000px',
    backgroundColor: '#eee',
    margin: `${IMAGE_MARGIN}px`,
    cursor: 'zoom-in'
});

const image = styled('img', CSS_FULL_SIZE, {
    position: 'absolute',
    top: 0,
    left: 0,
    transition: 'transform .135s cubic-bezier(0.0,0.0,0.2,1)'
});

const photoSelectButton = styled({
    position: 'absolute',
    top: '4%',
    left: '4%',
    zIndex: 2,
    display: 'flex',
    transition: 'transform .135s cubic-bezier(0.0,0.0,0.2,1), opacity .135s cubic-bezier(0.0,0.0,0.2,1)',
    borderRadius: '50%',
    padding: '2px',
    backgroundColor: 'transparent',
    opacity: 0,
    cursor: 'pointer'
});

const photoBackdrop = styled(CSS_FULL_SIZE, {
    top: '0px',
    left: '0px',
    zIndex: 1,
    transition: 'transform .135s cubic-bezier(0.0,0.0,0.2,1), opacity .135s cubic-bezier(0.0,0.0,0.2,1)',
    backgroundImage: 'linear-gradient(to bottom,rgba(0,0,0,0.26),transparent 56px,transparent)',
});
