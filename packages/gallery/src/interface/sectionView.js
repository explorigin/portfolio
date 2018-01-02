import partition from 'linear-partitioning';

import {
    defineView as vw,
    defineElement as el,
    patchRefStyle,
    patchNodeStyle,
    subscribeToRender,
    viewportSize
} from '../utils/domvm.js';
import { injectStyle, styled } from '../services/style.js';
import { DEFAULT_TRANSITION, CLICKABLE, IMAGE_MARGIN, CONTENT_MARGIN } from './styles.js';
import { Icon } from './components/icon.js';
import { SectionPhoto } from './sectionPhoto.js';
import { extractID } from '../utils/conversion.js';

const OPTIMAL_IMAGE_HEIGHT = 140;
const ROW_HEIGHT_CUTOFF_MODIFIER = 2;

const IMAGE_MARGIN_WIDTH = 2 * IMAGE_MARGIN;

const aspectRatio = (img, margin=0) => (img.width + margin) / (img.height + margin);

export function SectionView(vm, params, key, context) {
    const { appbar } = context;
    const { title, photos } = params;
    const sectionSelectButtonRef = `secSel${key}`;

    function calculateSections(photos) {
        const { width: vw } = viewportSize();
        const availableWidth = vw - CONTENT_MARGIN;
        const totalImageRatio = photos.reduce((acc, img) => acc + aspectRatio(img, IMAGE_MARGIN_WIDTH), 0);
        const rowCount = Math.ceil(totalImageRatio * OPTIMAL_IMAGE_HEIGHT / availableWidth);
        const rowRatios = partition(photos.map(aspectRatio), rowCount);

        let index = 0;

        const result = rowRatios.map(row => {
            const rowTotal = row.reduce((acc, r) => (acc + r), 0);
            const imageRatio = row[0];
            const portion = imageRatio / rowTotal;
            let rowHeight = availableWidth * portion / aspectRatio(photos[index]);
            if (rowHeight > OPTIMAL_IMAGE_HEIGHT * ROW_HEIGHT_CUTOFF_MODIFIER) {
                rowHeight = OPTIMAL_IMAGE_HEIGHT * ROW_HEIGHT_CUTOFF_MODIFIER;
            }

            const rowResult = row.map((imageRatio, imgIndex) => ({
                photo: photos[imgIndex + index],
                width: imageRatio * rowHeight - IMAGE_MARGIN_WIDTH,
                height: rowHeight
            }));

            index += row.length;
            return rowResult;
        });
        return result;
    }

    subscribeToRender(vm, [viewportSize]);

    return function render(vm, params) {
        const { selectedIds, selectMode } = params;

        function photoTemplate({ photo, width, height }) {
            return vw(SectionPhoto, {
                doc: photo,
                isSelected: selectedIds.has(photo._id),
                selectMode,
                width,
                height
            }, photo._hash(), context);
        }

        function sectionRowTemplate(photos) {
            return sectionRow(photos.map(photoTemplate));
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
            sectionContent(
                calculateSections(photos).map(sectionRowTemplate)
            )
        ]);
    };
}

const sectionContainer = styled({
    margin: `${CONTENT_MARGIN}px`,
    flexDirection: 'column'
});

const sectionTitle = styled({
    display: 'flex',
    alignItems: 'center'
});

const sectionContent = styled({
    display: 'flex',
    alignItems: 'flex-start',
    flexDirection: 'column'
});

const sectionRow = styled({
    flexDirection: 'row',
    flex: 1,
    userSelect: 'none'
});

const sectionSelectButton = styled(DEFAULT_TRANSITION, CLICKABLE, {
    paddingLeft: '0.5em',
    opacity: 0
});
