import { defineView, defineElement as el } from 'domvm';
import * as image from '../data/image.js';
import { ImageView } from './image.js';
import { LiveArray } from '../utils/livearray.js';


export function AlbumView(vm, model) {
    const { remove, db } = model;
    let data = null;
    let currentMemberLen = -1;
    let title = null;

    function removeImageFromAlbum(id, rev) {
        remove(title, id);
    }

    return function(vm, model, key, opts) {
        const { doc, remove } = model;
        const { props, members } = doc;

        if (title !== props.title || currentMemberLen !== members.length) {
            if (data) {
                data.cleanup();
            }
            title = props.title;
            currentMemberLen = members.length;
            const SELECTOR = Object.assign({
                [`tags.${title}`]: {$eq: true}},
                image.SELECTOR
            );

            data = LiveArray(db, SELECTOR);
            data.subscribe(() => vm.redraw());
        }
        const images = data();

        return el('.album', [
            el('h2', [ title ]),
            ...images.map(i => {
                return defineView(ImageView, {
                    doc: i,
                    showTags: false,
                    remove: removeImageFromAlbum
                },
                i._id)
            })
        ]);
    };
}
