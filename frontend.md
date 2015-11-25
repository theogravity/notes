## npm

- use `npm ls <package_name>` to verify that multiple copies of a package are not installed

### Shrinkwrap issue: missing `x` required by `y` 

If doing an `npm shrinkwrap` and you get the above message, go into the `node_modules/y` dir and manually install the missing `x`, then attempt the shrinkwrap again. 

There is also a bug with using `npm shrinkwrap --dev`, where shrinkwrap seems to check for a dep's devDependencies:

https://github.com/npm/npm/issues/10555

## React

### Dealing with overlays / lightboxes / modals

If you have to implement an overlay, which genreally requires that it be rendered at the document root (eg `body`), use [react-portal](https://github.com/tajo/react-portal), which has been a lifesaver.

### Custom mounting issues

- If you think new instances of a component is being created when using `React.render()` for custom mounting (eg like an overlay), one way to verify this is happening is assinging a style like `background-color` to the affected component and do something that would trigger a state change. You can see if it's the same component or not if the color remains/changes
- Check that your `key` assignments are static (if `render()` is called multiple times, you will end up with a completely new component if `key` is dynamic on a root component).

## Webpack

- If you're using a module that uses webpack, and have problems trying to get it to load, look to the webpack configuration for potential issues/locations (eg aliases) in that module
