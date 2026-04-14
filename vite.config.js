// Force Deployment Trigger: 2026-03-09T20:05:00Z
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";

const appBuildId =
  process.env.VERCEL_GIT_COMMIT_SHA ||
  process.env.GITHUB_SHA ||
  process.env.npm_package_version ||
  new Date().toISOString();

export default defineConfig({
  define: {
    __APP_BUILD_ID__: JSON.stringify(appBuildId),
  },
  plugins: [
    react(),
    tailwindcss(),
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
                'User-Agent': 'Mozilla/5.0',
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
                      id,
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

  // 🔥 AQUI É O QUE LIBERA PRA OUTRO PC
  server: {
    host: true,           // permite acesso externo
    port: 5173,
    strictPort: true
  },

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
