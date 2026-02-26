import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../store/StoreContext';
import { AlignLeft, Highlighter, Trash2, Maximize2, Minimize2, MoreVertical, Link as LinkIcon } from 'lucide-react';
import { cn } from '../lib/utils';

const LENS_COLORS = {
  red: 'bg-red-50 border-red-200 text-red-900',
  blue: 'bg-blue-50 border-blue-200 text-blue-900',
  green: 'bg-emerald-50 border-emerald-200 text-emerald-900',
  yellow: 'bg-amber-50 border-amber-200 text-amber-900',
  purple: 'bg-purple-50 border-purple-200 text-purple-900',
};

const AutoResizeTextarea = ({ value, onChange, className, placeholder }: any) => {
  const ref = useRef<HTMLTextAreaElement>(null);
  
  useEffect(() => {
    if (ref.current) {
      ref.current.style.height = 'auto';
      ref.current.style.height = `${ref.current.scrollHeight}px`;
    }
  }, [value]);

  return (
    <textarea
      ref={ref}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={cn("overflow-hidden resize-none", className)}
      rows={1}
    />
  );
};

export function EditorPanel() {
  const { state, dispatch } = useStore();
  const activeDocId = state.activeDocumentId;
  const activeWorkId = state.activeWorkId;

  const document = state.scenes.find(s => s.id === activeDocId) || state.chapters.find(c => c.id === activeDocId);
  const isScene = state.scenes.some(s => s.id === activeDocId);
  
  const blocks = state.blocks.filter(b => b.documentId === activeDocId).sort((a, b) => a.order - b.order);
  const characters = state.characters.filter(c => c.workId === activeWorkId).sort((a, b) => a.order - b.order);

  if (!document) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-stone-400 bg-white">
        <AlignLeft size={48} className="mb-4 opacity-20" />
        <p>Select a chapter or scene to start writing.</p>
      </div>
    );
  }

  const handleBlockChange = (id: string, content: string) => {
    dispatch({ type: 'UPDATE_BLOCK', payload: { id, content } });
  };

  const navigateToLens = (lensId: string) => {
    const lens = state.blocks.find(b => b.id === lensId);
    if (lens) {
      if (lens.documentId !== activeDocId) {
        dispatch({ type: 'SET_ACTIVE_DOCUMENT', payload: lens.documentId });
      }
      setTimeout(() => {
        const el = document.getElementById(`block-${lensId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.classList.add('ring-2', 'ring-emerald-500', 'ring-offset-2');
          setTimeout(() => el.classList.remove('ring-2', 'ring-emerald-500', 'ring-offset-2'), 2000);
        }
      }, 100);
    }
  };

  const handleAddBlock = (type: 'text' | 'lens', afterBlockId?: string) => {
    dispatch({ type: 'ADD_BLOCK', payload: { documentId: activeDocId, type, afterBlockId } });
  };

  const handleLensColorChange = (id: string, color: string) => {
    dispatch({ type: 'UPDATE_BLOCK', payload: { id, color } });
  };

  const handleRemoveLens = (id: string) => {
    dispatch({ type: 'REMOVE_LENS', payload: id });
  };

  const handleDeleteBlock = (id: string) => {
    dispatch({ type: 'DELETE_BLOCK', payload: id });
  };

  const toggleCharacter = (charId: string) => {
    if (isScene) {
      dispatch({ type: 'TOGGLE_SCENE_CHARACTER', payload: { sceneId: activeDocId, characterId: charId } });
    }
  };

  // Calculate chapter stats if it's a chapter
  let chapterCharacters: string[] = [];
  if (!isScene) {
    const chapterScenes = state.scenes.filter(s => s.chapterId === activeDocId);
    const charIds = new Set<string>();
    chapterScenes.forEach(s => s.characterIds.forEach(id => charIds.add(id)));
    chapterCharacters = Array.from(charIds);
  }

  return (
    <div className="flex-1 flex flex-col bg-white overflow-hidden relative">
      <div className="flex-1 overflow-y-auto px-8 py-12 lg:px-24 xl:px-48">
        <div className="max-w-3xl mx-auto">
          <input
            type="text"
            value={document.title}
            onChange={(e) => {
              if (isScene) {
                dispatch({ type: 'UPDATE_SCENE', payload: { id: activeDocId, title: e.target.value } });
              } else {
                dispatch({ type: 'UPDATE_CHAPTER', payload: { id: activeDocId, title: e.target.value } });
              }
            }}
            className="w-full text-4xl font-serif font-semibold text-stone-900 mb-4 outline-none placeholder:text-stone-300 bg-transparent"
            placeholder="Untitled..."
          />

          {/* Character Binding Area */}
          <div className="mb-12 flex flex-wrap gap-2 items-center">
            <span className="text-xs font-medium text-stone-400 uppercase tracking-wider mr-2">
              {isScene ? 'Characters in Scene:' : 'Characters in Chapter:'}
            </span>
            
            {characters.map(char => {
              const isActive = isScene 
                ? (document as any).characterIds.includes(char.id)
                : chapterCharacters.includes(char.id);
                
              return (
                <button
                  key={char.id}
                  onClick={() => toggleCharacter(char.id)}
                  disabled={!isScene}
                  className={cn(
                    "px-2.5 py-1 rounded-full text-xs font-medium transition-colors border",
                    isActive 
                      ? "bg-stone-800 text-stone-100 border-stone-800" 
                      : "bg-white text-stone-500 border-stone-200 hover:border-stone-300",
                    !isScene && "cursor-default opacity-80"
                  )}
                >
                  {char.name}
                </button>
              );
            })}
          </div>

          {/* Chapter Character Summary */}
          {!isScene && chapterCharacters.length > 0 && (
            <div className="mb-12 space-y-6">
              <h3 className="text-sm font-bold text-stone-400 uppercase tracking-wider border-b border-stone-100 pb-2">Character Appearances</h3>
              {chapterCharacters.map(charId => {
                const char = characters.find(c => c.id === charId);
                if (!char) return null;
                
                const scenesWithChar = state.scenes.filter(s => s.chapterId === activeDocId && s.characterIds.includes(charId)).sort((a, b) => a.order - b.order);
                
                return (
                  <div key={charId} className="bg-stone-50 rounded-lg p-4 border border-stone-100">
                    <div className="font-semibold text-stone-900 mb-3">{char.name} appears in:</div>
                    <div className="space-y-2 pl-2 border-l-2 border-emerald-200">
                      {scenesWithChar.map(scene => {
                        const sceneIndex = `${document.order + 1}-${scene.order + 1}`;
                        return (
                          <div key={scene.id} className="flex items-start space-x-3">
                            <span className="text-xs font-mono text-stone-500 bg-stone-200 px-1.5 py-0.5 rounded mt-0.5 shrink-0">{sceneIndex}</span>
                            <input
                              type="text"
                              value={scene.characterNotes?.[charId] || ''}
                              onChange={(e) => dispatch({ type: 'UPDATE_SCENE_CHARACTER_NOTE', payload: { sceneId: scene.id, characterId: charId, note: e.target.value } })}
                              placeholder={`Notes for ${char.name} in this scene...`}
                              className="flex-1 bg-transparent text-sm text-stone-700 outline-none border-b border-transparent focus:border-emerald-300 transition-colors"
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Blocks */}
          <div className="space-y-6">
            {blocks.map((block, index) => (
              <div key={block.id} id={`block-${block.id}`} className="group relative flex items-start -ml-12 pl-12 transition-all duration-500">
                {/* Block Content */}
                <div className={cn(
                  "flex-1 rounded-lg transition-all",
                  block.type === 'lens' ? cn("p-4 border-2", LENS_COLORS[block.color as keyof typeof LENS_COLORS] || LENS_COLORS.red) : ""
                )}>
                  {block.type === 'lens' && (
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex space-x-1">
                        {Object.keys(LENS_COLORS).map(color => (
                          <button
                            key={color}
                            onClick={() => handleLensColorChange(block.id, color)}
                            className={cn(
                              "w-4 h-4 rounded-full border border-black/10 transition-transform hover:scale-110",
                              color === 'red' && "bg-red-400",
                              color === 'blue' && "bg-blue-400",
                              color === 'green' && "bg-emerald-400",
                              color === 'yellow' && "bg-amber-400",
                              color === 'purple' && "bg-purple-400",
                              block.color === color && "ring-2 ring-offset-1 ring-stone-400"
                            )}
                          />
                        ))}
                      </div>
                      <div className="flex items-center space-x-2 text-black/40">
                        {block.linkedLensIds && block.linkedLensIds.length > 0 && (
                          <div className="flex items-center text-xs font-medium bg-black/5 px-2 py-0.5 rounded-full">
                            <LinkIcon size={10} className="mr-1" />
                            {block.linkedLensIds.length} Linked
                          </div>
                        )}
                        <button 
                          onClick={() => handleRemoveLens(block.id)}
                          className="p-1 hover:bg-black/5 rounded transition-colors"
                          title="Remove Lens (keep text)"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  )}
                  
                  <AutoResizeTextarea
                    value={block.content}
                    onChange={(e: any) => handleBlockChange(block.id, e.target.value)}
                    placeholder={block.type === 'lens' ? "Enter lens content..." : "Start writing..."}
                    className={cn(
                      "w-full outline-none bg-transparent",
                      block.type === 'lens' ? "text-sm font-medium leading-relaxed" : "text-lg leading-relaxed text-stone-800 font-serif"
                    )}
                  />
                  
                  {block.type === 'lens' && block.linkedLensIds && block.linkedLensIds.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-black/10 flex flex-wrap gap-2">
                      {block.linkedLensIds.map(linkedId => {
                        const linkedLens = state.blocks.find(b => b.id === linkedId);
                        if (!linkedLens) return null;
                        return (
                          <button
                            key={linkedId}
                            onClick={() => navigateToLens(linkedId)}
                            className="text-xs flex items-center bg-black/5 hover:bg-black/10 px-2 py-1 rounded transition-colors font-medium"
                          >
                            <LinkIcon size={10} className="mr-1 shrink-0" />
                            <span className="truncate max-w-[200px]">{linkedLens.content || 'Empty lens'}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Block Actions (Hover) */}
                <div className="absolute right-full top-0 mr-2 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col space-y-1">
                  <button 
                    onClick={() => handleAddBlock('text', block.id)}
                    className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-md"
                    title="Add Text Block Below"
                  >
                    <AlignLeft size={16} />
                  </button>
                  <button 
                    onClick={() => handleAddBlock('lens', block.id)}
                    className="p-1.5 text-stone-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-md"
                    title="Add Color Lens Below"
                  >
                    <Highlighter size={16} />
                  </button>
                  <button 
                    onClick={() => handleDeleteBlock(block.id)}
                    className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-md"
                    title="Delete Block"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}

            {blocks.length === 0 && (
              <div className="flex space-x-4 mt-8">
                <button 
                  onClick={() => handleAddBlock('text')}
                  className="flex items-center px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-md transition-colors text-sm font-medium"
                >
                  <AlignLeft size={16} className="mr-2" />
                  Add Text
                </button>
                <button 
                  onClick={() => handleAddBlock('lens')}
                  className="flex items-center px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-md transition-colors text-sm font-medium"
                >
                  <Highlighter size={16} className="mr-2" />
                  Add Color Lens
                </button>
              </div>
            )}
          </div>
          
          <div className="h-64" /> {/* Bottom padding */}
        </div>
      </div>
    </div>
  );
}
