// Heavily modified from Preact Worker Demo - https://github.com/developit/preact-worker-demo
// Copyright (c) 2016 Jason Miller
// License: MIT

export function Location(onChange) {
	const settables = 'href hash search pathname'
	let url = '/';

	return new Proxy(
		{
			_current: '/',
			get href() {
				return url;
			},
			get pathname() {
				return url.replace(/^(([a-z0-9]+\:)?\/\/[^/]+|[?#].*$)/g, '');
			},
			get search() {
				return (url.match(/\?([^#]*)(#.*)?$/) || [])[1];
			},
			get hash() {
				return (url.match(/#(.*)$/) || [])[1];
			},
		},
		{
			set(target, name, value) {
				if (settables.includes(name)) {
					return (...args) => onChange([5, 'location', name, value]);
				}
				throw new Error(`Cannot set location.${name}.`);
			}
		}
	);
}
