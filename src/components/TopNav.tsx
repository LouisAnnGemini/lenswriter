import React, { useState } from 'react';
import { useStore } from '../store/StoreContext';
import { useFirebase } from '../context/FirebaseContext';
import { Edit3, Layers, Users, Maximize2, Minimize2, Menu, ChevronLeft, FileText, MessageSquare, MessageSquareOff, Eye, LogIn, LogOut, Cloud } from 'lucide-react';
import { cn } from '../lib/utils';
import { WebDAVSettings } from './WebDAVSettings';

export function TopNav({ setMobileOpen, onSignIn }: { setMobileOpen?: (open: boolean) => void, onSignIn: () => void }) {
  const { state, dispatch } = useStore();
  const { user, signOut } = useFirebase();
  const [showWebDAVSettings, setShowWebDAVSettings] = useState(false);

  if (state.focusMode) return null;

  const tabs = [
    { id: 'writing', label: 'Writing', icon: Edit3 },
    { id: 'lenses', label: 'Lenses', icon: Layers },
    { id: 'characters', label: 'Characters', icon: Users },
    { id: 'compile', label: 'Compile', icon: FileText },
  ] as const;

  return (
    <>
      {/* Desktop Top Nav */}
      <div className="h-14 border-b border-stone-200 bg-white flex items-center justify-between px-4 md:px-6 shrink-0">
        <div className="flex items-center">
          {state.activeTab === 'writing' && state.activeDocumentId ? (
            <button 
              className="md:hidden mr-4 p-2 -ml-2 text-stone-500 hover:bg-stone-100 rounded-md"
              onClick={() => dispatch({ type: 'SET_ACTIVE_DOCUMENT', payload: null })}
            >
              <ChevronLeft size={20} />
            </button>
          ) : (
            <button 
              className="md:hidden mr-4 p-2 -ml-2 text-stone-500 hover:bg-stone-100 rounded-md"
              onClick={() => setMobileOpen?.(true)}
            >
              <Menu size={20} />
            </button>
          )}
          
          <div className="hidden md:flex space-x-8 h-full">
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
          <div className="md:hidden absolute left-1/2 -translate-x-1/2 font-semibold text-stone-900 truncate max-w-[60%]">
            {state.works.find(w => w.id === state.activeWorkId)?.title || 'LensWriter'}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => dispatch({ type: 'TOGGLE_DISGUISE_MODE' })}
            className="p-2 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-md transition-colors hidden md:block"
            title="Enter Disguise Mode"
          >
            <Eye size={18} />
          </button>
          {state.activeTab === 'writing' && (
            <button
              onClick={() => dispatch({ type: 'TOGGLE_SHOW_DESCRIPTIONS' })}
              className={cn(
                "p-2 rounded-md transition-colors hidden md:block",
                state.showDescriptions ? "text-emerald-600 bg-emerald-50 hover:bg-emerald-100" : "text-stone-400 hover:text-stone-600 hover:bg-stone-100"
              )}
              title={state.showDescriptions ? "Hide Descriptions" : "Show Descriptions"}
            >
              {state.showDescriptions ? <MessageSquare size={18} /> : <MessageSquareOff size={18} />}
            </button>
          )}
          <button
            onClick={() => dispatch({ type: 'TOGGLE_FOCUS_MODE' })}
            className="p-2 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-md transition-colors hidden md:block"
            title="Toggle Focus Mode"
          >
            {state.focusMode ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </button>

          <div className="md:hidden flex items-center">
            <button
              onClick={() => setShowWebDAVSettings(true)}
              className="p-2 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-md transition-colors mr-1"
              title="WebDAV Sync"
            >
              <Cloud size={18} />
            </button>
            {user ? (
              <button
                onClick={signOut}
                className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                title="Sign Out"
              >
                <LogOut size={18} />
              </button>
            ) : (
              <button
                onClick={onSignIn}
                className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors"
                title="Sign In"
              >
                <LogIn size={18} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Bottom Nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-stone-200 flex items-center justify-around z-30 pb-safe">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => dispatch({ type: 'SET_ACTIVE_TAB', payload: tab.id })}
            className={cn(
              "flex flex-col items-center justify-center w-full h-full space-y-1",
              state.activeTab === tab.id
                ? "text-emerald-600"
                : "text-stone-400"
            )}
          >
            <tab.icon size={20} />
            <span className="text-[10px] font-medium">{tab.label}</span>
          </button>
        ))}
      </div>

      {showWebDAVSettings && (
        <WebDAVSettings onClose={() => setShowWebDAVSettings(false)} />
      )}
    </>
  );
}
