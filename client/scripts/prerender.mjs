/*
  Runs after `vite build` (client) and `vite build --ssr src/entry-server.tsx` (into .ssr/):
  1. writes each indexable route as static HTML with its own <head>, ready for hydrateRoot
  2. writes app.html, an empty noindex shell nginx serves for /admin and as the 404 page
  3. generates sitemap.xml and llms.txt from the site content
  4. gzips text assets for nginx's gzip_static
*/
import { mkdir, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { constants, gzipSync } from "node:zlib";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");
const ssrDir = path.join(root, ".ssr");
const ssr = await import(pathToFileURL(path.join(ssrDir, "entry-server.js")).href);
const { render, routes, pageMeta, headTags, person, socials, experiences, projects } = ssr;
const SITE = "https://www.faisalwani.dev";

const template = await readFile(path.join(dist, "index.html"), "utf8");
if (!template.includes("<!--seo-->") || !template.includes("<!--app-html-->")) {
  throw new Error("index.html is missing the <!--seo--> or <!--app-html--> slot");
}

// The first paint sets the name in Mona Sans and the meta lines in Geist Mono: fetch their Latin files early.
const assets = await readdir(path.join(dist, "assets"));
const fontPreloads = [/^mona-sans-latin-wdth-normal-.*\.woff2$/, /^geist-mono-latin-wght-normal-.*\.woff2$/].map((re) => {
  const file = assets.find((f) => re.test(f));
  if (!file) throw new Error(`font not found for preload: ${re}`);
  return `<link rel="preload" href="/assets/${file}" as="font" type="font/woff2" crossorigin />`;
});

// 1. indexable routes
for (const route of routes) {
  let app = await render(route);
  // React puts resource hints (image preloads) at the front of the markup; they belong in <head>
  let hints = "";
  app = app.replace(/^(?:<link [^>]*\/?>)+/, (m) => ((hints = m), ""));
  const head = [headTags(pageMeta(route)), ...fontPreloads, hints].filter(Boolean).join("\n    ");
  const html = template.replace("<!--seo-->", head).replace("<!--app-html-->", app);
  const file = route === "/" ? path.join(dist, "index.html") : path.join(dist, route.slice(1), "index.html");
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, html);
  console.log(`prerendered ${route} (${(html.length / 1024).toFixed(1)} kB)`);
}

// 2. client-only shell
const shell = template
  .replace(/\s*<meta name="robots"[^>]*>/, "")
  .replace("<!--seo-->", `<title>${person.name}</title>\n    <meta name="robots" content="noindex" />\n    ${fontPreloads.join("\n    ")}`)
  .replace("<!--app-html-->", "");
await writeFile(path.join(dist, "app.html"), shell);

// 3. sitemap.xml and llms.txt
const today = new Date().toISOString().slice(0, 10);
await writeFile(
  path.join(dist, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes.map((r) => `  <url>\n    <loc>${SITE}${r}</loc>\n    <lastmod>${today}</lastmod>\n  </url>`).join("\n")}
</urlset>
`,
);

const home = pageMeta("/");
await writeFile(
  path.join(dist, "llms.txt"),
  `# ${person.name}

> ${home.description}

${person.role}. Portfolio: ${SITE}/

## Experience

${experiences.map((e) => `- ${e.role}, ${e.company} (${e.period}): ${e.summary}`).join("\n")}

## Projects

${projects.map((p) => `- [${p.title}](${SITE}/projects/${p.id}): ${p.summary} Built with ${p.stack.join(", ")}.`).join("\n")}

## Contact

- Email: ${person.email}
${socials.map((s) => `- [${s.label}](${s.href})`).join("\n")}
`,
);

// 4. precompressed copies for gzip_static
const COMPRESS = /\.(html|js|css|svg|json|xml|txt|webmanifest)$/;
let count = 0;
async function walk(dir) {
  for (const name of await readdir(dir)) {
    const file = path.join(dir, name);
    if ((await stat(file)).isDirectory()) await walk(file);
    else if (COMPRESS.test(name) && (await stat(file)).size > 1024) {
      await writeFile(`${file}.gz`, gzipSync(await readFile(file), { level: constants.Z_BEST_COMPRESSION }));
      count++;
    }
  }
}
await walk(dist);
console.log(`gzipped ${count} files`);

await rm(ssrDir, { recursive: true, force: true });
