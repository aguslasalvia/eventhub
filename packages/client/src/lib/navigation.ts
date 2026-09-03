/**
 * Full-page redirect (e.g. off to PayPal's hosted checkout), as opposed to
 * client-side routing. Kept as its own module-scope function rather than a
 * direct `window.location.href = url` inline in a component — the latter
 * trips eslint-plugin-react-hooks' compiler-oriented immutability check
 * when the assignment sits inside a callback passed as a JSX prop.
 */
export function redirectTo(url: string) {
  window.location.href = url;
}
