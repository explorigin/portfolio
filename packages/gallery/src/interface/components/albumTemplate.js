import {
    defineView as vw,
    defineElement as el,
    patchRefStyle,
    patchNodeStyle
} from '../../utils/domvm.js';
import { injectStyle, styled } from '../../services/style.js';

import { Icon } from './icon.js';
import { AlbumPhotoTemplate } from './albumPhotoTemplate.js';


export function AlbumTemplate(params) {
    const { id, title, photos } = params;
    const albumSelectButtonRef = `albSel${id}`;

    return Album({
        onmouseenter: [patchRefStyle, albumSelectButtonRef, "opacity: 0.7;"],
        onmouseleave: [patchRefStyle, albumSelectButtonRef, "opacity: 0;"],
    }, [
        albumTitle([
            title,
            albumSelectButton({
                _ref: albumSelectButtonRef,
                onmouseenter: [patchNodeStyle, "opacity: 1;"],
                onmouseleave: [patchNodeStyle, "opacity: 0.7;"],
            }, [
                Icon({ name: "check_circle", size: 0.25 })
            ])
        ]),
        albumContent( photos.map(AlbumPhotoTemplate) )
    ]);
}

const Album = styled({
    margin: "10px"
});

const albumTitle = styled({
    display: "flex",
    alignItems: "center"
});

const albumContent = styled({
    display: "flex",
    alignItems: "flex-start",
    userSelect: "none"
});

const albumSelectButton = styled({
    paddingLeft: "0.5em",
    cursor: "pointer",
    opacity: 0,  // TODO onhover 0.7
    transition: "transform 0.135s cubic-bezier(0, 0, 0.2, 1), opacity 0.135s cubic-bezier(0, 0, 0.2, 1)"
})
