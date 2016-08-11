## shadow dom primer

https://developers.google.com/web/fundamentals/primers/shadowdom/

## hackathon starter kit

https://github.com/sahat/hackathon-starter/blob/master/README.md

## Connection warmup

https://www.igvita.com/2015/08/17/eliminating-roundtrips-with-preconnect/
https://developer.mozilla.org/en-US/docs/Web/HTTP/Controlling_DNS_prefetching

## JS

- https://github.com/nodejs/node/blob/master/doc/topics/the-event-loop-timers-and-nexttick.md
- http://stackoverflow.com/questions/24987896/how-does-bluebirds-util-tofastproperties-function-make-an-objects-properties/24989927#24989927

## mobile safari

### programmatically doing a focus to input

You cannot do an input focus programmatically outside of a user-interaction event handler; the user has to interact with the UI before you are able to redirect focus

- http://blog.pixelastic.com/2015/07/13/trigger-focus-on-input-on-iphone-programmatically/

## babel

### Odd issues where old code is referenced that no longer exists

Could be the `.babel.json` cache file hasn't been updated or is in a bad state. Remove the file by going into your home directory and then run the transpiler again.

## Immubtale.js

https://github.com/andrewdavey/immutable-devtools

## npm

- use `npm ls <package_name>` to verify that multiple copies of a package are not installed

### Shrinkwrap really huge after saving a new package

Run `npm prune` then `npm shrinkwrap --dev`

### Shrinkwrap issue: missing `x` required by `y` 

If doing an `npm shrinkwrap` and you get the above message, go into the `node_modules/y` dir and manually install the missing `x`, then attempt the shrinkwrap again. 

There is also a bug with using `npm shrinkwrap --dev`, where shrinkwrap seems to check for a dep's devDependencies:

https://github.com/npm/npm/issues/10555

## React

### Fibers + React archiecture details

https://github.com/acdlite/react-fiber-architecture/blob/master/README.md

kinda like fibers but a concrete impl

https://github.com/redfin/react-server

### React patterns

https://github.com/krasimir/react-in-patterns

### Peformanace analysis

- http://benchling.engineering/performance-engineering-with-react/ (Also see part 2)
- (performance timing on `setState`) https://github.com/facebook/react/issues/3436

### Dealing with overlays / lightboxes / modals

If you have to implement an overlay, which genreally requires that it be rendered at the document root (eg `body`), use [react-portal](https://github.com/tajo/react-portal), which has been a lifesaver.

### Custom mounting issues

- If you think new instances of a component is being created when using `React.render()` for custom mounting (eg like an overlay), one way to verify this is happening is assinging a style like `background-color` to the affected component and do something that would trigger a state change. You can see if it's the same component or not if the color remains/changes
- Check that your `key` assignments are static (if `render()` is called multiple times, you will end up with a completely new component if `key` is dynamic on a root component).

## Webpack

- If you're using a module that uses webpack, and have problems trying to get it to load, look to the webpack configuration for potential issues/locations (eg aliases) in that module
- If having issues with `babel-loader`, and you have a `.babelrc`, try moving the contents of the `.babelrc` directly to the loader options

### bundle size too high

- Analyze with https://github.com/robertknight/webpack-bundle-size-analyzer
- use plugins to minimize, remove duplicates
- shift static assets to a vendor bundle

if using react + webpack, use this plugin to reduce size

```
    // allows React to be minified properly in production
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(IS_DEVELOPMENT_MODE ? 'development' : 'production')
    })
```

### React is being loaded twice

Add to config

```
resolve: {
  alias: {
    react: path.resolve(__dirname, './node_modules/react'),
  }
}
```

## JS syntax

### ES7 async and throwing errors

- Cannot use `throw new Error()` within an `async` body if inside a `Promise`. Make sure to `reject(new Error())` instead. The rejection in `async` will thrown
- Refer to http://stackoverflow.com/questions/19943360/should-async-function-never-ever-throw for more info

## input

### input type number

Set the `step` attribute to `any` to allow floats.

In Chrome, decimals do not register until there is a figure after the decimal when set directly in a `value` attribute. For example, a value of `2.` will not show in the input, but `2.5` will. Mobile safari (ios 9) does not seem to have this problem.

## Testing

### Jasmine spies and es6 exports

If you want to use `spyOn` to mock a function, the following will not work:

```javascript
// test.js
export function test() {}

// mock.js
import { test } from './test'

spyOn({ test }, 'test')...
```

Instead do:

```javascript
// test.js
export function test() {}

// mock.js
import * as testLib from './test'

spyOn(testLib, 'test')...
```

## Images

### Font icons vs SVG

https://github.com/blog/2112-delivering-octicons-with-svg

## cors with `file:///`

`file:///` lacks a domain so `document.domain` will be blank and cannot be altered; `document.domain` alteration is only allowed against sub-parts of a domain (eg `test.viv.ai` -> `viv.ai`). 

This problem can be encountered if one is choosing to cache downloaded content from a host directly into the iOS FS/memory. Instead, iOS should be always fetching directly from the host using `If-then-match` headers to check if the cache has changed, with the host returning some kind of cache validation (eg etag value) + a 304 response if the cache hasn't changed.

## Input masking

Used https://github.com/insin/inputmask-core

- input masks can show the mask as you type (eg phone # (___) ___-_____), but this has implementation complexity if we allow the user to reposition the cursor and add/remove chars
- there seems to be an issue with using the input type number where it will not display the value on chrome if the value attribute has an incomplete value (eg 2. vs 2.1). Mobile safari seems okay with this
- the input mask libraries out there are quite limited and require a bit of work to impl if we want to build our own from scratch (I would not want to do this); I have not seen one that allows you to specify 'forced entry text' (eg if the user should be entering in the exact value of 12.3 vs the input mask of ##.#)
- To do forced entry text, I am having the dev specify a separate prop that says "user must type <text>", which will accept/reject input if the next character matches <text>. Placeholders would have to be disabled and a new layer under the text input would be used to display the guidance text that the user must type
- Had to define keyUp/keyPress to handle new input to feed into the masking library; if I want to update state in the component, I need to make sure that the onChange handler wasn't also sending out state during this time so the new input isnt doubled

## Keypressing

- if you want the actual `keyCode` you must use `keyUp` or `keyDown`
- for `charCode`, use `keyPress`

http://stackoverflow.com/questions/7626328/getting-the-character-from-keyup-event

## z-index

http://philipwalton.com/articles/what-no-one-told-you-about-z-index/

## audio processing

https://howlerjs.com/
