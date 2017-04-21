import * as image from './data/image.js';
import * as index from './data/indexType.js';
import { getDatabase } from './services/db.js';
import * as imageTag from './context/manageImageTags.js';
import generateThumbnails from './contextLoaders/generateThumbnails.js';


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

function renderThumbnail(id, name, doc, tags) {
    const c = document.createElement('div');
    const e = document.createElement('img');

    c.appendChild(e);
    c.id = id;
    c.className = 'image';
    e.title = `${id} ${name}`;
    e.src = `data:${doc.content_type};base64,${doc.data}`;
    e.dataset.id = id;
    e.onclick = evt => (image.remove(evt.currentTarget.dataset.id).then(refresh));

    Object.entries(tags).filter(([_, visible]) => visible).forEach(([title, _]) => {
        const t = document.createElement('span');
        t.textContent = title;
        t.className = 'tag';
        t.onclick = evt => imageTag.remove(title, id).then(refresh);
        c.appendChild(t);
    });
    return c;
}

function renderImage(imageRow, imageContainer, showTags=true) {
    for(let aName in imageRow.doc._attachments) {
        if (aName !== 'thumbnail') {
            continue;
        }
        imageContainer.appendChild(
            renderThumbnail(
                imageRow.doc._id,
                aName,
                imageRow.doc._attachments[aName],
                showTags ? imageRow.doc.tags : []
            )
        );
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
