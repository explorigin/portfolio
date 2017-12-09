import { prop } from 'frptools';

import { subscribeToRender, defineView as vw, defineElement as el } from '../utils/domvm.js';
import { ImageType } from '../data/image.js';
import { AlbumType } from '../data/album.js';
import { ThumbnailTemplate } from './components/thumbnail.js';
import { AllImagesView, uploadImages } from './allImages.js';
import { Dropzone } from './components/dropzone.js';
import { Overlay } from './components/overlay.js';
import { AppBarView } from './components/appbar.js';
import { Icon } from './components/icon.js';
import { routeChanged } from '../services/router.js';
import { injectStyle, styled } from '../services/style.js';


export function GalleryView(vm) {
    let data = null;
    let laCleanup = null;
    const context = {};
    const title = prop('');
    const hasData = prop(null);

    subscribeToRender(vm, [hasData]);

    routeChanged.subscribe(function onRouteChange(name, params) {
        if (name == 'photos') {
            title('Photos');
            ImageType.find({
                ["sizes.thumbnail"]: {$exists: true}
            }).then(results => {
                hasData(results.length > 0);
            });
        } else {
            throw new Error('Should not happen');
        }
    });

    function handleContentScroll(evt) {
        context.appbar.companionScrollTop(evt.target.scrollTop);
    }

    function renderWelcomePane() {
        return [
            Overlay([
                el('h1', "Hi")
            ])
        ];
    }

    function renderDropPane() {
        return [
            Overlay([
                Icon({
                    name: 'upload',
                    size: 4,
                }),
                el('h1', 'Drop pictures here to upload to your gallery'),
            ])
        ];
    }

    function renderMain() {
        return [
            vw(AppBarView, {
                title: 'Photos'
            }, 'appbar', context),
            content({
                onscroll: handleContentScroll
            }, (
                hasData()
                ? [
                    vw(AllImagesView, {}, 'allImages', context)
                ]
                : [
                    renderWelcomePane()
                ]
            ))
        ];
    }

    return function render() {
        if (hasData() === null) {
            return Overlay([el('h1', "Loading...")]);
        }

        return el('.gallery', { class: fill }, [
            vw(Dropzone, {
                className: fill,
                dropEffect: 'copy',
                ondrop: uploadImages,
                content: renderMain,
                hoverContent: renderDropPane
            }, 'dz')
        ]);
    }
}

const FILL_STYLE = {
    display: 'flex',
    flex: 1,
    flexDirection: 'column',
};
const fill = injectStyle(FILL_STYLE);

const content = styled({
    overflow: 'scroll',
    ['-webkit-transform']: 'translate3d(0,0,0);'  // http://blog.getpostman.com/2015/01/23/ui-repaint-issue-on-chrome/
}, FILL_STYLE);
