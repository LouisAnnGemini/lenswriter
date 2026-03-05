import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../store/StoreContext';
import { FolderOpen, Save, AlertCircle, CheckCircle2, Clock, RotateCcw, X } from 'lucide-react';
import { cn } from '../lib/utils';

export function BackupManager({ onClose }: { onClose: () => void }) {
  const { state } = useStore();
  const [directoryHandle, setDirectoryHandle] = useState<FileSystemDirectoryHandle | null>(null);
  const [isBackupEnabled, setIsBackupEnabled] = useState(false);
  const [lastBackupTime, setLastBackupTime] = useState<Date | null>(null);
  const [backupCount, setBackupCount] = useState(0);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [statusType, setStatusType] = useState<'info' | 'success' | 'error'>('info');
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Check if File System Access API is supported
  const isSupported = 'showDirectoryPicker' in window;

  const handleSelectDirectory = async () => {
    if (!isSupported) {
      setStatusMessage('File System Access API is not supported in this browser.');
      setStatusType('error');
      return;
    }

    try {
      const handle = await (window as any).showDirectoryPicker();
      setDirectoryHandle(handle);
      setStatusMessage(`Selected directory: ${handle.name}`);
      setStatusType('success');
      
      // Count existing backups
      let count = 0;
      for await (const entry of handle.values()) {
        if (entry.kind === 'file' && entry.name.startsWith('lenswriter_backup_') && entry.name.endsWith('.json')) {
          count++;
        }
      }
      setBackupCount(count);
    } catch (error) {
      console.error('Error selecting directory:', error);
      setStatusMessage('Failed to select directory or permission denied.');
      setStatusType('error');
    }
  };

  const performBackup = async () => {
    if (!directoryHandle) return;

    try {
      // 1. Generate filename
      const now = new Date();
      const timestamp = now.toISOString().replace(/[:.]/g, '-');
      const filename = `lenswriter_backup_${timestamp}.json`;
      const content = JSON.stringify(state, null, 2);

      // 2. Write new file
      const fileHandle = await directoryHandle.getFileHandle(filename, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(content);
      await writable.close();

      setLastBackupTime(now);
      setStatusMessage(`Backup created: ${filename}`);
      setStatusType('success');

      // 3. Rotate backups (keep last 30)
      const backups: { name: string, handle: FileSystemFileHandle }[] = [];
      for await (const entry of directoryHandle.values()) {
        if (entry.kind === 'file' && entry.name.startsWith('lenswriter_backup_') && entry.name.endsWith('.json')) {
          backups.push({ name: entry.name, handle: entry as FileSystemFileHandle });
        }
      }

      // Sort by name (which includes timestamp)
      backups.sort((a, b) => a.name.localeCompare(b.name));

      setBackupCount(backups.length);

      if (backups.length > 30) {
        const toDelete = backups.slice(0, backups.length - 30);
        for (const file of toDelete) {
          await directoryHandle.removeEntry(file.name);
        }
        setBackupCount(30);
        setStatusMessage(`Backup created. Removed ${toDelete.length} old backup(s).`);
      }

    } catch (error) {
      console.error('Backup failed:', error);
      setStatusMessage('Backup failed. Permission might have expired.');
      setStatusType('error');
      setIsBackupEnabled(false); // Stop auto-backup on error
    }
  };

  // Toggle Auto-Backup
  useEffect(() => {
    if (isBackupEnabled && directoryHandle) {
      // Perform immediate backup when enabled
      performBackup();

      // Set interval for 10 minutes
      intervalRef.current = setInterval(performBackup, 10 * 60 * 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isBackupEnabled, directoryHandle]);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="p-4 border-b border-stone-100 flex items-center justify-between bg-stone-50">
          <h3 className="font-semibold text-stone-900 flex items-center">
            <Save size={18} className="mr-2 text-emerald-600" />
            Local Backup Settings
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-stone-200 rounded-full transition-colors">
            <X size={18} className="text-stone-500" />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          {!isSupported ? (
            <div className="p-4 bg-red-50 text-red-800 rounded-lg text-sm flex items-start">
              <AlertCircle size={16} className="mr-2 mt-0.5 shrink-0" />
              <div>
                Your browser does not support the File System Access API required for local backups. 
                Please use Chrome, Edge, or a compatible browser.
              </div>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium text-stone-700">Backup Directory</div>
                  <button
                    onClick={handleSelectDirectory}
                    className="flex items-center px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-md text-xs font-medium transition-colors border border-stone-300"
                  >
                    <FolderOpen size={14} className="mr-1.5" />
                    {directoryHandle ? 'Change Folder' : 'Select Folder'}
                  </button>
                </div>
                
                {directoryHandle ? (
                  <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-lg">
                    <div className="text-xs text-emerald-800 font-medium truncate mb-1">
                      {directoryHandle.name}
                    </div>
                    <div className="text-[10px] text-emerald-600 flex items-center">
                      <CheckCircle2 size={10} className="mr-1" />
                      Ready for backups
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-stone-50 border border-stone-100 rounded-lg text-xs text-stone-500 italic">
                    No folder selected. Please select a local folder to store backups.
                  </div>
                )}
              </div>

              <div className="space-y-3 pt-4 border-t border-stone-100">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium text-stone-700">Auto-Backup (Every 10m)</div>
                  <button
                    onClick={() => setIsBackupEnabled(!isBackupEnabled)}
                    disabled={!directoryHandle}
                    className={cn(
                      "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2",
                      isBackupEnabled ? "bg-emerald-500" : "bg-stone-200",
                      !directoryHandle && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    <span
                      className={cn(
                        "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                        isBackupEnabled ? "translate-x-6" : "translate-x-1"
                      )}
                    />
                  </button>
                </div>
                
                <div className="text-xs text-stone-500">
                  Automatically saves a JSON copy every 10 minutes. Keeps the last 30 backups.
                </div>
              </div>

              {/* Status Section */}
              <div className="pt-4 border-t border-stone-100 space-y-2">
                <div className="flex items-center justify-between text-xs text-stone-500">
                  <span className="flex items-center">
                    <Clock size={12} className="mr-1" />
                    Last Backup:
                  </span>
                  <span className="font-mono">
                    {lastBackupTime ? lastBackupTime.toLocaleTimeString() : 'Never'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-stone-500">
                  <span className="flex items-center">
                    <RotateCcw size={12} className="mr-1" />
                    Backups Kept:
                  </span>
                  <span className="font-mono">{backupCount} / 30</span>
                </div>
                
                {statusMessage && (
                  <div className={cn(
                    "mt-3 text-xs p-2 rounded",
                    statusType === 'error' ? "bg-red-50 text-red-600" : 
                    statusType === 'success' ? "bg-emerald-50 text-emerald-600" : 
                    "bg-blue-50 text-blue-600"
                  )}>
                    {statusMessage}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
        
        <div className="p-4 bg-stone-50 border-t border-stone-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white border border-stone-300 text-stone-700 rounded-md text-sm font-medium hover:bg-stone-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
