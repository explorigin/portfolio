import partition from 'linear-partitioning';
import { prop, computed, container } from 'frptools';

import {
    defineView as vw,
    defineElement as el,
    patchRefStyle,
    patchNodeStyle,
    subscribeToRender,
    availableViewportSize
} from '../utils/domvm.js';
import { injectStyle, styled } from '../services/style.js';
import { DEFAULT_TRANSITION, CLICKABLE, IMAGE_MARGIN, CONTENT_MARGIN } from './styles.js';
import { Icon } from './components/icon.js';
import { SectionPhoto } from './sectionPhoto.js';
import { extractID, sum } from '../utils/conversion.js';

const OPTIMAL_IMAGE_HEIGHT = 140;
const ROW_HEIGHT_CUTOFF_MODIFIER = 2;

const IMAGE_MARGIN_WIDTH = 2 * IMAGE_MARGIN;
const CONTENT_MARGIN_WIDTH = 2 * CONTENT_MARGIN;

const aspectRatio = img => img.width / img.height;

export function SectionView(vm, params, key) {
    const { title, photos } = params;
    const sectionSelectButtonRef = `secSel${key}`;
    const photoArray = container(photos || [], pArr => pArr.map(extractID).join(','));
    const sections = computed(
        (pArr, { width: vw }) => {
            const availableWidth = vw - CONTENT_MARGIN_WIDTH;
            const aspectRatios = pArr.map(aspectRatio);
            const totalImageRatio = sum(aspectRatios);
            const rowCount = Math.ceil(totalImageRatio * OPTIMAL_IMAGE_HEIGHT / availableWidth);
            const rowRatios = partition(aspectRatios, rowCount);

            let index = 0;

            const result = rowRatios.map(row => {
                const rowTotal = sum(row);
                const imageRatio = row[0];
                const portion = imageRatio / rowTotal;
                let rowHeight = availableWidth * portion / aspectRatio(pArr[index]);
                if (rowHeight > OPTIMAL_IMAGE_HEIGHT * ROW_HEIGHT_CUTOFF_MODIFIER) {
                    rowHeight = OPTIMAL_IMAGE_HEIGHT * ROW_HEIGHT_CUTOFF_MODIFIER;
                }

                const rowResult = row.map((imageRatio, imgIndex) => ({
                    photo: pArr[imgIndex + index],
                    width: imageRatio * rowHeight - IMAGE_MARGIN_WIDTH,
                    height: rowHeight
                }));

                index += row.length;
                return rowResult;
            });
            return result;
        },
        [photoArray, availableViewportSize],
    )

    photos.sort((a, b) => (a.originalDate.localeCompare(b.originalDate)));

    subscribeToRender(vm, [sections]);
    vm.config({ hooks: { willUpdate: (vm, { photos }) => photoArray.splice(0, photoArray.length, ...photos) }});

    return function render(vm, params) {
        const { selectedIds, selectMode, hover, hoverSelectButton } = params;

        function photoTemplate({ photo, width, height }) {
            return SectionPhoto({
                doc: photo,
                isSelected: selectedIds.has(photo._id),
                selectMode,
                hover,
                hoverSelectButton,
                width,
                height
            });
        }

        function sectionRowTemplate(pArr) {
            return sectionRow(pArr.map(photoTemplate));
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
            sectionContent(sections().map(sectionRowTemplate))
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
