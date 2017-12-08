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
    const visibleIds = computed(arr => arr.map(extractID), [images]);
    const hoverId = prop(null);
    const selectedIds = container(new Set(), hashSet);
    const mode = computed(sIds => sIds.size > 0 ? 'select' : 'view', [selectedIds]);

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
        if (images.length === selectedIds.size) {
            selectedIds.clear();
        } else {
            images.map(extractID).forEach(i => selectedIds.add(i));
        }
    }

    subscribeToRender(vm, [selectedIds, images, hoverId, mode]);

    return function() {
        return el('.eventSnarfer', {
            onclick: {
                '.photoSelect .icon svg path': toggleSelect,
                '.photoSelect .icon': toggleSelect,
                '.albumSelectButton .icon': toggleAll,
                '.albumSelectButton .icon svg path': toggleAll
            },
        }, [AlbumTemplate({
            title: 'Test',
            id: 1,
            photos: images,
            selectedIds,
            mode: mode()
        })]);
    };
}
