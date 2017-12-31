import { format } from 'date-fns';
import { prop, computed, container } from 'frptools';

import {
    subscribeToRender,
    defineView,
    nodeParentWithType,
    defineView as vw,
    defineElement as el
} from '../utils/domvm.js';

import { error } from '../services/console.js';
import { ImageType } from '../data/image.js';
import { pouchDocArrayHash, pouchDocHash, hashSet, extractID } from '../utils/conversion.js';
import { SectionView } from './sectionView.js';
import { Icon } from './components/icon.js';
import { injectStyle, styled } from '../services/style.js';
import { CLICKABLE } from './styles.js';


export function uploadImages(evt, files) {
    Array.from(files || evt.currentTarget.files).forEach(ImageType.upload);

    if (evt.currentTarget) {
        evt.currentTarget.value = null;
    }
}

export function AllImagesView(vm, params, key, context) {
    const { appbar } = context;
    const model = prop({}, pouchDocHash);
    const images = container([], pouchDocArrayHash);

    const selectedIds = container(new Set(), hashSet);
    const appBarTitle = computed(
        s => s.size > 0 ? `${s.size} selected` : 'Photos',
        [selectedIds]
    );
    const selectMode = computed(sIds => sIds.size > 0, [selectedIds]);

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

    function renderAppBarButtons() {
        if (selectMode()) {
            return [
                trashButtonContainer({
                    onclick: deleteSelectedImages
                }, [
                    Icon({
                        name: "trash" ,
                        size: 0.75,
                    })
                ])
            ];
        }

        return [
            el('button', [
                el('label', {"for": 'uploadButton'}, "Upload"),
            ]),
            el('input', {
                id: 'uploadButton',
                name: 'uploadButton',
                type: 'file',
                multiple: true,
                accept: '.jpg,.jpeg', // no love for gifs, pngs yet
                onchange: uploadImages,
                class: injectStyle({display: 'none'})
            })
        ];
    }

    function deleteSelectedImages() {
        selectedIds.forEach(ImageType.delete)
        selectedIds.clear();
    }

    // function addAlbum() {
    //     const albumName = prompt("Album Name");
    //     if (albumName && albumName.trim()) {
    //         const a = new AlbumType({
    //             title: albumName.trim(),
    //             count: 0
    //         });
    //         a.save();
    //     }
    // }


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
        appbar.companionScrollTop(evt.target.scrollTop);
    }

    function pushAppBarState() {
        const up = selectMode() ? {
            name: 'x',
            onclick: () => selectedIds.clear()
        } : undefined;

        appbar.pushState({
            title: appBarTitle,
            actions: renderAppBarButtons,
            up
        });
    }

    function popAppBarState() {
        appbar.popState();
    }

    ImageType.find({
        ["sizes.thumbnail"]: {$exists: true}
    }, { live: true }).then(la => {
        pushAppBarState();
        selectMode.subscribe(mode => {
            popAppBarState();
            pushAppBarState();
        }),
        subscribeToRender(
            vm,
            [selectedIds, images, selectMode],
            [
                la.subscribe(res => images.splice(0, images.length, ...res))
            ]
        );
    });

    function renderSection({title, sectionId, images: _images}) {
        return vw(SectionView, {
            title,
            photos: _images,
            selectedIds,
            selectMode: selectMode()
        }, sectionId, context);
    }

    return function() {
        return scrollView({
            class: 'allImages',
            onclick: {
                '.photoSelect .icon svg path': toggleSelect,
                '.photoSelect .icon': toggleSelect,
                '.sectionSelectButton .icon': toggleAll,
                '.sectionSelectButton .icon svg path': toggleAll,
                '.photoOverlay': photoClick
            },
            onscroll: handleContentScroll,
        }, sections().map(renderSection));
    };
}

const trashButtonContainer = styled({
    marginRight: '1em',
}, CLICKABLE);

const scrollView = styled({
    overflow: 'scroll',
});
