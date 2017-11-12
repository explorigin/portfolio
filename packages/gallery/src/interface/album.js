import { defineView, defineElement as el } from 'domvm';
import * as image from '../data/image.js';
import { ThumbnailView } from './thumbnail.js';
import { LiveArray } from '../utils/livearray.js';


export function AlbumView(vm, model) {
    const { remove, db } = model;
    let data = null;
    let title = null;

    function removeImageFromAlbum(id, rev) {
        remove(title, id);
    }

    return function(vm, model, key, opts) {
        const { doc, remove } = model;
        const { props } = doc;

        if (title !== props.title) {
            if (data) {
                data.cleanup();
            }
            title = props.title;
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
                return defineView(ThumbnailView, {
                    doc: i,
                    showTags: false,
                    remove: removeImageFromAlbum
                },
                i._id)
            })
        ]);
    };
}
