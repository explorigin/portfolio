import * as image from '../data/image.js';
import * as index from '../data/indexType.js';


export async function add(title, imageId, visible=true) {
    const trimmedTitle = title.trim();
    await index.add(
        trimmedTitle,
        { title: trimmedTitle },
        [imageId]
    );
    return image.update(
        imageId,
        {
            tags: {[trimmedTitle]: visible}
        }
    );
}

export async function remove(title, imageId) {
    const id = index.hashString(title);
    await image.update(imageId, {tags: {[title]: undefined} });
    await index.removeMember(title, imageId);
}

image.removed.subscribe(image => {
    Object.keys(image.tags).forEach(t => index.removeMember(t, image._id));
})
