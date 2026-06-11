/**
 * sockjs-client fue escrito para Node y referencia la variable `global`,
 * que no existe en el navegador. Este polyfill la mapea a `window` antes
 * de que arranque la aplicacion.
 */
(window as unknown as { global: unknown }).global = window;
