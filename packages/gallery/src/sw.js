import { FileType } from './data/file.js';
import { log } from './services/console.js';

const http404 = (url) => () => {
    log(`ServiceWorker could not find ${url}`);
    return new Response(null, {
        status: 404,
        statusText: 'NOT FOUND',
        headers: {}
    });
};

self.addEventListener('fetch', event => {
    const requestUrl = new URL(event.request.url);

    if (requestUrl.pathname && requestUrl.pathname.startsWith('/file/')) {
        event.respondWith(
            FileType.getFromURL(requestUrl.pathname)
            .then(data => {
                if (data) {
                    log(`ServiceWorker serving ${requestUrl.pathname} ${data.type} ${(data.size/1024).toFixed(2)}kb`);
                    return new Response(
                        data,
                        {
                            status: 200,
                            statusText: 'OK',
                            headers: {
                                'Content-Type': data.type,
                            }
                        }
                    )
                }
                return http404(requestUrl.pathname)()
            })
            .catch(http404(requestUrl.pathname))
        );
    }
});
