import { readFile } from "node:fs/promises";
import path from "node:path";

// Rendered once at build time and then served as a static file.
export const dynamic = "force-static";

export async function GET() {
  const source = await readFile(
    path.join(process.cwd(), "src/service-worker/sw.js"),
    "utf8",
  );

  const buildId = process.env.NEXT_PUBLIC_BUILD_ID ?? "dev";

  return new Response(
    source.replace('"__BUILD_ID__"', JSON.stringify(buildId)),
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
