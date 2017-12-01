import { Router } from 'router';
import { Event } from '../utils/event.js'

export const routeChanged = new Event('Router.newRoute');

const fire = routeChanged.fire.bind(routeChanged);

export const router = Router(
    [
        {
            name: 'home',
            path: '/',
            enter: (r, route) => fire('photos', route),
        },
        {
            id: '404',
            path: ':vars',
            enter: (r => r.goto('home'))
        }
    ]
);
