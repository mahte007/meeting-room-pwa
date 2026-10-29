// A stand-in origin to resolve relative paths against; never visited.
const PLACEHOLDER_ORIGIN = "http://placeholder.invalid";

/**
 * Only allows same-origin paths like "/reservations", so a crafted link such
 * as /login?redirect=https://evil.example can't send the user to another
 * site after logging in.
 *
 * The value is resolved with the URL parser, the same way the browser will
 * read it, instead of checked by hand: browsers quietly fix up URLs (they
 * drop tabs and newlines and treat "\" like "/"), so "/\t/evil.example"
 * actually means "//evil.example".
 */
export function getSafeRedirect(value: string | null) {
  if (!value?.startsWith("/")) return "/";

  let url: URL;

  try {
    url = new URL(value, PLACEHOLDER_ORIGIN);
  } catch {
    return "/";
  }

  if (url.origin !== PLACEHOLDER_ORIGIN || url.pathname.startsWith("/login")) {
    return "/";
  }

  return `${url.pathname}${url.search}${url.hash}`;
}
