import { createView } from 'domvm';

import * as image from './data/image.js';
import * as index from './data/indexType.js';
import { getDatabase } from './services/db.js';
import * as imageTag from './context/manageImageTags.js';
import generateThumbnails from './contextLoaders/generateThumbnails.js';
import { ThumbnailView } from './interface/thumbnail.js';


window.__DEV__ = true;
window.db = getDatabase();

image.imported.subscribe(refresh);
image.imported.subscribe(generateThumbnails);
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

function renderImage(imageRow, imageContainer, showTags=true) {
    for(let aName in imageRow.doc._attachments) {
        if (aName !== 'thumbnail') {
            continue;
        }
        createView(ThumbnailView, {
            id: imageRow.doc._id,
            name: aName,
            doc: imageRow.doc._attachments[aName],
            tags: showTags ? imageRow.doc.tags : [],
            remove: image.remove,
            removeTag: imageTag.remove
        }).mount(imageContainer);
    }
}

async function renderAlbum(indexRow) {
    const doc = indexRow.doc;
    const l = document.createElement('h2');
    l.innerText = indexRow.doc.props.title;
    container.appendChild(l);

    const albumContainer = document.createElement('div');
    container.appendChild(albumContainer);

    const results = await image.find(doc.members, { attachments: true });
    results.rows.filter(i => i.doc).forEach(i => renderImage(i, albumContainer, false));
}

async function render() {
    container.innerHTML = '';

    if (displaySelector.value === 'i') {
        header.innerText = 'Images';
        const results = await image.find({ attachments: true });
        results.rows.forEach(i => renderImage(i, container));
    } else {
        header.innerText = 'Albums';
        const results = await index.find({ attachments: true });
        results.rows.forEach(renderAlbum);
    }

    Array.from(document.querySelectorAll('.image')).forEach(i => {
        const b = document.createElement('button');
        b.onclick = evt => imageTag.add(prompt('Tag Name'), i.id).then(refresh);
        b.textContent = "+";
        i.appendChild(b);
    });
}

render();
