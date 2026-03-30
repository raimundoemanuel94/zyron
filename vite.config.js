// Force Deployment Trigger: 2026-03-09T20:05:00Z
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
        clientsClaim: true,
      },
    }),
    {
      name: 'api-proxy',
      configureServer(server) {
        server.middlewares.use('/api/search', async (req, res) => {
          try {
            const url = new URL(req.url, `http://${req.headers.host}`);
            const q = url.searchParams.get('q');
            if (!q) {
              res.statusCode = 400;
              return res.end(JSON.stringify({ error: 'Missing query' }));
            }
            
            const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`;
            const response = await fetch(searchUrl, {
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
                'Accept-Language': 'en-US,en;q=0.9',
              }
            });
            
            const html = await response.text();
            const match = html.match(/var ytInitialData = (\{.*?\});<\/script>/);
            
            if (match && match[1]) {
              const data = JSON.parse(match[1]);
              const contents = data.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents?.[0]?.itemSectionRenderer?.contents;
              
              if (contents && contents.length > 0) {
                const results = contents
                  .filter(c => c.videoRenderer)
                  .map(c => {
                     const id = c.videoRenderer.videoId;
                     return {
                       id: id,
                       title: c.videoRenderer.title?.runs?.[0]?.text || 'ZYRON Audio',
                       thumbnail: `https://img.youtube.com/vi/${id}/mqdefault.jpg`,
                       artist: c.videoRenderer.ownerText?.runs?.[0]?.text || 'YouTube'
                     };
                  });
                  
                res.setHeader('Content-Type', 'application/json');
                return res.end(JSON.stringify(results.slice(0, 15)));
              }
            }
            res.statusCode = 500;
            res.end(JSON.stringify({ error: 'Parse Error' }));
          } catch(e) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: e.message }));
          }
        });
      }
    }
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-motion': ['framer-motion'],
          'vendor-icons': ['lucide-react'],
          'vendor-db': ['@supabase/supabase-js'],
          'vendor-3d': ['three', '@react-three/fiber', '@react-three/drei']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  }
});
