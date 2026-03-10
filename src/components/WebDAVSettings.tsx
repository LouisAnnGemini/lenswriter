import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useStore } from '../store/StoreContext';
import { WebDAVService } from '../services/webdavService';
import { Cloud, Check, X, RefreshCw, Save, Download, AlertCircle, ShieldCheck } from 'lucide-react';
import { cn } from '../lib/utils';
import { useFirebase } from '../context/FirebaseContext';

export function WebDAVSettings({ onClose }: { onClose: () => void }) {
  const { state, dispatch } = useStore();
  const { user } = useFirebase();
  const config = state.webdavConfig || { url: '', username: '', password: '', filename: 'lenswriter_backup.json', autoSync: false };
  
  const [url, setUrl] = useState(config.url);
  const [username, setUsername] = useState(config.username);
  const [password, setPassword] = useState(config.password || '');
  const [filename, setFilename] = useState(config.filename);
  const [autoSync, setAutoSync] = useState(config.autoSync);
  
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);
  const [syncing, setSyncing] = useState(false);

  const handleSaveConfig = () => {
    dispatch({
      type: 'UPDATE_WEBDAV_CONFIG',
      payload: { url, username, password, filename, autoSync }
    });
    alert('Settings saved' + (user ? ' and synced to your account.' : ' locally.'));
  };

  const testConnection = async () => {
    setTesting(true);
    setTestResult(null);
    
    // Safety timeout in UI
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout')), 20000)
    );

    try {
      const service = new WebDAVService(url, username, password);
      const success = await Promise.race([
        service.testConnection(),
        timeoutPromise
      ]) as boolean;
      
      setTestResult(success ? 'success' : 'error');
    } catch (error) {
      console.error('Test connection error:', error);
      setTestResult('error');
    } finally {
      setTesting(false);
    }
  };

  const manualSyncToCloud = async () => {
    setSyncing(true);
    const service = new WebDAVService(url, username, password);
    const { past, future, ...stateToSave } = state;
    const success = await service.saveFile(filename, JSON.stringify(stateToSave));
    if (success) {
      dispatch({ type: 'SET_WEBDAV_SYNC_TIME', payload: Date.now() });
      alert('Successfully synced to WebDAV!');
    } else {
      alert('Failed to sync to WebDAV. Check your settings.');
    }
    setSyncing(false);
  };

  const manualSyncFromCloud = async () => {
    if (!confirm('This will overwrite your current local data with the cloud backup. Continue?')) return;
    
    setSyncing(true);
    const service = new WebDAVService(url, username, password);
    const content = await service.getFile(filename);
    if (content) {
      try {
        const parsed = JSON.parse(content);
        dispatch({ type: 'IMPORT_DATA', payload: parsed });
        alert('Successfully loaded from WebDAV!');
      } catch (e) {
        alert('Failed to parse cloud data.');
      }
    } else {
      alert('Failed to fetch file from WebDAV.');
    }
    setSyncing(false);
  };

  return createPortal(
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-stone-100 flex items-center justify-between bg-stone-50">
          <div className="flex items-center space-x-3 text-stone-900">
            <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
              <Cloud size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold">WebDAV Sync</h2>
              <p className="text-xs text-stone-500">Sync your data to personal cloud</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-stone-200 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto max-h-[70vh]">
          {user && (
            <div className="flex items-center space-x-2 p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-700 text-xs">
              <ShieldCheck size={14} className="shrink-0" />
              <span>These settings are synced with your account <strong>{user.email}</strong>.</span>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-bold text-stone-400 uppercase tracking-wider">Server URL</label>
            <input 
              type="text" 
              value={url} 
              onChange={e => setUrl(e.target.value)}
              placeholder="https://dav.example.com"
              className="w-full px-4 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-stone-400 uppercase tracking-wider">Username</label>
              <input 
                type="text" 
                value={username} 
                onChange={e => setUsername(e.target.value)}
                className="w-full px-4 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-stone-400 uppercase tracking-wider">Password</label>
              <input 
                type="password" 
                value={password} 
                onChange={e => setPassword(e.target.value)}
                className="w-full px-4 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-stone-400 uppercase tracking-wider">Backup Filename</label>
            <input 
              type="text" 
              value={filename} 
              onChange={e => setFilename(e.target.value)}
              className="w-full px-4 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
            />
          </div>

          <div className="flex items-center justify-between p-3 bg-stone-50 rounded-xl border border-stone-100">
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-stone-700">Auto Sync</span>
              <span className="text-[10px] text-stone-500">Sync automatically on changes</span>
            </div>
            <button 
              onClick={() => setAutoSync(!autoSync)}
              className={cn(
                "w-12 h-6 rounded-full transition-colors relative",
                autoSync ? "bg-emerald-500" : "bg-stone-300"
              )}
            >
              <div className={cn(
                "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                autoSync ? "left-7" : "left-1"
              )} />
            </button>
          </div>

          <div className="flex space-x-2 pt-2">
            <button 
              onClick={testConnection}
              disabled={testing || !url}
              className="flex-1 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl font-semibold text-sm transition-colors flex items-center justify-center space-x-2"
            >
              {testing ? <RefreshCw size={16} className="animate-spin" /> : (testResult === 'success' ? <Check size={16} className="text-emerald-500" /> : (testResult === 'error' ? <AlertCircle size={16} className="text-red-500" /> : null))}
              <span>Test Connection</span>
            </button>
            <button 
              onClick={handleSaveConfig}
              className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-semibold text-sm transition-colors shadow-lg shadow-emerald-500/20"
            >
              Save Settings
            </button>
          </div>

          <div className="pt-4 border-t border-stone-100 grid grid-cols-2 gap-3">
            <button 
              onClick={manualSyncToCloud}
              disabled={syncing || !config.url}
              className="py-3 bg-stone-900 hover:bg-stone-800 text-white rounded-xl font-semibold text-sm transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <Save size={16} />
              <span>Push to Cloud</span>
            </button>
            <button 
              onClick={manualSyncFromCloud}
              disabled={syncing || !config.url}
              className="py-3 bg-white border border-stone-200 hover:bg-stone-50 text-stone-700 rounded-xl font-semibold text-sm transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <Download size={16} />
              <span>Pull from Cloud</span>
            </button>
          </div>
          
          {config.lastSync && (
            <p className="text-[10px] text-center text-stone-400">
              Last synced: {new Date(config.lastSync).toLocaleString()}
            </p>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
