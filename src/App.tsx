import React from 'react';
import { StoreProvider, useStore } from './store/StoreContext';
import { Sidebar } from './components/Sidebar';
import { TopNav } from './components/TopNav';
import { OutlinePanel } from './components/OutlinePanel';
import { EditorPanel } from './components/EditorPanel';
import { LensesTab } from './components/LensesTab';
import { CharactersTab } from './components/CharactersTab';
import { ArchitectureTab } from './components/ArchitectureTab';
import { CompileTab } from './components/CompileTab';
import { Minimize2, MessageSquare, MessageSquareOff } from 'lucide-react';
import { cn } from './lib/utils';

function MainContent({ mobileOpen, setMobileOpen }: { mobileOpen: boolean, setMobileOpen: (open: boolean) => void }) {
  const { state, dispatch } = useStore();

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-white relative">
      <TopNav setMobileOpen={setMobileOpen} />
      <div className="flex-1 flex overflow-hidden">
        {state.activeTab === 'writing' && (
          <>
            <OutlinePanel setMobileOpen={setMobileOpen} />
            <EditorPanel />
          </>
        )}
        {state.activeTab === 'lenses' && <LensesTab />}
        {state.activeTab === 'characters' && <CharactersTab />}
        {state.activeTab === 'architecture' && <ArchitectureTab />}
        {state.activeTab === 'compile' && <CompileTab />}
      </div>
      
      {state.focusMode && (
        <div className="fixed top-6 right-6 flex items-center space-x-2 z-50">
          <button
            onClick={() => dispatch({ type: 'TOGGLE_SHOW_DESCRIPTIONS' })}
            className={cn(
              "p-2 bg-white rounded-md shadow-sm border border-stone-200 transition-colors",
              state.showDescriptions ? "text-emerald-600 hover:bg-emerald-50" : "text-stone-400 hover:text-stone-600 hover:bg-stone-100"
            )}
            title={state.showDescriptions ? "Hide Descriptions" : "Show Descriptions"}
          >
            {state.showDescriptions ? <MessageSquare size={20} /> : <MessageSquareOff size={20} />}
          </button>
          <button
            onClick={() => dispatch({ type: 'TOGGLE_FOCUS_MODE' })}
            className="p-2 bg-white text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-md shadow-sm border border-stone-200 transition-colors"
            title="Exit Focus Mode"
          >
            <Minimize2 size={20} />
          </button>
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [mobileOpen, setMobileOpen] = React.useState(false);

  return (
    <StoreProvider>
      <div className="flex h-screen w-full overflow-hidden font-sans text-stone-900 bg-stone-900 selection:bg-emerald-200 selection:text-emerald-900">
        <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
        <MainContent mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
      </div>
    </StoreProvider>
  );
}

