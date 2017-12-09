import {
    defineView as vw,
    defineElement as el,
    patchRefStyle,
    patchNodeStyle
} from '../../utils/domvm.js';
import { injectStyle, styled } from '../../services/style.js';
import { DEFAULT_TRANSITION } from '../styles.js';
import { Icon } from './icon.js';
import { AlbumPhotoTemplate } from './albumPhotoTemplate.js';
import { extractID } from '../../utils/conversion.js';


export function AlbumTemplate(params) {
    const { id, title, photos, selectedIds, selectMode } = params;
    const albumSelectButtonRef = `albSel${id}`;

    function photoMap(doc) {
        return vw(AlbumPhotoTemplate, {
            doc,
            isSelected: selectedIds.has(doc._id),
            selectMode
        }, doc._hash());
    }

    return Album({
        onmouseenter: [patchRefStyle, albumSelectButtonRef, "opacity: 0.7;"],
        onmouseleave: [patchRefStyle, albumSelectButtonRef, "opacity: 0;"],
        _data: {
            type: 'section',
            sectionImageIds: photos.map(extractID)
        }
    }, [
        albumTitle([
            title,
            albumSelectButton({
                _ref: albumSelectButtonRef,
                onmouseenter: [patchNodeStyle, "opacity: 1;"],
                onmouseleave: [patchNodeStyle, "opacity: 0.7;"],
                css: {
                    opacity: selectMode ? 0.7 : 0
                },
                class: 'albumSelectButton'
            }, [
                Icon({ name: "check_circle", size: 0.25 })
            ])
        ]),
        albumContent( photos.map(photoMap) )
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

const albumSelectButton = styled(DEFAULT_TRANSITION, {
    paddingLeft: "0.5em",
    cursor: "pointer",
    opacity: 0
});
