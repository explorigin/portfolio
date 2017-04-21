export default async function(...args) {
    const module = await import('../context/generateThumbnails');
    module.invoke(...args);
};
