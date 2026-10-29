import { readFile } from "node:fs/promises";
import path from "node:path";
import { findStaticPages } from "@/lib/app-pages";

// Rendered once at build time and then served as a static file.
export const dynamic = "force-static";

export async function GET() {
  const source = await readFile(
    path.join(process.cwd(), "src/service-worker/sw.js"),
    "utf8",
  );

  const buildId = process.env.NEXT_PUBLIC_BUILD_ID ?? "dev";
  const pages = await findStaticPages(path.join(process.cwd(), "src/app"));

  return new Response(
    source
      .replace('"__BUILD_ID__"', JSON.stringify(buildId))
      .replace('"__APP_PAGES__"', JSON.stringify(pages)),
    {
      headers: {
        "Content-Type": "application/javascript; charset=utf-8",
        // The browser must always revalidate the worker script, or updates
        // could be delayed by the HTTP cache.
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    },
  );
}
