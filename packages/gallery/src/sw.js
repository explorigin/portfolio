import { FileType } from './data/file.js';


self.addEventListener('fetch', event => {
    const requestUrl = new URL(event.request.url);

    if (requestUrl.pathname && requestUrl.pathname.startsWith('/file/')) {
        event.respondWith(
            FileType.getFromURL(requestUrl.pathname)
            .then(data => (
                data
                ? new Response(
                    data,
                    {
                        status: 200,
                        statusText: 'OK',
                        headers: {
                            'Content-Type': data.mimetype,
                        }
                    }
                )
                : new Response(null, {
                    status: 404,
                    statusText: 'NOT FOUND',
                    headers: {}
                })
            ))
            .catch(() => (
                new Response(null, {
                    status: 404,
                    statusText: 'NOT FOUND',
                    headers: {}
                })
            ))
        );
    }
});
