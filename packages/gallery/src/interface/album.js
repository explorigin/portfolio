import { defineView, defineElement as el } from 'domvm';
import * as image from '../data/image.js';
import { ImageView } from './image.js';


export function AlbumView(vm, model) {
    const { albumRow, remove } = model;
    const { props, members } = albumRow.doc;
    const title = props.title;
    let images = [];

    // FIXME - If the album is updated, this does not properly refresh.
    image.find(members, { attachments: true }).then(res => {
        images = res.rows.filter(i => i.doc);
        vm.redraw();
    });

    function removeImageFromAlbum(id, rev) {
        remove(title, id);
    }

    return function(vm, model, key, opts) {
        return el('.album', [
            el('h2', [ title ]),
            ...images.map(i => {
                return defineView(ImageView, {
                    imageRow: i,
                    showTags: false,
                    remove: removeImageFromAlbum
                },
                i._id)
            })
        ]);
    };
}
