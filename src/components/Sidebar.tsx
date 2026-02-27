import React, { useState } from 'react';
import { useStore } from '../store/StoreContext';
import { Book, Plus, ChevronLeft, ChevronRight, Download, Upload } from 'lucide-react';
import { cn } from '../lib/utils';

export function Sidebar() {
  const { state, dispatch } = useStore();
  const [collapsed, setCollapsed] = useState(false);
  const [newWorkTitle, setNewWorkTitle] = useState('');

  if (state.focusMode) return null;

  const handleAddWork = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && newWorkTitle.trim()) {
      dispatch({ type: 'ADD_WORK', payload: { title: newWorkTitle.trim() } });
      setNewWorkTitle('');
    }
  };

  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "story-weaver-data.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json && typeof json === 'object' && 'works' in json) {
          dispatch({ type: 'IMPORT_DATA', payload: json });
        } else {
          alert('Invalid data format');
        }
      } catch (error) {
        alert('Error parsing JSON file');
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset input
  };

  return (
    <div className={cn(
      "h-screen bg-stone-900 text-stone-300 flex flex-col transition-all duration-300 border-r border-stone-800",
      collapsed ? "w-16" : "w-64"
    )}>
      <div className="p-4 flex items-center justify-between border-b border-stone-800">
        {!collapsed && <span className="font-semibold text-stone-100 tracking-wide uppercase text-sm">Works</span>}
        <button 
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 hover:bg-stone-800 rounded-md text-stone-400 hover:text-stone-100 transition-colors"
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-4 space-y-1">
        {state.works.map(work => (
          <button
            key={work.id}
            onClick={() => dispatch({ type: 'SET_ACTIVE_WORK', payload: work.id })}
            className={cn(
              "w-full flex items-center px-4 py-2 text-sm transition-colors",
              state.activeWorkId === work.id 
                ? "bg-stone-800 text-stone-100 border-r-2 border-emerald-500" 
                : "hover:bg-stone-800/50 hover:text-stone-200"
            )}
            title={work.title}
          >
            <Book size={16} className={cn("shrink-0", collapsed ? "mx-auto" : "mr-3")} />
            {!collapsed && <span className="truncate">{work.title}</span>}
          </button>
        ))}
      </div>

      {!collapsed && (
        <div className="p-4 border-t border-stone-800 space-y-4">
          <div className="relative">
            <Plus size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" />
            <input
              type="text"
              placeholder="New Work..."
              value={newWorkTitle}
              onChange={e => setNewWorkTitle(e.target.value)}
              onKeyDown={handleAddWork}
              className="w-full bg-stone-800 text-stone-200 text-sm rounded-md pl-9 pr-3 py-2 outline-none focus:ring-1 focus:ring-emerald-500 placeholder:text-stone-500"
            />
          </div>
          <div className="flex space-x-2">
            <button
              onClick={handleExport}
              className="flex-1 flex items-center justify-center py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-md text-xs font-medium transition-colors"
              title="Export Data"
            >
              <Download size={14} className="mr-2" />
              Export
            </button>
            <label className="flex-1 flex items-center justify-center py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-md text-xs font-medium transition-colors cursor-pointer" title="Import Data">
              <Upload size={14} className="mr-2" />
              Import
              <input type="file" accept=".json" onChange={handleImport} className="hidden" />
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
