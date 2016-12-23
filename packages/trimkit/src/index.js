// Copyright (c) 2016 Timothy Farrell
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// ES5 output: var a=void 0;
// Invocation comparison: undefined ~~~ a
// Size delta per invocation: 9 - 1 = 8 bytes
// Size saved after: ceil(13 / 8) = 2 usages
export const Undefined = void 0;

// ES5 output: var a=requestAnimationFrame;
// Invocation comparison: requestAnimationFrame(b) ~~~ a(b)
// Size delta per invocation: 24 - 4 = 20 bytes
// Size saved after: ceil(28 / 20) = 2 usages
export const requestAnimationFrame = self.requestAnimationFrame;

// ES5 output: var a=Array.isArray;
// Invocation comparison: Array.isArray(b) ~~~ a(b)
// Size delta per invocation: 16 - 4 = 12 bytes
// Size saved after: ceil(20 / 12) = 2 usages
export const isArray = Array.isArray;

// ES5 output: var a=Array.from;
// Invocation comparison: Array.from(b) ~~~ a(b)
// Size delta per invocation: 13 - 4 = 9 bytes
// Size saved after: ceil(17 / 9) = 2 usages
export const asArray = Array.from;

// ES5 output: var a=Object.keys;
// Invocation comparison: Object.Keys(b) ~~~ a(b)
// Size delta per invocation: 14 - 4 = 10 bytes
// Size saved after: ceil(18 / 10) = 2 usages
export const ObjectKeys = Object.keys;

// ES5 output: var a=self.document;
// Invocation comparison: document ~~~ a
// Size delta per invocation: 8 - 1 = 7 bytes
// Size saved after: ceil(20 / 7) = 3 usages
export const DOMDocument = self.document;

// ES5 output: function a(b){return"function"===typeof b};
// Invocation comparison: typeof a==='function' ~~~ a(b)
// Size delta per invocation: 21 - 4 = 17 bytes
// Size saved after: ceil(43 / 17) = 3 usages
export function isFunction(obj) {
    return typeof obj === 'function';
}

// ES5 output: function a(b){return"string"===typeof b};
// Invocation comparison: typeof a==='string' ~~~ a(b)
// Size delta per invocation: 19 - 4 = 15 bytes
// Size saved after: ceil(41 / 15) = 3 usages
export function isString(obj) {
    return typeof obj === 'string';
}

// ES5 output: function a(b){return"number"===typeof b};
// Invocation comparison: typeof a==='number' ~~~ a(b)
// Size delta per invocation: 19 - 4 = 15 bytes
// Size saved after: ceil(41 / 15) = 3 usages
export function isNumber(obj) {
    return typeof obj === 'number';
}

// ES5 declaration: var a=null;
// Invocation comparison: null ~~~ a
// Size delta per invocation: 4 - 1 = 3 bytes
// Size saved after: ceil(11 / 3) = 4 usages
export const Null = null;

// ES5 output: function a(b){return void 0===b};
// Invocation comparison: b===undefined ~~~ a(b)
// Size delta per invocation: 13 - 4 = 9 bytes
// Size saved after: ceil(33 / 9) = 4 usages
export function isUndefined(a) {
    return a === undefined;
}

// ES5 output: function a(b,c){return a.apply(b,c)};
// Invocation comparison A: a.apply(b,c,d) ~~~ a(b,c,d)
// Invocation comparison B: a.apply(b,c) ~~~ a(b,c)
// Size delta per invocation A: 14 - 8 = 6 bytes
// Size delta per invocation B: 12 - 6 = 6 bytes
// Size saved after: ceil(37 / 6) = 7 usages
export function apply(fn, context, params) {
    return fn.apply(context, params);
}

// ES5 output: function a(b){return null===b};
// Invocation comparison: b===null ~~~ a(b)
// Size delta per invocation: 8 - 4 = 4 bytes
// Size saved after: ceil(31 / 4) = 8 usages
export function isNull(a) {
    return a === null;
}
