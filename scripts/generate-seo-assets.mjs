import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

const siteUrl = process.env.SITE_URL ?? process.env.CF_PAGES_URL;
if (!siteUrl) {
  console.warn("SITE_URL/CF_PAGES_URL is not set; skipping sitemap generation.");
  process.exit(0);
}

let site;
try {
  site = new URL(siteUrl);
} catch {
  throw new Error(`Invalid SITE_URL/CF_PAGES_URL: ${siteUrl}`);
}
if (!["http:", "https:"].includes(site.protocol) || site.pathname !== "/" || site.search || site.hash) {
  throw new Error("SITE_URL/CF_PAGES_URL must be an http(s) origin without a path, query, or fragment.");
}

const gamesRoot = join(process.cwd(), "public", "games");
const gameDirectories = await readdir(gamesRoot, { withFileTypes: true });
const gameUrls = await Promise.all(
  gameDirectories
    .filter((entry) => entry.isDirectory())
    .map(async (entry) => {
      const metadataPath = join(gamesRoot, entry.name, "game.json");
      const metadata = JSON.parse(await readFile(metadataPath, "utf8"));
      return { path: `/games/${metadata.id}/`, lastmod: metadata.publishedAt };
    }),
);

const urls = [
  { path: "/", lastmod: gameUrls.map((game) => game.lastmod).sort().at(-1) },
  { path: "/privacy/" },
  { path: "/contact/" },
  ...gameUrls,
];
const xmlEscape = (value) =>
  value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&apos;");
const sitemap = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...urls.map(({ path, lastmod }) => [
    "  <url>",
    `    <loc>${xmlEscape(new URL(path, site).href)}</loc>`,
    ...(lastmod ? [`    <lastmod>${xmlEscape(lastmod)}</lastmod>`] : []),
    "  </url>",
  ].join("\n")),
  "</urlset>",
  "",
].join("\n");

const outputDirectory = join(process.cwd(), "dist");
await mkdir(outputDirectory, { recursive: true });
await writeFile(join(outputDirectory, "sitemap.xml"), sitemap);
await writeFile(join(outputDirectory, "robots.txt"), `User-agent: *\nAllow: /\nSitemap: ${new URL("/sitemap.xml", site).href}\n`);
console.info(`Generated sitemap.xml with ${urls.length} URLs for ${site.origin}.`);
