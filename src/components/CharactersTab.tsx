import React, { useState } from 'react';
import { useStore } from '../store/StoreContext';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Users, Plus, GripVertical, User, MapPin, ChevronLeft } from 'lucide-react';
import { cn } from '../lib/utils';

export function CharactersTab() {
  const { state, dispatch } = useStore();
  const activeWorkId = state.activeWorkId;
  const [activeCharId, setActiveCharId] = useState<string | null>(null);

  if (!activeWorkId) return <div className="flex-1 flex items-center justify-center text-stone-400">Select a work</div>;

  const characters = state.characters.filter(c => c.workId === activeWorkId).sort((a, b) => a.order - b.order);
  const activeChar = characters.find(c => c.id === activeCharId);

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const { source, destination } = result;
    dispatch({
      type: 'REORDER_CHARACTERS',
      payload: { workId: activeWorkId, startIndex: source.index, endIndex: destination.index }
    });
  };

  const handleAddCharacter = () => {
    const name = prompt('Character name:');
    if (name) dispatch({ type: 'ADD_CHARACTER', payload: { workId: activeWorkId, name } });
  };

  const handleUpdateCharacter = (id: string, updates: any) => {
    dispatch({ type: 'UPDATE_CHARACTER', payload: { id, ...updates } });
  };

  // Calculate appearances
  const getAppearances = (charId: string) => {
    const appearances: { chapterTitle: string; sceneTitle: string; sceneId: string; note: string; sceneIndexStr: string }[] = [];
    state.scenes.forEach(scene => {
      if (scene.characterIds.includes(charId)) {
        const chapter = state.chapters.find(c => c.id === scene.chapterId);
        if (chapter && chapter.workId === activeWorkId) {
          appearances.push({
            chapterTitle: chapter.title,
            sceneTitle: scene.title,
            sceneId: scene.id,
            note: scene.characterNotes?.[charId] || '',
            sceneIndexStr: `${chapter.order + 1}-${scene.order + 1}`
          });
        }
      }
    });
    return appearances;
  };

  return (
    <div className="flex-1 flex overflow-hidden bg-white">
      {/* Sidebar List */}
      <div className={cn(
        "border-r border-stone-200 bg-stone-50/50 flex flex-col h-full transition-all duration-300",
        activeChar ? "hidden md:flex w-72" : "w-full md:w-72"
      )}>
        <div className="p-4 border-b border-stone-200 flex items-center justify-between">
          <h3 className="font-semibold text-stone-900 flex items-center text-sm uppercase tracking-wider">
            <Users size={16} className="mr-2 text-stone-400" />
            Characters
          </h3>
          <button 
            onClick={handleAddCharacter}
            className="p-1.5 hover:bg-stone-200 rounded-md text-stone-500 transition-colors"
          >
            <Plus size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="characters" type="character">
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-1">
                  {characters.map((char, index) => {
                    return (
                      // @ts-expect-error React 19 key prop issue
                      <Draggable key={char.id} draggableId={char.id} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={cn(
                            "group flex items-center p-2 rounded-md text-sm transition-colors cursor-pointer",
                            snapshot.isDragging ? "bg-white shadow-md" : "hover:bg-stone-100",
                            activeChar?.id === char.id ? "bg-emerald-50 text-emerald-900 font-medium" : "text-stone-700"
                          )}
                          onClick={() => setActiveCharId(char.id)}
                        >
                          <div {...provided.dragHandleProps} className="mr-2 text-stone-400 opacity-0 group-hover:opacity-100 cursor-grab">
                            <GripVertical size={14} />
                          </div>
                          <User size={14} className="mr-2 text-stone-400" />
                          <span className="flex-1 truncate">{char.name}</span>
                        </div>
                      )}
                    </Draggable>
                  );
                })}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </div>
      </div>

      {/* Detail View */}
      {activeChar ? (
        <div className="flex-1 overflow-y-auto p-4 lg:p-12 xl:p-24 bg-white pb-24 md:pb-12">
          <div className="max-w-3xl mx-auto space-y-8 md:space-y-12">
            {/* Header */}
            <div>
              <button 
                className="md:hidden mb-4 flex items-center text-stone-500 hover:text-stone-900"
                onClick={() => setActiveCharId(null)}
              >
                <ChevronLeft size={20} className="mr-1" />
                Back to List
              </button>
              <input
                type="text"
                value={activeChar.name}
                onChange={(e) => handleUpdateCharacter(activeChar.id, { name: e.target.value })}
                className="w-full text-4xl font-serif font-semibold text-stone-900 mb-2 outline-none placeholder:text-stone-300 bg-transparent"
                placeholder="Character Name..."
              />
              <div className="h-1 w-12 bg-emerald-500 rounded-full" />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-4">Background & Description</label>
              <textarea
                value={activeChar.description}
                onChange={(e) => handleUpdateCharacter(activeChar.id, { description: e.target.value })}
                placeholder="Enter character background, personality, physical traits..."
                className="w-full h-64 p-4 rounded-xl border border-stone-200 bg-stone-50 resize-none outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-stone-700 leading-relaxed transition-all"
              />
            </div>

            {/* Appearances */}
            <div>
              <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-4 flex items-center">
                <MapPin size={14} className="mr-2" />
                Appearances Tracker
              </label>
              
              <div className="bg-stone-50 border border-stone-200 rounded-xl overflow-hidden">
                {(() => {
                  const appearances = getAppearances(activeChar.id);
                  if (appearances.length === 0) {
                    return (
                      <div className="p-8 text-center text-stone-500 text-sm">
                        This character hasn't appeared in any scenes yet.
                        <br />
                        <span className="opacity-70">Bind them to a scene in the Writing tab.</span>
                      </div>
                    );
                  }

                  return (
                    <div className="divide-y divide-stone-200">
                      {appearances.map((app, i) => (
                        <div key={i} className="p-4 flex items-start justify-between hover:bg-stone-100/50 transition-colors">
                          <div className="flex-1 pr-4">
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="text-xs font-mono text-stone-500 bg-stone-200 px-1.5 py-0.5 rounded">{app.sceneIndexStr}</span>
                              <span className="text-sm font-medium text-stone-900">{app.sceneTitle}</span>
                            </div>
                            <div className="text-xs text-stone-500 mb-2">{app.chapterTitle}</div>
                            <input
                              type="text"
                              value={app.note}
                              onChange={(e) => dispatch({ type: 'UPDATE_SCENE_CHARACTER_NOTE', payload: { sceneId: app.sceneId, characterId: activeChar.id, note: e.target.value } })}
                              placeholder="Add notes for this appearance..."
                              className="w-full text-sm text-stone-700 bg-white p-2 rounded border border-stone-200 outline-none focus:border-emerald-500 transition-colors"
                            />
                          </div>
                          <button 
                            onClick={() => {
                              dispatch({ type: 'SET_ACTIVE_TAB', payload: 'writing' });
                              dispatch({ type: 'SET_ACTIVE_DOCUMENT', payload: app.sceneId });
                            }}
                            className="px-3 py-1.5 bg-white border border-stone-200 hover:border-emerald-500 hover:text-emerald-700 rounded-md text-xs font-medium text-stone-600 transition-colors shadow-sm shrink-0 mt-1"
                          >
                            Go to Scene
                          </button>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="hidden md:flex flex-1 flex-col items-center justify-center text-stone-400">
          <Users size={48} className="mb-4 opacity-20" />
          <p>Select or create a character to view details.</p>
        </div>
      )}
    </div>
  );
}
