import { format } from 'date-fns';
import { prop, computed, container } from 'frptools';

import {
    subscribeToRender,
    defineView,
    nodeParentWithType,
    defineView as vw,
    defineElement as el,
    injectView as iv,
} from '../utils/domvm.js';

import { error } from '../services/console.js';
import { ImageType } from '../data/image.js';
import { pouchDocArrayHash, pouchDocHash, hashSet, extractID } from '../utils/conversion.js';
import { SectionView } from './sectionView.js';
import { Icon } from './components/icon.js';
import { AppBar } from './components/appbar.js';
import { Overlay } from './components/overlay.js';
import { injectStyle, styled } from '../services/style.js';
import { CLICKABLE } from './styles.js';


export function uploadImages(evt, files) {
    Array.from(files || evt.currentTarget.files).forEach(ImageType.upload);

    if (evt.currentTarget) {
        evt.currentTarget.value = null;
    }
}

export function AllImagesView(vm, params) {
    const model = prop({}, pouchDocHash);
    const images = container([], pouchDocArrayHash);
    const containerScrollTop = prop(0);

    const hover = prop(null);
    const hoverSelectButton = prop(null);
    const selectedIds = container(new Set(), hashSet);
    const selectMode = computed(sIds => sIds.size > 0, [selectedIds]);

    const appBarTitle = computed(
        s => s.size > 0 ? `${s.size} selected` : 'Photos',
        [selectedIds]
    );
    const appBarStyle = computed(
        t => ({
            boxShadow: t === 0 ? 'none' : `0px 3px 3px rgba(0, 0, 0, .2)`
        }),
        [containerScrollTop]
    );
    const appBarUp = computed(s => (s ? { name: 'x', action: deSelect } : undefined), [selectMode]);
    const appBarActions = computed(s => (
        s
        ? [
            trashButtonContainer({
                onclick: deleteSelectedImages
            }, [
                Icon({
                    name: "trash" ,
                    size: 0.75,
                })
            ])
        ]
        : [
            uploadButton([
                el('label', {
                    "for": 'uploadButton',
                    style: CLICKABLE
                }, [
                    Icon({
                        name: 'upload',
                        size: 0.75,
                        title: 'Upload'
                    })
                ]),
            ]),
            el('input', {
                id: 'uploadButton',
                name: 'uploadButton',
                type: 'file',
                multiple: true,
                accept: '.jpg,.jpeg,.png,.gif',
                onchange: uploadImages,
                class: injectStyle({display: 'none'})
            })
        ]
    ), [selectMode]);

    const sections = computed(imageArr => {
        const sectionMap = imageArr.reduce((acc, i) => {
            const date = i.originalDate.substr(0, 10);
            return Object.assign(acc, { [date]: (acc[date] || []).concat(i) });
        }, {});
        return Object.entries(sectionMap)
            .sort((a, b) => (a[0].localeCompare(b[0])))
            .map(([date, _images]) => ({
                title: format(date, 'MMMM D, YYYY'),
                sectionId: date,
                images: _images
            }));
    }, [images]);

    function deSelect() {
        selectedIds.clear();
    }

    function deleteSelectedImages() {
        if (confirm(`Delete ${selectedIds.size} image(s)?`)) {
            selectedIds.forEach(ImageType.delete)
            selectedIds.clear();
        }
    }

    function photoClick(evt, node, vm) {
        if (selectMode()) {
            toggleSelect(evt, node, vm);
        }
    }

    function toggleSelect(evt, node, vm) {
        evt.preventDefault();

        const imageNode = nodeParentWithType(node, 'image');
        const id = imageNode.data._id;
        if (selectedIds.has(id)) {
            selectedIds.delete(id);
        } else {
            selectedIds.add(id);
        }
    }

    function toggleAll(evt, node, vm) {
        const sectionNode = nodeParentWithType(node, 'section');
        const { sectionImageIds } = sectionNode.data;
        const selected = sectionImageIds.filter(i => selectedIds.has(i));
        if (sectionImageIds.length === selected.length) {
            sectionImageIds.forEach(i => selectedIds.delete(i));
        } else {
            sectionImageIds.forEach(i => selectedIds.add(i));
        }
    }

    function handleContentScroll(evt) {
        containerScrollTop(evt.target.scrollTop);
    }

    ImageType.find({
        ["sizes.thumbnail"]: {$exists: true}
    }, { live: true }).then(la => {
        subscribeToRender(vm, [
            selectedIds,
            images,
            selectMode,
            appBarStyle,
            hover,
            hoverSelectButton,
            () => la.subscribe(res => images.splice(0, images.length, ...res))
        ]);
    });

    function renderSection({title, sectionId, images: _images}) {
        return vw(SectionView, {
            title,
            photos: _images,
            selectedIds,
            selectMode: selectMode(),
            hover,
            hoverSelectButton
        }, sectionId);
    }

    return function() {
        const _sections = sections();
        const hasPhotos = !!_sections.length;

        return allImagesContainer({
            class: 'allImages',
        }, [
            AppBar({
                style: appBarStyle(),
                title: appBarTitle(),
                actions: appBarActions(),
                up: appBarUp()
            }),
            allImagesContent({
                onscroll: handleContentScroll,
                onclick: {
                    '.photoSelect .icon svg path': toggleSelect,
                    '.photoSelect .icon': toggleSelect,
                    '.sectionSelectButton .icon': toggleAll,
                    '.sectionSelectButton .icon svg path': toggleAll,
                    '.photoOverlay': photoClick
                },
                style: {overflowY: hasPhotos ? 'scroll' : 'hidden'}
            },
            (
                hasPhotos
                ? _sections.map(renderSection)
                : [Overlay({
                    textAlign: 'center',
                    padding: '5%'
                }, [
                    el('h1', 'Welcome'),
                    el('p', [
                        'To get started, drag some photos from your desktop or click on the ',
                        el('label', {
                            "for": 'uploadButton',
                            style: Object.assign({margin: '0px 3px'}, CLICKABLE)
                        }, [Icon({
                            name: 'upload',
                            size: 0.75,
                            title: 'Upload',
                            style: {verticalAlign: 'middle'}
                        })]),
                        'button.'
                    ])
                ])]
            ))
        ]);
    };
}

const trashButtonContainer = styled({
    marginRight: '1em',
}, CLICKABLE);

const uploadButton = styled({
    marginRight: '1em',
}, CLICKABLE);

const allImagesContainer = styled({
    display: 'flex',
    flexDirection: 'column',
    flex: 1
});
const allImagesContent = styled({
    flex: 1
});
