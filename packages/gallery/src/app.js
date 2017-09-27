import { createView } from 'domvm';

import * as image from './data/image.js';
import * as index from './data/indexType.js';
import { getDatabase } from './services/db.js';
import * as imageTag from './context/manageImageTags.js';
import generateThumbnails from './contextLoaders/generateThumbnails.js';
import { ImageView } from './interface/image.js';
import { AlbumView } from './interface/album.js';


window.__DEV__ = true;
window.db = getDatabase();

image.imported.subscribe(refresh);
image.imported.subscribe(generateThumbnails);
image.removed.subscribe(refresh);
index.added.subscribe(refresh);
index.removed.subscribe(refresh);
const header = document.querySelector('h1');
const container = document.querySelector('#app');
const displaySelector = document.querySelector('#display');

// Events
displaySelector.onchange = refresh;
document.querySelector('#fInput').onchange = async (evt) => {
    image.add(evt.currentTarget.files);
}

// To test the output:
function refresh() {
    setTimeout(render, 100);
}

async function render() {
    container.innerHTML = '';

    if (displaySelector.value === 'i') {
        header.innerText = 'Images';
        const results = await image.find({ attachments: true });
        results.rows.forEach(i => {
            createView(ImageView, {
                imageRow: i,
                imageContainer: container,
                showTags: true,
                remove: image.remove,
                removeTag: imageTag.remove
            }).mount(container);
        });
    } else {
        header.innerText = 'Albums';
        const results = await index.find({ attachments: true });
        results.rows.forEach(i => {
            createView(AlbumView, {
                albumRow: i,
                remove: imageTag.remove
            }).mount(container);
        });
    }

    Array.from(document.querySelectorAll('.image')).forEach(i => {
        const b = document.createElement('button');
        b.onclick = evt => imageTag.add(prompt('Tag Name'), i.id);
        b.textContent = "+";
        i.appendChild(b);
    });
}

render();
