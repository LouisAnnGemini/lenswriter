import React, { useState } from 'react';
import { useStore } from '../store/StoreContext';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { FileText, Folder, GripVertical, Plus, Trash2 } from 'lucide-react';
import { cn } from '../lib/utils';

export function OutlinePanel() {
  const { state, dispatch } = useStore();
  const [viewMode, setViewMode] = useState<'outline' | 'default' | 'scenes'>('default');

  if (state.focusMode) return null;

  const activeWorkId = state.activeWorkId;
  if (!activeWorkId) return <div className="w-64 border-r border-stone-200 bg-stone-50 p-4 text-stone-500 text-sm">Select a work</div>;

  const chapters = state.chapters.filter(c => c.workId === activeWorkId).sort((a, b) => a.order - b.order);
  const scenes = state.scenes.filter(s => chapters.some(c => c.id === s.chapterId));

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const { source, destination, type } = result;

    if (type === 'chapter' && viewMode === 'outline') {
      dispatch({
        type: 'REORDER_CHAPTERS',
        payload: { workId: activeWorkId, startIndex: source.index, endIndex: destination.index }
      });
    } else if (type === 'scene' && viewMode === 'scenes') {
      const sourceChapterId = source.droppableId.replace('chapter-', '');
      const destChapterId = destination.droppableId.replace('chapter-', '');
      
      const sourceScene = scenes.filter(s => s.chapterId === sourceChapterId).sort((a, b) => a.order - b.order)[source.index];
      if (!sourceScene) return;

      if (sourceChapterId === destChapterId) {
        dispatch({
          type: 'REORDER_SCENES',
          payload: { chapterId: sourceChapterId, startIndex: source.index, endIndex: destination.index }
        });
      } else {
        dispatch({
          type: 'MOVE_SCENE',
          payload: { sceneId: sourceScene.id, newChapterId: destChapterId, newIndex: destination.index }
        });
      }
    }
  };

  const addChapter = () => {
    dispatch({ type: 'ADD_CHAPTER', payload: { workId: activeWorkId, title: 'New Chapter' } });
  };

  const addScene = (chapterId: string) => {
    dispatch({ type: 'ADD_SCENE', payload: { chapterId, title: 'New Scene' } });
  };

  return (
    <div className="w-72 border-r border-stone-200 bg-stone-50/50 flex flex-col h-full">
      <div className="p-4 border-b border-stone-200">
        <div className="flex bg-stone-200/50 p-1 rounded-lg">
          {(['outline', 'default', 'scenes'] as const).map(mode => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={cn(
                "flex-1 text-xs py-1.5 rounded-md font-medium capitalize transition-all",
                viewMode === mode ? "bg-white text-stone-900 shadow-sm" : "text-stone-500 hover:text-stone-700"
              )}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        <DragDropContext onDragEnd={handleDragEnd}>
          {viewMode === 'outline' && (
            <Droppable droppableId="chapters" type="chapter">
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-1">
                  {chapters.map((chapter, index) => {
                    return (
                      // @ts-expect-error React 19 key prop issue
                      <Draggable key={chapter.id} draggableId={chapter.id} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={cn(
                            "group flex items-center p-2 rounded-md text-sm transition-colors",
                            snapshot.isDragging ? "bg-white shadow-md" : "hover:bg-stone-100",
                            state.activeDocumentId === chapter.id ? "bg-emerald-50 text-emerald-900" : "text-stone-700"
                          )}
                        >
                          <div {...provided.dragHandleProps} className="mr-2 text-stone-400 opacity-0 group-hover:opacity-100 cursor-grab">
                            <GripVertical size={14} />
                          </div>
                          <Folder size={14} className="mr-2 text-stone-400" />
                          <span 
                            className="flex-1 truncate cursor-pointer"
                            onClick={() => dispatch({ type: 'SET_ACTIVE_DOCUMENT', payload: chapter.id })}
                          >
                            {chapter.title}
                          </span>
                          <button
                            onClick={(e) => { e.stopPropagation(); if(confirm('Delete chapter and all its scenes?')) dispatch({ type: 'DELETE_CHAPTER', payload: chapter.id }); }}
                            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 hover:text-red-600 rounded text-stone-400 transition-all"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      )}
                    </Draggable>
                  );
                })}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          )}

          {viewMode === 'default' && (
            <div className="space-y-4">
              {chapters.map(chapter => (
                <div key={chapter.id} className="space-y-1">
                  <div 
                    className={cn(
                      "flex items-center justify-between p-2 rounded-md text-sm font-medium group cursor-pointer",
                      state.activeDocumentId === chapter.id ? "bg-emerald-50 text-emerald-900" : "text-stone-900 hover:bg-stone-100"
                    )}
                    onClick={() => dispatch({ type: 'SET_ACTIVE_DOCUMENT', payload: chapter.id })}
                  >
                    <div className="flex items-center">
                      <Folder size={14} className="mr-2 text-stone-400" />
                      <span className="truncate">{chapter.title}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <button 
                        onClick={(e) => { e.stopPropagation(); addScene(chapter.id); }}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-stone-200 rounded text-stone-50"
                      >
                        <Plus size={14} className="text-stone-500" />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); if(confirm('Delete chapter and all its scenes?')) dispatch({ type: 'DELETE_CHAPTER', payload: chapter.id }); }}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 hover:text-red-600 rounded text-stone-400 transition-all"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  <div className="pl-6 space-y-1 border-l border-stone-200 ml-3">
                    {scenes.filter(s => s.chapterId === chapter.id).sort((a, b) => a.order - b.order).map(scene => (
                      <div
                        key={scene.id}
                        onClick={() => dispatch({ type: 'SET_ACTIVE_DOCUMENT', payload: scene.id })}
                        className={cn(
                          "flex items-center justify-between p-1.5 rounded-md text-sm cursor-pointer transition-colors group/scene",
                          state.activeDocumentId === scene.id ? "bg-emerald-50 text-emerald-900 font-medium" : "text-stone-600 hover:bg-stone-100"
                        )}
                      >
                        <div className="flex items-center truncate">
                          <FileText size={12} className="mr-2 text-stone-400" />
                          <span className="truncate">{scene.title}</span>
                        </div>
                        <button 
                          onClick={(e) => { e.stopPropagation(); if(confirm('Delete this scene?')) dispatch({ type: 'DELETE_SCENE', payload: scene.id }); }}
                          className="opacity-0 group-hover/scene:opacity-100 p-1 hover:bg-red-100 hover:text-red-600 rounded text-stone-400 transition-all"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {viewMode === 'scenes' && (
            <div className="space-y-4">
              {chapters.map((chapter, chapIndex) => (
                <div key={chapter.id}>
                  {chapIndex > 0 && (
                    <div className="flex items-center my-3">
                      <div className="flex-1 h-px bg-stone-200"></div>
                      <div className="mx-2 text-[10px] font-bold text-stone-300 uppercase tracking-widest">{chapter.title}</div>
                      <div className="flex-1 h-px bg-stone-200"></div>
                    </div>
                  )}
                  {chapIndex === 0 && (
                    <div className="text-[10px] font-bold text-stone-300 uppercase tracking-widest mb-2 px-2 text-center">{chapter.title}</div>
                  )}
                  <Droppable droppableId={`chapter-${chapter.id}`} type="scene">
                    {(provided, snapshot) => (
                      <div 
                        {...provided.droppableProps} 
                        ref={provided.innerRef} 
                        className={cn(
                          "space-y-1 min-h-[24px] rounded-lg transition-colors",
                          snapshot.isDraggingOver ? "bg-stone-100/80 ring-1 ring-stone-200" : ""
                        )}
                      >
                        {scenes.filter(s => s.chapterId === chapter.id).sort((a, b) => a.order - b.order).map((scene, index) => {
                          const chapIndexNum = chapter.order + 1;
                          const sceneIndexNum = scene.order + 1;
                          
                          return (
                            // @ts-expect-error React 19 key prop issue
                            <Draggable key={scene.id} draggableId={scene.id} index={index}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  className={cn(
                                    "group flex items-center p-2 rounded-md text-sm transition-colors",
                                    snapshot.isDragging ? "bg-white shadow-md ring-1 ring-stone-200" : "hover:bg-stone-100",
                                    state.activeDocumentId === scene.id ? "bg-emerald-50 text-emerald-900" : "text-stone-700"
                                  )}
                                >
                                  <div {...provided.dragHandleProps} className="mr-2 text-stone-400 opacity-0 group-hover:opacity-100 cursor-grab">
                                    <GripVertical size={14} />
                                  </div>
                                  <span className="text-xs font-mono text-stone-400 mr-2 bg-stone-200 px-1.5 py-0.5 rounded">
                                    {chapIndexNum}-{sceneIndexNum}
                                  </span>
                                  <span 
                                    className="flex-1 truncate cursor-pointer"
                                    onClick={() => dispatch({ type: 'SET_ACTIVE_DOCUMENT', payload: scene.id })}
                                  >
                                    {scene.title}
                                  </span>
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); if(confirm('Delete this scene?')) dispatch({ type: 'DELETE_SCENE', payload: scene.id }); }}
                                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 hover:text-red-600 rounded text-stone-400 transition-all"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                              )}
                            </Draggable>
                          )
                        })}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>
              ))}
            </div>
          )}
        </DragDropContext>
      </div>
      
      <div className="p-3 border-t border-stone-200">
        <button 
          onClick={addChapter}
          className="w-full flex items-center justify-center py-2 text-sm text-stone-600 hover:text-stone-900 hover:bg-stone-200/50 rounded-md transition-colors border border-dashed border-stone-300"
        >
          <Plus size={16} className="mr-2" />
          Add Chapter
        </button>
      </div>
    </div>
  );
}
