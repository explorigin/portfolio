import {
    defineView as vw,
    defineElement as el,
    patchRefStyle,
    patchNodeStyle
} from '../utils/domvm.js';
import { injectStyle, styled } from '../services/style.js';
import { DEFAULT_TRANSITION, CLICKABLE } from './styles.js';
import { Icon } from './components/icon.js';
import { SectionPhoto } from './sectionPhoto.js';
import { extractID } from '../utils/conversion.js';


export function SectionView(vm, params, key, context) {
    const { appbar } = context;
    const { title, photos } = params;
    const sectionSelectButtonRef = `secSel${key}`;

    return function render(vm, params) {
        const { selectedIds, selectMode } = params;

        function photoTemplate(doc) {
            return vw(SectionPhoto, {
                doc,
                isSelected: selectedIds.has(doc._id),
                selectMode
            }, doc._hash(), context);
        }

        return sectionContainer({
            class: 'section',
            onmouseenter: [patchRefStyle, sectionSelectButtonRef, "opacity: 0.7;"],
            onmouseleave: [patchRefStyle, sectionSelectButtonRef, "opacity: 0;"],
            _data: {
                type: 'section',
                sectionImageIds: photos.map(extractID)
            }
        }, [
            sectionTitle([
                title,
                sectionSelectButton({
                    class: 'sectionSelectButton',
                    _ref: sectionSelectButtonRef,
                    onmouseenter: [patchNodeStyle, "opacity: 1;"],
                    onmouseleave: [patchNodeStyle, "opacity: 0.7;"],
                    css: {
                        opacity: selectMode ? 0.7 : 0
                    },
                }, [
                    Icon({ name: "check_circle", size: 0.25 })
                ])
            ]),
            sectionContent( photos.map(photoTemplate) )
        ]);
    };
}

const sectionContainer = styled({
    margin: "10px"
});

const sectionTitle = styled({
    display: "flex",
    alignItems: "center"
});

const sectionContent = styled({
    display: "flex",
    alignItems: "flex-start",
    userSelect: "none"
});

const sectionSelectButton = styled(DEFAULT_TRANSITION, CLICKABLE, {
    paddingLeft: "0.5em",
    opacity: 0
});
