// Stored in a cookie (not localStorage) so the server can render the saved
// view in the first HTML — otherwise the default view flashes before hydration.
export function saveViewPreference(key: string, view: string) {
  document.cookie = `${key}=${view}; path=/; max-age=31536000; samesite=lax`;
}
