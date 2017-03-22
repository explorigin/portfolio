import { add, imported, db, remove } from './data/image.js';
import * as thumbnailContext from './context/generateThumbnails.js';


document.querySelector('#fInput').onchange = async (evt) => {
    add(evt.currentTarget.files);
}

window.__DEV__ = true;
window.db = db;
window.remove = remove;

imported.subscribe(refresh);

// To test the output:
function refresh() {
    setTimeout(() => history.go(0), 100);
}

db.allDocs({ include_docs: true, attachments: true }).then(results => {
    results.rows.forEach(r => {
        for(let aName in r.doc._attachments) {
            const a = r.doc._attachments[aName];
            const e = document.createElement('img');
            document.body.appendChild(e);
            e.title = `${r.doc._id} ${aName}`;
            e.src = `data:${a.content_type};base64,${a.data}`;
            e.dataset.id = r.doc._id;
            e.onclick = evt => (remove(evt.currentTarget.dataset.id).then(refresh));
        }
    });
});
