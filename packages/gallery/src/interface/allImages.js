import * as moment from 'moment';
import { prop, computed, container } from 'frptools';

import { subscribeToRender, defineView, subscribeToRender, defineElement as el } from '../utils/domvm.js';

import { error } from '../services/console.js';
import { ImageType } from '../data/image.js';
import { pouchDocArrayHash, pouchDocHash, hashSet, extractID } from '../utils/conversion.js';
import { AlbumTemplate } from './components/albumTemplate.js';
import { injectStyle, styled } from '../services/style.js';


export function uploadImages(evt, files) {
    Array.from(files || evt.currentTarget.files).forEach(ImageType.upload);

    if (evt.currentTarget) {
        evt.currentTarget.value = null;
    }
}

export function AllImagesView(vm, params, key, opts) {
    const model = prop({}, pouchDocHash)
    const images = container([], pouchDocArrayHash);
    const hoverId = prop(null);
    const selectedIds = container(new Set(), hashSet);
    const selectMode = computed(sIds => sIds.size > 0, [selectedIds]);

    const sections = computed(imageArr => {
        const sectionMap = imageArr.reduce((acc, i) => {
            const date = i.originalDate.substr(0, 10);
            return Object.assign(acc, { [date]: (acc[date] || []).concat(i) });
        }, {});
        const res = Object.entries(sectionMap).reduce((acc, [date, sectionImages]) => Object.assign(acc, {
            [moment(date).format('LL')]: sectionImages
        }), {});
        return res;
    }, [images]);

    ImageType.find({
        ["sizes.thumbnail"]: {$exists: true}
    }, true).then(la => {
        opts.appbar.renderButtons(renderAppBarButtons);
        subscribeToRender(vm, [images], [la.subscribe(res => images.splice(0, images.length, ...res))]);
    });

    function renderAppBarButtons() {
        return [
            el('button', [
                el('label', {"for": 'uploadButton'}, "Upload"),
            ]),
            el('input', {
                id: 'uploadButton',
                name: 'uploadButton',
                type: 'file',
                multiple: true,
                accept: '.png,.jpg,.jpeg', // no love for gifs yet
                onchange: uploadImages,
                class: injectStyle({display: 'none'})
            })
        ];
    }
    //
    // function deleteImage(i) {
    //     ImageType.delete(i._id);
    // }
    //
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

    function nodeParentWithType(node, type) {
        let parentNode = node;
        while (parentNode && (!parentNode.data || parentNode.data.type !== type)) {
            parentNode = parentNode.parent;
        }
        if (!parentNode) {
            error(`Could not find {"type": "${type}"} parent.`);
            return;
        }
        return parentNode;
    }

    function photoClick(evt, node, vm) {
        if (selectMode()) {
            toggleSelect(evt, node, vm)
        } else {
            // todo implement zoom-view
        }
    }

    function toggleSelect(evt, node, vm) {
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

    subscribeToRender(vm, [selectedIds, images, hoverId, selectMode]);

    function renderSection([title, _images]) {
        return AlbumTemplate({
            title,
            id: title,
            photos: _images,
            selectedIds,
            selectMode: selectMode()
        });
    }

    return function() {
        return el('.eventSnarfer', {
            onclick: {
                '.photoSelect .icon svg path': toggleSelect,
                '.photoSelect .icon': toggleSelect,
                '.albumSelectButton .icon': toggleAll,
                '.albumSelectButton .icon svg path': toggleAll,
                '.photoOverlay': photoClick
            },
        }, Object.entries(sections()).map(renderSection));
    };
}
