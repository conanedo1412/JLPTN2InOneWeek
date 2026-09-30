import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

const repoName = process.env.GITHUB_REPOSITORY?.split("/")[1];
const isUserSite = repoName && repoName.toLowerCase().endsWith(".github.io");
const base = process.env.VITE_BASE_PATH ?? (process.env.GITHUB_ACTIONS && repoName && !isUserSite ? `/${repoName}/` : "/");

export default defineConfig({
  base,
  build: { rollupOptions: { output: { manualChunks(id) { if (id.endsWith("expandedVocabulary.json")) return "vocabulary-data"; } } } },
  plugins: [
    react(),
    VitePWA({
      registerType: "prompt",
      includeAssets: ["icons/icon.svg"],
      manifest: {
        name: "日本語二級の冒険：三十日間の学習",
        short_name: "日本語二級の冒険",
        description: "日本語能力試験二級の漢字・語彙・文法・読解を一か月で学習。",
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
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
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
