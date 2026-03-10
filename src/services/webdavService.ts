export class WebDAVService {
  private url?: string;
  private username?: string;
  private password?: string;

  constructor(url?: string, username?: string, password?: string) {
    this.url = url;
    this.username = username;
    this.password = password;
  }

  private async callProxy(method: string, filename?: string, content?: string) {
    if (!this.url || !this.username || !this.password) return null;

    try {
      const response = await fetch('/api/webdav/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: this.url,
          username: this.username,
          password: this.password,
          method,
          filename,
          content
        })
      });

      const contentType = response.headers.get('content-type');
      if (!response.ok) {
        if (contentType && contentType.includes('application/json')) {
          const err = await response.json();
          throw new Error(err.error || 'Proxy request failed');
        } else {
          const text = await response.text();
          throw new Error(`Proxy request failed with status ${response.status}: ${text.slice(0, 100)}`);
        }
      }

      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      } else {
        throw new Error('Proxy returned non-JSON response');
      }
    } catch (error) {
      console.error(`WebDAV Proxy ${method} failed:`, error);
      throw error;
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      const result = await this.callProxy('test', '/');
      return !!result?.success;
    } catch (error) {
      return false;
    }
  }

  async saveFile(filename: string, content: string): Promise<boolean> {
    try {
      const normalizedFilename = filename.startsWith('/') ? filename : `/${filename}`;
      const result = await this.callProxy('put', normalizedFilename, content);
      return !!result?.success;
    } catch (error) {
      return false;
    }
  }

  async getFile(filename: string): Promise<string | null> {
    try {
      const normalizedFilename = filename.startsWith('/') ? filename : `/${filename}`;
      const result = await this.callProxy('get', normalizedFilename);
      return result?.data || null;
    } catch (error) {
      return null;
    }
  }
}
