import express from 'express';
import { createServer as createViteServer } from 'vite';
import { createClient } from 'webdav';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Health check endpoint
  app.get('/api/webdav/health', (req, res) => {
    res.json({ status: 'ok', proxy: 'webdav', env: process.env.NODE_ENV });
  });

  // WebDAV Proxy endpoint
  app.post('/api/webdav/proxy', async (req, res) => {
    const { url, username, password, method, filename, content } = req.body || {};

    if (!url || !username || !password || !method) {
      return res.status(400).json({ error: "Missing required parameters" });
    }

    try {
      const client = createClient(url, { username, password });
      
      if (method === "test") {
        await client.getDirectoryContents("/");
        return res.json({ success: true });
      }

      if (method === "put") {
        if (!filename || content === undefined) {
          return res.status(400).json({ error: "Missing filename or content for put" });
        }
        await client.putFileContents(filename, content);
        return res.json({ success: true });
      }

      if (method === "get") {
        if (!filename) {
          return res.status(400).json({ error: "Missing filename for get" });
        }
        const data = await client.getFileContents(filename, { format: "text" });
        return res.json({ success: true, data });
      }

      res.status(400).json({ error: "Invalid method" });
    } catch (error: any) {
      console.error("[WebDAV Proxy Error]:", error.message);
      res.status(500).json({ error: error.message || "WebDAV operation failed" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
