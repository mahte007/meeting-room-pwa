import { readdir } from "node:fs/promises";
import path from "node:path";

const PAGE_FILE = /^page\.(tsx|ts|jsx|js)$/;

/**
 * Lists the app's static pages ("/", "/rooms", "/reservations/new", ...) by
 * walking the App Router folder, so the service worker can precache them for
 * offline use without a hand-kept list. Server-side only (reads the disk).
 *
 * Skipped: dynamic segments like [id], whose URLs aren't known in advance,
 * and private folders (_name). Route groups like (admin) don't appear in the
 * URL, so their pages are listed without the group name.
 */
export async function findStaticPages(appDir: string, segments: string[] = []) {
  const entries = await readdir(appDir, { withFileTypes: true });
  const pages: string[] = [];

  for (const entry of entries) {
    if (entry.isFile() && PAGE_FILE.test(entry.name)) {
      pages.push(`/${segments.join("/")}`);
      continue;
    }

    if (!entry.isDirectory()) continue;

    const { name } = entry;

    if (name.startsWith("[") || name.startsWith("_")) continue;

    const isRouteGroup = name.startsWith("(") && name.endsWith(")");
    const childSegments = isRouteGroup ? segments : [...segments, name];

    pages.push(
      ...(await findStaticPages(path.join(appDir, name), childSegments)),
    );
  }

  return pages.sort();
}
