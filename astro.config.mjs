import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";

const siteUrl = process.env.SITE_URL || process.env.CF_PAGES_URL;

export default defineConfig({
  site: siteUrl,
  vite: {
    plugins: [tailwindcss()],
  },
  output: "static",
});
