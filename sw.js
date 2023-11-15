importScripts('sw-toolbox.js');

toolbox.precache([
  'companion.js',
  'index.html',
  'main.js',
  'styles.css',
]);
toolbox.router.default = toolbox.networkFirst;
toolbox.options.networkTimeoutSeconds = 5;

toolbox.router.get('icons/*', toolbox.fastest);