// @vitest-environment node
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { findStaticPages } from "./app-pages";

let tempDir: string | undefined;

/** Creates an app folder containing the given files. */
async function appWith(files: string[]) {
  tempDir = await mkdtemp(path.join(os.tmpdir(), "app-pages-"));

  for (const file of files) {
    const fullPath = path.join(tempDir, file);
    await mkdir(path.dirname(fullPath), { recursive: true });
    await writeFile(fullPath, "");
  }

  return tempDir;
}

afterEach(async () => {
  if (tempDir) await rm(tempDir, { recursive: true, force: true });
  tempDir = undefined;
});

describe("findStaticPages", () => {
  it("lists every page folder as a URL", async () => {
    const appDir = await appWith([
      "page.tsx",
      "rooms/page.tsx",
      "reservations/new/page.tsx",
      "layout.tsx",
    ]);

    expect(await findStaticPages(appDir)).toEqual([
      "/",
      "/reservations/new",
      "/rooms",
    ]);
  });

  it("skips dynamic and private folders", async () => {
    const appDir = await appWith([
      "rooms/page.tsx",
      "rooms/[id]/page.tsx",
      "rooms/[id]/edit/page.tsx",
      "_components/page.tsx",
    ]);

    expect(await findStaticPages(appDir)).toEqual(["/rooms"]);
  });

  it("leaves route groups out of the URL", async () => {
    const appDir = await appWith(["(admin)/users/page.tsx"]);

    expect(await findStaticPages(appDir)).toEqual(["/users"]);
  });

  it("ignores tests and route handlers next to pages", async () => {
    const appDir = await appWith([
      "login/page.tsx",
      "login/page.test.tsx",
      "sw.js/route.ts",
    ]);

    expect(await findStaticPages(appDir)).toEqual(["/login"]);
  });

  it("finds this app's pages", async () => {
    const pages = await findStaticPages(path.resolve("src/app"));

    expect(pages).toEqual(
      expect.arrayContaining(["/", "/offline", "/reservations", "/calendar"]),
    );
    expect(pages.some((page) => page.includes("["))).toBe(false);
  });
});
