import { defineView, defineElement as el } from 'domvm';
import * as image from '../data/image.js';
import { ImageView } from './image.js';
import { LiveArray } from '../utils/livearray.js';


export function AlbumView(vm, model) {
    const { remove } = model;
    let data = null;
    let currentMembers = [];
    let title = null;

    function removeImageFromAlbum(id, rev) {
        remove(title, id);
    }

    return function(vm, model, key, opts) {
        const { doc, remove } = model;
        const { props, members } = doc;

        if (title !== props.title || currentMembers.length !== members.length) {
            if (data) {
                data.cleanup();
            }
            title = props.title;
            currentMembers = members;
            const SELECTOR = {
                $or: [
                    Object.assign({[`tags.${title}`]: {$eq: true}}, image.SELECTOR),
                    { _id: { $in: members } }
                ]
            };

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
