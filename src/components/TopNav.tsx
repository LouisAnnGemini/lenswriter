import React from 'react';
import { useStore } from '../store/StoreContext';
import { Edit3, Layers, Users, Maximize2, Minimize2 } from 'lucide-react';
import { cn } from '../lib/utils';

export function TopNav() {
  const { state, dispatch } = useStore();

  if (state.focusMode) return null;

  const tabs = [
    { id: 'writing', label: 'Writing', icon: Edit3 },
    { id: 'lenses', label: 'Lenses', icon: Layers },
    { id: 'characters', label: 'Characters', icon: Users },
  ] as const;

  return (
    <div className="h-14 border-b border-stone-200 bg-white flex items-center justify-between px-6">
      <div className="flex space-x-8 h-full">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => dispatch({ type: 'SET_ACTIVE_TAB', payload: tab.id })}
            className={cn(
              "flex items-center space-x-2 h-full px-1 border-b-2 text-sm font-medium transition-colors",
              state.activeTab === tab.id
                ? "border-emerald-500 text-stone-900"
                : "border-transparent text-stone-500 hover:text-stone-700 hover:border-stone-300"
            )}
          >
            <tab.icon size={16} />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="flex items-center space-x-4">
        <button
          onClick={() => dispatch({ type: 'TOGGLE_FOCUS_MODE' })}
          className="p-2 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-md transition-colors"
          title="Toggle Focus Mode"
        >
          {state.focusMode ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
        </button>
      </div>
    </div>
  );
}
