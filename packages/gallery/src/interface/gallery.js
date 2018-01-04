import { prop } from 'frptools';

import {
    subscribeToRender,
    renderSwitch,
    defineView as vw,
    createView as cv,
    defineElement as el,
} from '../utils/domvm.js';
import { ImageType } from '../data/image.js';
import { AlbumType } from '../data/album.js';
import { AllImagesView, uploadImages } from './allImages.js';
import { FocusView } from './focus.js';
import { Dropzone } from './components/dropzone.js';
import { Overlay } from './components/overlay.js';
import { AppBarView } from './components/appbar.js';
import { Icon } from './components/icon.js';
import { routeChanged } from '../services/router.js';
import { injectStyle, styled } from '../services/style.js';
import { FILL_STYLE } from './styles.js';


export function GalleryView(vm) {
    const context = {};
    const routeName = prop();
    const routeParams = prop();

    context.appbarView = cv(AppBarView, {}, 'appbar', context);

    routeChanged.subscribe(function onRouteChange(name, params) {
        routeName(name);
        routeParams(params);
        vm.redraw();
    });

    function renderMain() {
        return [
            content([
                renderSwitch({
                    photos: [AllImagesView, {}, 'allImages', context],
                    focus: [FocusView, routeParams(), `focus_${routeParams() && routeParams().id}`, context]
                }, routeName())
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

    return function render() {
        return container({ class: 'gallery' }, [
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

const fill = injectStyle(FILL_STYLE);
const container = styled({
    overflow: 'hidden'
}, FILL_STYLE);

const content = styled({
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    display: 'flex',
    ['-webkit-transform']: 'translate3d(0,0,0);'  // http://blog.getpostman.com/2015/01/23/ui-repaint-issue-on-chrome/
});
