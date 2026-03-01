import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../store/StoreContext';
import { Layers, MapPin, Edit2, Link as LinkIcon, X, Plus, Lock, Filter, ExternalLink } from 'lucide-react';
import { cn } from '../lib/utils';

const LENS_COLORS = {
  red: 'bg-red-50 border-red-200 text-red-900',
  blue: 'bg-blue-50 border-blue-200 text-blue-900',
  green: 'bg-emerald-50 border-emerald-200 text-emerald-900',
  yellow: 'bg-amber-50 border-amber-200 text-amber-900',
  purple: 'bg-purple-50 border-purple-200 text-purple-900',
  black: 'bg-stone-900 border-stone-700 text-stone-100',
};

export function LensesTab() {
  const { state, dispatch } = useStore();
  const activeWorkId = state.activeWorkId;
  const activeWork = state.works.find(w => w.id === activeWorkId);
  const selectedLensId = state.activeLensId;
  const [filterColor, setFilterColor] = useState<string | 'all'>('all');
  const [filterChapterId, setFilterChapterId] = useState<string | 'all'>('all');
  const descriptionRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (selectedLensId) {
      // Scroll to the selected lens card
      setTimeout(() => {
        const el = document.getElementById(`lens-card-${selectedLensId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    }
  }, [selectedLensId]);

  useEffect(() => {
    if (descriptionRef.current) {
      descriptionRef.current.style.height = 'auto';
      descriptionRef.current.style.height = descriptionRef.current.scrollHeight + 'px';
    }
  }, [activeWork?.lensesDescription]);

  if (!activeWorkId) return <div className="flex-1 flex items-center justify-center text-stone-400">Select a work</div>;

  // Get all lenses for the active work
  const workChapters = state.chapters.filter(c => c.workId === activeWorkId);
  const workScenes = state.scenes.filter(s => workChapters.some(c => c.id === s.chapterId));
  const documentIds = [...workChapters.map(c => c.id), ...workScenes.map(s => s.id)];
  
  let lenses = state.blocks.filter(b => b.type === 'lens' && documentIds.includes(b.documentId));

  // Apply filters
  if (filterColor !== 'all') {
    lenses = lenses.filter(l => l.color === filterColor);
  }

  if (filterChapterId !== 'all') {
    lenses = lenses.filter(l => {
      // Direct chapter lens
      if (l.documentId === filterChapterId) return true;
      
      // Scene lens belonging to this chapter
      const scene = state.scenes.find(s => s.id === l.documentId);
      if (scene && scene.chapterId === filterChapterId) return true;
      
      return false;
    });
  }

  const getLensLocation = (docId: string) => {
    const scene = state.scenes.find(s => s.id === docId);
    if (scene) {
      const chapter = state.chapters.find(c => c.id === scene.chapterId);
      return `${chapter?.title || 'Unknown Chapter'} > ${scene.title}`;
    }
    const chapter = state.chapters.find(c => c.id === docId);
    return chapter?.title || 'Unknown Location';
  };

  const handleUpdateLens = (id: string, updates: any) => {
    dispatch({ type: 'UPDATE_BLOCK', payload: { id, ...updates } });
  };

  const scrollToLens = (lensId: string) => {
    const el = document.getElementById(`lens-card-${lensId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('ring-4', 'ring-emerald-500', 'ring-offset-2');
      setTimeout(() => el.classList.remove('ring-4', 'ring-emerald-500', 'ring-offset-2'), 2000);
    }
  };

  const handleNavigateToLens = (lensId: string, documentId: string) => {
    dispatch({ type: 'SET_ACTIVE_TAB', payload: 'writing' });
    dispatch({ type: 'SET_ACTIVE_DOCUMENT', payload: documentId });
    setTimeout(() => {
      const el = document.getElementById(`block-${lensId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.add('ring-2', 'ring-emerald-500', 'ring-offset-2');
        setTimeout(() => el.classList.remove('ring-2', 'ring-emerald-500', 'ring-offset-2'), 2000);
      }
    }, 100);
  };

  return (
    <div className="flex-1 flex overflow-hidden bg-stone-50/50">
      {/* Lenses Grid */}
      <div className={cn("flex-1 overflow-y-auto p-4 md:p-6 transition-all pb-24 md:pb-6", selectedLensId ? "hidden md:block md:pr-96" : "")}>
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 md:mb-8 space-y-4 md:space-y-0">
            <div className="flex-1 max-w-2xl">
              <h2 className="text-2xl font-serif font-semibold text-stone-900">Color Lenses</h2>
              <textarea
                ref={descriptionRef}
                value={activeWork?.lensesDescription ?? "Global summary of all highlighted information."}
                onChange={(e) => {
                  dispatch({ type: 'UPDATE_WORK', payload: { id: activeWorkId, lensesDescription: e.target.value } });
                  e.target.style.height = 'auto';
                  e.target.style.height = e.target.scrollHeight + 'px';
                }}
                onFocus={(e) => {
                  e.target.style.height = 'auto';
                  e.target.style.height = e.target.scrollHeight + 'px';
                }}
                className="text-sm text-stone-500 mt-1 bg-transparent border-b border-transparent hover:border-stone-300 focus:border-emerald-500 outline-none w-full transition-colors resize-none overflow-hidden block"
                placeholder="Enter a description for your lenses..."
                rows={1}
                style={{ minHeight: '24px' }}
              />
            </div>
            <div className="flex flex-col md:flex-row md:items-center space-y-3 md:space-y-0 md:space-x-4 w-full md:w-auto">
              {/* Chapter Filter */}
              <div className="flex items-center space-x-2 bg-white border border-stone-200 rounded-lg px-3 py-2 md:py-1.5 shadow-sm w-full md:w-auto">
                <Filter size={14} className="text-stone-400 shrink-0" />
                <select 
                  value={filterChapterId}
                  onChange={(e) => setFilterChapterId(e.target.value)}
                  className="text-xs font-medium bg-transparent border-none outline-none text-stone-600 cursor-pointer w-full md:w-auto"
                >
                  <option value="all">All Chapters</option>
                  {workChapters.sort((a, b) => a.order - b.order).map(chap => (
                    <option key={chap.id} value={chap.id}>{chap.title}</option>
                  ))}
                </select>
              </div>

              {/* Color Filter */}
              <div className="flex items-center space-x-2 bg-white border border-stone-200 rounded-lg px-3 py-2 md:py-1.5 shadow-sm w-full md:w-auto">
                <div 
                  className={cn(
                    "w-3 h-3 rounded-full border border-black/10 shrink-0",
                    filterColor === 'all' ? "bg-stone-200" : (filterColor === 'black' ? "bg-stone-900" : `bg-${filterColor === 'green' ? 'emerald' : (filterColor === 'yellow' ? 'amber' : filterColor)}-400`)
                  )} 
                />
                <select 
                  value={filterColor}
                  onChange={(e) => setFilterColor(e.target.value)}
                  className="text-xs font-medium bg-transparent border-none outline-none text-stone-600 cursor-pointer w-full md:w-auto"
                >
                  <option value="all">All Colors</option>
                  {Object.keys(LENS_COLORS).map(color => (
                    <option key={color} value={color}>{color.charAt(0).toUpperCase() + color.slice(1)}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
            {lenses.map(lens => (
              <div 
                key={lens.id}
                id={`lens-card-${lens.id}`}
                className={cn(
                  "break-inside-avoid rounded-xl border-2 p-5 shadow-sm transition-all duration-500 hover:shadow-md cursor-pointer group relative",
                  LENS_COLORS[lens.color as keyof typeof LENS_COLORS] || LENS_COLORS.red,
                  selectedLensId === lens.id && "ring-2 ring-emerald-500 ring-offset-2"
                )}
                onClick={() => dispatch({ type: 'SET_ACTIVE_LENS', payload: lens.id })}
              >
                <div className="flex justify-between items-start mb-3 pb-2 border-b border-black/10">
                  <div className="flex items-center text-xs font-medium opacity-60">
                    <MapPin size={12} className="mr-1.5 shrink-0" />
                    <span className="truncate">{getLensLocation(lens.documentId)}</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleNavigateToLens(lens.id, lens.documentId);
                    }}
                    className="text-stone-500 hover:text-emerald-700 p-1 hover:bg-black/5 rounded transition-colors"
                    title="Go to location in text"
                  >
                    <ExternalLink size={14} />
                  </button>
                </div>
                
                <div className="text-sm leading-relaxed font-medium line-clamp-6 mb-4">
                  {lens.color === 'black' ? (
                    <span className="text-stone-500 italic flex items-center"><Lock size={14} className="mr-1"/> Hidden Content</span>
                  ) : (
                    lens.content || <span className="italic opacity-50">Empty lens...</span>
                  )}
                </div>

                {lens.notes && (
                  <div className="mb-4 p-3 bg-white/50 rounded-lg text-xs text-stone-700 whitespace-pre-wrap border border-black/5">
                    <span className="font-bold block mb-1 opacity-70">Private Notes:</span>
                    {lens.notes}
                  </div>
                )}

                {lens.linkedLensIds && lens.linkedLensIds.length > 0 && (
                  <div className="mb-4 pt-3 border-t border-black/10 flex flex-wrap gap-2">
                    {lens.linkedLensIds.map(linkedId => {
                      const linkedLens = lenses.find(l => l.id === linkedId);
                      if (!linkedLens) return null;
                      return (
                        <button
                          key={linkedId}
                          onClick={(e) => {
                            e.stopPropagation();
                            scrollToLens(linkedId);
                          }}
                          className={cn(
                            "text-xs flex items-center px-2 py-1 rounded transition-colors font-medium",
                            lens.color === 'black' ? "bg-white/10 hover:bg-white/20 text-stone-300" : "bg-black/5 hover:bg-black/10 text-stone-700"
                          )}
                        >
                          <LinkIcon size={10} className="mr-1 shrink-0" />
                          <span className="truncate max-w-[150px]">
                            {linkedLens.color === 'black' ? 'Hidden Content' : (linkedLens.content || 'Empty lens')}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}

                <div className="flex items-center justify-between pt-3 border-t border-black/10">
                  <div className="flex items-center space-x-3 text-xs font-semibold opacity-70">
                    {lens.notes && (
                      <span className="flex items-center"><Edit2 size={12} className="mr-1" /> Note</span>
                    )}
                    {lens.linkedLensIds && lens.linkedLensIds.length > 0 && (
                      <span className="flex items-center"><LinkIcon size={12} className="mr-1" /> {lens.linkedLensIds.length}</span>
                    )}
                  </div>
                  <button 
                    className="opacity-0 group-hover:opacity-100 px-2.5 py-1 bg-black/5 hover:bg-black/10 rounded-md text-xs font-bold transition-all"
                    onClick={(e) => { e.stopPropagation(); dispatch({ type: 'SET_ACTIVE_LENS', payload: lens.id }); }}
                  >
                    Details
                  </button>
                </div>
              </div>
            ))}
            
            {lenses.length === 0 && (
              <div className="col-span-full py-20 text-center text-stone-400">
                <Layers size={48} className="mx-auto mb-4 opacity-20" />
                <p>No Color Lenses found in this work.</p>
                <p className="text-sm mt-2">Add them in the Writing tab to highlight important information.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Detail Sidebar */}
      {selectedLensId && (
        <div className="w-full md:w-96 border-l border-stone-200 bg-white shadow-2xl fixed right-0 top-0 md:top-14 bottom-0 z-50 md:z-20 flex flex-col animate-in slide-in-from-right-8 duration-300 pb-safe">
          {(() => {
            const lens = lenses.find(l => l.id === selectedLensId);
            if (!lens) return null;

            return (
              <>
                <div className="p-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/50 pt-safe-top">
                  <h3 className="font-semibold text-stone-900 flex items-center">
                    <Layers size={16} className="mr-2 text-stone-400" />
                    Lens Details
                  </h3>
                  <button 
                    onClick={() => dispatch({ type: 'SET_ACTIVE_LENS', payload: null })}
                    className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-200 rounded-md transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                  {/* Content Edit */}
                  <div>
                    <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">Content</label>
                    <textarea
                      value={lens.content}
                      onChange={(e) => handleUpdateLens(lens.id, { content: e.target.value })}
                      placeholder={lens.color === 'black' ? "Hidden content..." : "Enter lens content..."}
                      className={cn(
                        "w-full h-48 p-4 rounded-lg border-2 resize-none outline-none text-sm font-medium leading-relaxed",
                        LENS_COLORS[lens.color as keyof typeof LENS_COLORS] || LENS_COLORS.red,
                        lens.color === 'black' ? "text-transparent focus:text-stone-100 placeholder:text-stone-700 focus:placeholder:text-stone-500 selection:bg-stone-700 selection:text-stone-100" : ""
                      )}
                    />
                  </div>

                  {/* Private Notes */}
                  <div>
                    <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                      <span>Private Notes</span>
                      <span className="text-[10px] bg-stone-100 text-stone-500 px-1.5 py-0.5 rounded">Not in editor</span>
                    </label>
                    <textarea
                      value={lens.notes || ''}
                      onChange={(e) => handleUpdateLens(lens.id, { notes: e.target.value })}
                      placeholder="Add private notes, lore, or ideas here..."
                      className="w-full h-32 p-3 rounded-lg border border-stone-200 bg-stone-50 resize-none outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm text-stone-700"
                    />
                  </div>

                  {/* Linking */}
                  <div>
                    <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">Linked Lenses</label>
                    <div className="space-y-2">
                      {lens.linkedLensIds?.map(linkedId => {
                        const linkedLens = lenses.find(l => l.id === linkedId);
                        if (!linkedLens) return null;
                        return (
                          <div key={linkedId} className="flex items-center justify-between p-2 rounded-md border border-stone-200 bg-white text-sm">
                            <span className="truncate flex-1 mr-2 text-stone-600 font-medium">{linkedLens.content}</span>
                            <button 
                              onClick={() => handleUpdateLens(lens.id, { linkedLensIds: lens.linkedLensIds?.filter(id => id !== linkedId) })}
                              className="text-stone-400 hover:text-red-500 p-1"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        );
                      })}
                      
                      <div className="relative mt-2">
                        <select
                          className="w-full p-2 text-sm border border-stone-200 rounded-md bg-stone-50 text-stone-600 outline-none focus:border-emerald-500 appearance-none"
                          onChange={(e) => {
                            if (e.target.value) {
                              const newLinks = [...(lens.linkedLensIds || []), e.target.value];
                              handleUpdateLens(lens.id, { linkedLensIds: newLinks });
                              e.target.value = '';
                            }
                          }}
                          value=""
                        >
                          <option value="" disabled>+ Link another lens...</option>
                          {lenses.filter(l => l.id !== lens.id && !(lens.linkedLensIds || []).includes(l.id)).map(l => (
                            <option key={l.id} value={l.id}>{l.content.substring(0, 40)}...</option>
                          ))}
                        </select>
                        <Plus size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
                      </div>
                    </div>
                  </div>
                </div>
              </>
            );
          })()}
        </div>
      )}
    </div>
  );
}
