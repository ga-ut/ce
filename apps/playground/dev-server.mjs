import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const port = Number(process.env.PORT || 4173);
const host = process.env.HOST || "127.0.0.1";

const indexHtmlUrl = new URL("./index.html", import.meta.url);
const appEntryPath = fileURLToPath(new URL("./App.ts", import.meta.url));
const indexHtml = await readFile(indexHtmlUrl, "utf8");

const buildAppBundle = async () => {
  const result = await Bun.build({
    entrypoints: [appEntryPath],
    format: "esm",
    target: "browser",
    sourcemap: "inline",
    minify: false,
  });

  if (!result.success) {
    const details = result.logs.map((log) => log.message).join("\n");
    throw new Error(details || "Playground bundle failed to build.");
  }

  const bundle = result.outputs[0];
  return bundle.text();
};

const server = Bun.serve({
  hostname: host,
  port,
  routes: {
    "/": async () =>
      new Response(indexHtml, {
        headers: { "content-type": "text/html; charset=utf-8" },
      }),
    "/index.html": async () =>
      new Response(indexHtml, {
        headers: { "content-type": "text/html; charset=utf-8" },
      }),
    "/dist/app.js": async () => {
      try {
        const bundle = await buildAppBundle();
        return new Response(bundle, {
          headers: { "content-type": "text/javascript; charset=utf-8" },
        });
      } catch (error) {
        return new Response(String(error), {
          status: 500,
          headers: { "content-type": "text/plain; charset=utf-8" },
        });
      }
    },
  },
  fetch() {
    return new Response("Not found", { status: 404 });
  },
});

console.log(`CE playground preview: http://${server.hostname}:${server.port}`);
