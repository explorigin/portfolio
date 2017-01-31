export function history(onChange) {
	const methods = 'pushState replaceState go back forward'.split(' ');

	return new Proxy(
		{},
		{
			get(target, name) {
				if (methods.includes(name)) {
					return (...args) => onChange([6, 'history', name, args]);
				}
				// return undefined;
			}

			set(target, name, value) {
				throw new Error(`Cannot set ${name} on history.`);
			}
		}
	);
}
