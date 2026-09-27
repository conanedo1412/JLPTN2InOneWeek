import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

const repoName = process.env.GITHUB_REPOSITORY?.split("/")[1];
const isUserSite = repoName && repoName.toLowerCase().endsWith(".github.io");
const base = process.env.VITE_BASE_PATH ?? (process.env.GITHUB_ACTIONS && repoName && !isUserSite ? `/${repoName}/` : "/");

export default defineConfig({
  base,
  plugins: [
    react(),
    VitePWA({
      registerType: "prompt",
      includeAssets: ["icons/icon.svg"],
      manifest: {
        name: "N2 Quest: 30-day Adventure",
        short_name: "N2 Quest",
        description: "A month of JLPT N2 kanji, vocabulary, grammar, and reading practice.",
        theme_color: "#1b4d4a",
        background_color: "#f7f6f1",
        display: "standalone",
        start_url: ".",
        scope: ".",
        icons: [
          {
            src: "icons/icon.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "any maskable"
          }
        ]
      },
      workbox: {
        cleanupOutdatedCaches: true,
        navigateFallback: "index.html",
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"]
      },
      devOptions: {
        enabled: true
      }
    })
  ]
});
