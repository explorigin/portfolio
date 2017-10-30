import * as image from '../data/image.js';

// Watch for new images, generate thumbnails if they need them.
image.watcher(async function generateThumbnails(id, deleted, doc) {
    if (deleted || (doc.attachmentUrls.thumbnail && doc._attachments.thumbnail)) {
        return;
    }

    const module = await import('../context/generateThumbnails');
    module.invoke(id);
});
