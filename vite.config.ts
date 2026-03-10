import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';
import bodyParser from 'body-parser';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [
      react(), 
      tailwindcss(),
      {
        name: 'webdav-proxy',
        configureServer(server) {
          server.middlewares.use(bodyParser.json());
          server.middlewares.use(async (req: any, res: any, next: any) => {
            if (req.url === '/api/webdav/health') {
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ status: 'ok', proxy: 'webdav' }));
              return;
            }

            if (req.url !== '/api/webdav/proxy') {
              return next();
            }

            if (req.method !== 'POST') {
              res.statusCode = 405;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Method Not Allowed' }));
              return;
            }

            const { url, username, password, method, filename, content } = req.body || {};

            if (!url || !username || !password || !method) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: "Missing required parameters" }));
              return;
            }

            try {
              // Dynamic import to avoid module resolution issues during config load
              const { createClient } = await import('webdav');
              const client = createClient(url, { username, password });
              
              if (method === "test") {
                await client.getDirectoryContents("/");
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: true }));
                return;
              }

              if (method === "put") {
                if (!filename || content === undefined) {
                  res.statusCode = 400;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ error: "Missing filename or content for put" }));
                  return;
                }
                await client.putFileContents(filename, content);
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: true }));
                return;
              }

              if (method === "get") {
                if (!filename) {
                  res.statusCode = 400;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ error: "Missing filename for get" }));
                  return;
                }
                const data = await client.getFileContents(filename, { format: "text" });
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: true, data }));
                return;
              }

              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: "Invalid method" }));
            } catch (error: any) {
              console.error("[WebDAV Proxy Error]:", error.message);
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: error.message || "WebDAV operation failed" }));
            }
          });
        }
      }
    ],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
