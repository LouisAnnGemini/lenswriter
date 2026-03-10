import { createClient, WebDAVClient } from 'webdav';

export class WebDAVService {
  private client: WebDAVClient | null = null;

  constructor(url?: string, username?: string, password?: string) {
    if (url && username && password) {
      this.client = createClient(url, {
        username,
        password,
      });
    }
  }

  async testConnection(): Promise<boolean> {
    if (!this.client) return false;
    try {
      await this.client.getDirectoryContents('/');
      return true;
    } catch (error) {
      console.error('WebDAV connection failed:', error);
      return false;
    }
  }

  async saveFile(filename: string, content: string): Promise<boolean> {
    if (!this.client) return false;
    try {
      await this.client.putFileContents(filename, content);
      return true;
    } catch (error) {
      console.error('WebDAV save failed:', error);
      return false;
    }
  }

  async getFile(filename: string): Promise<string | null> {
    if (!this.client) return null;
    try {
      const content = await this.client.getFileContents(filename, { format: 'text' });
      return content as string;
    } catch (error) {
      console.error('WebDAV load failed:', error);
      return null;
    }
  }
}
