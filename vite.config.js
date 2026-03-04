import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: [
        'favicon.ico', 
        'apple-touch-icon.png', 
        'images/zyron-logo.png',
        'images/zyron-192.png',
        'images/zyron-512.png'
      ],
      manifest: {
        id: "com.zyron.app",
        name: "ZYRON — A Força da Sua Evolução",
        short_name: "ZYRON",
        description: "Seu personal trainer de IA. A Força da Sua Evolução.",
        theme_color: "#000000",
        background_color: "#000000",
        display: "standalone",
        orientation: "portrait",
        start_url: "/",
        scope: "/",
        categories: ["fitness", "lifestyle", "productivity"],
        screenshots: [
          {
            src: "/images/zyron-512.png",
            sizes: "512x512",
            type: "image/png",
            form_factor: "narrow",
            label: "Home Screen"
          },
          {
            src: "/images/zyron-512.png",
            sizes: "512x512",
            type: "image/png",
            form_factor: "wide",
            label: "Dashboard View"
          }
        ],
        icons: [
          {
            src: "/images/zyron-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any"
          },
          {
            src: "/images/zyron-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any"
          },
          {
            src: "/images/zyron-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "maskable"
          },
          {
            src: "/images/zyron-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable"
          }
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/images\.unsplash\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "unsplash-images",
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 7,
              },
            },
          },
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
            handler: "NetworkFirst",
            options: {
              cacheName: "supabase-api",
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 5,
              },
            },
          },
          {
            urlPattern: /^https:\/\/www\.youtube\.com\/iframe_api/i,
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "youtube-api",
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24, // 1 day
              },
            },
          },
        ],
      },
    }),
  ],
});
