export default async function(id, deleted) {
    if (!deleted) {
        const module = await import('../context/generateThumbnails');
        module.invoke(id, deleted);
    }
};
