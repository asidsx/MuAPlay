import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, Plugin} from 'vite';
import {GoogleGenAI} from '@google/genai';

function apiServerPlugin(): Plugin {
  return {
    name: 'api-server-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url === '/api/cover-art' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', async () => {
            try {
              const { artist, title } = JSON.parse(body || '{}');

              // Try iTunes API first
              const query = encodeURIComponent(`${artist || ''} ${title || ''}`);
              const itunesRes = await fetch(`https://itunes.apple.com/search?term=${query}&entity=song&limit=1`);
              if (itunesRes.ok) {
                const data = await itunesRes.json();
                if (data.results && data.results.length > 0) {
                  const coverUrl = data.results[0].artworkUrl100.replace('100x100bb', '600x600bb');
                  res.writeHead(200, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify({ coverUrl, source: 'itunes' }));
                  return;
                }
              }

              // Fallback to Gemini Server-Side
              if (process.env.GEMINI_API_KEY) {
                const ai = new GoogleGenAI({
                  apiKey: process.env.GEMINI_API_KEY,
                  httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
                });
                
                const prompt = `Stylized aesthetic album art description for music track "${title}" by "${artist}". Describe 1 vibrant album artwork.`;
                const response = await ai.models.generateContent({
                  model: 'gemini-3.8-flash',
                  contents: prompt,
                });

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                  coverUrl: `https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80`,
                  aiDescription: response.text,
                  source: 'gemini'
                }));
                return;
              }

              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ coverUrl: null }));
            } catch (err) {
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: String(err) }));
            }
          });
          return;
        }
        next();
      });
    }
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), apiServerPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
        jsmediatags: path.resolve(__dirname, 'node_modules/jsmediatags/dist/jsmediatags.min.js'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
