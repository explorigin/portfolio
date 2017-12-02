import { defineView as vw, defineElement as el } from '../../utils/domvm.js';
import { injectStyle, styled } from '../../services/style.js';

import { Icon } from './icon.js';
import { AttachmentImageView } from './attachmentImage.js';


function setRefStyle(ref, style, evt, node, vm) {
    vm.refs[ref].patch({style});
}

export function AlbumTemplate(params) {
    const { id, title, photos } = params;

    return Album({
        onmouseenter: [setRefStyle, 'selectButton', "opacity: 0.7;"],
        onmouseleave: [setRefStyle, 'selectButton', "opacity: 0;"],
    }, [
        albumTitle([
            title,
            albumSelectButton({
                _ref: 'selectButton',
                onmouseenter: [setRefStyle, 'selectButton', "opacity: 1;"],
                onmouseleave: [setRefStyle, 'selectButton', "opacity: 0.7;"],

            }, [
                Icon({ name: "check_circle", size: 0.25 })
            ])
        ]),
        albumContent()
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
