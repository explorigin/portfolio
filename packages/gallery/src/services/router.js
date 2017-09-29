import { Router } from 'router';
import { Event } from '../utils/event.js'

export const routeChanged = new Event('Router.newRoute');

const fire = routeChanged.fire.bind(routeChanged);

export const router = Router(
    [
        {
            name: 'home',
            path: '/',
            enter: (r, route) => {
                r.goto('images');
            },
        },
        {
            name: 'images',
            path: '/images',
            enter: fire,
        },
        {
            name: 'albums',
            path: '/albums',
            enter: fire,
        },
        {
            id: '404',
            path: ':vars',
            enter: (r => r.goto('home'))
        }
    ]
);
