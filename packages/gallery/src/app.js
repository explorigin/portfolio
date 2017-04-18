import * as image from './data/image.js';
import { getDatabase } from './services/db.js';
import * as imageTag from './context/manageImageTags.js';

import './context/generateThumbnails.js';


document.querySelector('#fInput').onchange = async (evt) => {
    image.add(evt.currentTarget.files);
}

window.__DEV__ = true;
window.db = getDatabase();

image.imported.subscribe(refresh);

// To test the output:
function refresh() {
    setTimeout(() => history.go(0), 100);
}

db.allDocs({ include_docs: true, attachments: true }).then(async results => {
    results.rows.forEach(r => {
        const doc = r.doc;
    });

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

    results.rows.forEach(r => {
        for(let aName in r.doc._attachments) {
            if (aName !== 'thumbnail') {
                continue;
            }
            document.body.appendChild(
                renderThumbnail(
                    r.doc._id,
                    aName,
                    r.doc._attachments[aName],
                    r.doc.tags
                )
            );
        }
    });

    Array.from(document.querySelectorAll('.image')).forEach(i => {
        const b = document.createElement('button');
        b.onclick = evt => imageTag.add(prompt('Tag Name'), i.id).then(refresh);
        b.textContent = "+";
        i.appendChild(b);
    });
});
