import React from 'react';
import { StoreProvider, useStore } from './store/StoreContext';
import { Sidebar } from './components/Sidebar';
import { TopNav } from './components/TopNav';
import { OutlinePanel } from './components/OutlinePanel';
import { EditorPanel } from './components/EditorPanel';
import { LensesTab } from './components/LensesTab';
import { CharactersTab } from './components/CharactersTab';
import { Minimize2 } from 'lucide-react';

function MainContent() {
  const { state, dispatch } = useStore();

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-white">
      <TopNav />
      <div className="flex-1 flex overflow-hidden">
        {state.activeTab === 'writing' && (
          <>
            <OutlinePanel />
            <EditorPanel />
          </>
        )}
        {state.activeTab === 'lenses' && <LensesTab />}
        {state.activeTab === 'characters' && <CharactersTab />}
      </div>
      
      {state.focusMode && (
        <button
          onClick={() => dispatch({ type: 'TOGGLE_FOCUS_MODE' })}
          className="fixed top-6 right-6 p-2 bg-white text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-md shadow-sm border border-stone-200 transition-colors z-50"
          title="Exit Focus Mode"
        >
          <Minimize2 size={20} />
        </button>
      )}
    </div>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <div className="flex h-screen w-full overflow-hidden font-sans text-stone-900 bg-stone-900 selection:bg-emerald-200 selection:text-emerald-900">
        <Sidebar />
        <MainContent />
      </div>
    </StoreProvider>
  );
}

