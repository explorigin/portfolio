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
            name: 'focus',
            path: '/focus/:id',
            vars: {
                id: /^[_A-Za-z0-9]+$/
            },
            enter: (r, route) => fire('image', route),
        },
        {
            id: '404',
            path: ':vars',
            enter: (r => r.goto('home'))
        }
    ]
);
