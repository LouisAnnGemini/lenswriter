import { createClient } from 'webdav';

export default async function handler(req: any, res: any) {
  // Vercel functions handle CORS and body parsing automatically
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

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
}
