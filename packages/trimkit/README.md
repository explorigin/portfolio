# [TrimKit](https://gitlab.com/explorigin/trimkit)

TrimKit is a set of DOM and API abstractions for the purpose of better Javascript minification. For example:

```
if (a === undefined) { alert('Oops'); }
```

minifies down to:

```
if(a===void 0){alert('Oops')}
```

If we compare against undefined more than 3 times, we can save bytes by doing this:

```
function isUndefined(a) { return a === void 0; }

if (isUndefined(a)) { alert('Oops'); }
```

which minifies down to:

```
function b(a){return a===void 0}

if (b(a)){alert('Oops');}
```

With enough uses of common APIs, you can win back some bytes.

NOTE: TrimKit will help you obsess about Javascript file sizes but that does not always translate to smaller files after you apply compression. Because files using have more entropy, small, pre-compression gains can result in post-compression losses. YMMV.


# Abstractions

 - `undefined`
 - `requestAnimationFrame`
 - `Array.isArray`
 - `Array.from`
 - `Object.keys`
 - `document`
 - `typeof obj === 'function'`
 - `typeof obj === 'string'`
 - `typeof obj === 'number'`
 - `null`
 - `obj === undefined`
 - `obj === null`
 - `fn.apply(context, params)`


## Credit

Created by [Timothy Farrell](https://github.com/explorigin)
