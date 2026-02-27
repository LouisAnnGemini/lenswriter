import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';

export type Work = { id: string; title: string; createdAt: number; order: number };
export type Character = { id: string; workId: string; name: string; description: string; order: number };
export type Chapter = { id: string; workId: string; title: string; order: number };
export type Scene = { id: string; chapterId: string; title: string; order: number; characterIds: string[]; characterNotes?: Record<string, string> };
export type Block = { id: string; documentId: string; type: 'text' | 'lens'; content: string; color?: string; order: number; notes?: string; linkedLensIds?: string[] };

export type StoreState = {
  works: Work[];
  characters: Character[];
  chapters: Chapter[];
  scenes: Scene[];
  blocks: Block[];
  activeWorkId: string | null;
  activeDocumentId: string | null;
  activeTab: 'writing' | 'lenses' | 'characters';
  focusMode: boolean;
};

type Action =
  | { type: 'ADD_WORK'; payload: { title: string } }
  | { type: 'UPDATE_WORK'; payload: { id: string; title: string } }
  | { type: 'DELETE_WORK'; payload: string }
  | { type: 'REORDER_WORKS'; payload: { startIndex: number; endIndex: number } }
  | { type: 'SET_ACTIVE_WORK'; payload: string }
  | { type: 'SET_ACTIVE_DOCUMENT'; payload: string | null }
  | { type: 'SET_ACTIVE_TAB'; payload: 'writing' | 'lenses' | 'characters' }
  | { type: 'TOGGLE_FOCUS_MODE' }
  | { type: 'ADD_CHAPTER'; payload: { workId: string; title: string } }
  | { type: 'UPDATE_CHAPTER'; payload: { id: string; title: string } }
  | { type: 'REORDER_CHAPTERS'; payload: { workId: string; startIndex: number; endIndex: number } }
  | { type: 'ADD_SCENE'; payload: { chapterId: string; title: string } }
  | { type: 'UPDATE_SCENE'; payload: { id: string; title: string } }
  | { type: 'REORDER_SCENES'; payload: { chapterId: string; startIndex: number; endIndex: number } }
  | { type: 'MOVE_SCENE'; payload: { sceneId: string; newChapterId: string; newIndex: number } }
  | { type: 'TOGGLE_SCENE_CHARACTER'; payload: { sceneId: string; characterId: string } }
  | { type: 'UPDATE_SCENE_CHARACTER_NOTE'; payload: { sceneId: string; characterId: string; note: string } }
  | { type: 'ADD_BLOCK'; payload: { documentId: string; type: 'text' | 'lens'; afterBlockId?: string } }
  | { type: 'UPDATE_BLOCK'; payload: { id: string; content?: string; color?: string; notes?: string; linkedLensIds?: string[] } }
  | { type: 'REMOVE_LENS'; payload: string }
  | { type: 'DELETE_BLOCK'; payload: string }
  | { type: 'ADD_CHARACTER'; payload: { workId: string; name: string } }
  | { type: 'UPDATE_CHARACTER'; payload: { id: string; name?: string; description?: string } }
  | { type: 'REORDER_CHARACTERS'; payload: { workId: string; startIndex: number; endIndex: number } }
  | { type: 'DELETE_CHAPTER'; payload: string }
  | { type: 'DELETE_SCENE'; payload: string }
  | { type: 'IMPORT_DATA'; payload: StoreState };

const initialWorkId = uuidv4();
const initialChapterId = uuidv4();
const initialSceneId = uuidv4();
const initialCharId = uuidv4();
const initialBlockId1 = uuidv4();
const initialBlockId2 = uuidv4();

const initialState: StoreState = {
  works: [{ id: initialWorkId, title: 'The Silent Echo', createdAt: Date.now(), order: 0 }],
  characters: [
    { id: initialCharId, workId: initialWorkId, name: 'Elias Thorne', description: 'A detective with a troubled past.', order: 0 },
    { id: uuidv4(), workId: initialWorkId, name: 'Sarah Vance', description: 'An investigative journalist.', order: 1 }
  ],
  chapters: [
    { id: initialChapterId, workId: initialWorkId, title: 'Chapter 1: The Awakening', order: 0 },
    { id: uuidv4(), workId: initialWorkId, title: 'Chapter 2: Shadows', order: 1 }
  ],
  scenes: [
    { id: initialSceneId, chapterId: initialChapterId, title: 'Scene 1: The Crime Scene', order: 0, characterIds: [initialCharId] },
    { id: uuidv4(), chapterId: initialChapterId, title: 'Scene 2: Interrogation', order: 1, characterIds: [] }
  ],
  blocks: [
    { id: initialBlockId1, documentId: initialSceneId, type: 'text', content: 'The rain poured relentlessly over the neon-lit streets of Neo-Veridia. Elias stood over the body, his coat heavy with water.', order: 0 },
    { id: initialBlockId2, documentId: initialSceneId, type: 'lens', content: 'The victim held a small, silver locket tightly in their left hand. It bore the insignia of the old regime.', color: 'red', order: 1, notes: 'Crucial evidence. Connects to the mayor.', linkedLensIds: [] },
    { id: uuidv4(), documentId: initialSceneId, type: 'text', content: 'He sighed, knowing this case would be unlike any other.', order: 2 }
  ],
  activeWorkId: initialWorkId,
  activeDocumentId: initialSceneId,
  activeTab: 'writing',
  focusMode: false,
};

function storeReducer(state: StoreState, action: Action): StoreState {
  switch (action.type) {
    case 'ADD_WORK': {
      const newWork: Work = { id: uuidv4(), title: action.payload.title, createdAt: Date.now(), order: state.works.length };
      return { ...state, works: [...state.works, newWork], activeWorkId: newWork.id, activeDocumentId: null };
    }
    case 'UPDATE_WORK': {
      return {
        ...state,
        works: state.works.map(w => w.id === action.payload.id ? { ...w, title: action.payload.title } : w)
      };
    }
    case 'DELETE_WORK': {
      const workId = action.payload;
      const chaptersToDelete = state.chapters.filter(c => c.workId === workId).map(c => c.id);
      const scenesToDelete = state.scenes.filter(s => chaptersToDelete.includes(s.chapterId)).map(s => s.id);
      const docsToDelete = [...chaptersToDelete, ...scenesToDelete];

      return {
        ...state,
        works: state.works.filter(w => w.id !== workId),
        chapters: state.chapters.filter(c => c.workId !== workId),
        scenes: state.scenes.filter(s => !chaptersToDelete.includes(s.chapterId)),
        characters: state.characters.filter(c => c.workId !== workId),
        blocks: state.blocks.filter(b => !docsToDelete.includes(b.documentId)),
        activeWorkId: state.activeWorkId === workId ? null : state.activeWorkId,
        activeDocumentId: docsToDelete.includes(state.activeDocumentId!) ? null : state.activeDocumentId
      };
    }
    case 'REORDER_WORKS': {
      const { startIndex, endIndex } = action.payload;
      const works = [...state.works].sort((a, b) => a.order - b.order);
      const [removed] = works.splice(startIndex, 1);
      works.splice(endIndex, 0, removed);
      const updatedWorks = works.map((w, i) => ({ ...w, order: i }));
      return {
        ...state,
        works: updatedWorks
      };
    }
    case 'SET_ACTIVE_WORK':
      return { ...state, activeWorkId: action.payload, activeDocumentId: null };
    case 'SET_ACTIVE_DOCUMENT':
      return { ...state, activeDocumentId: action.payload };
    case 'SET_ACTIVE_TAB':
      return { ...state, activeTab: action.payload };
    case 'TOGGLE_FOCUS_MODE':
      return { ...state, focusMode: !state.focusMode };
    case 'ADD_CHAPTER': {
      const chapters = state.chapters.filter(c => c.workId === action.payload.workId);
      const newChapter: Chapter = { id: uuidv4(), workId: action.payload.workId, title: action.payload.title, order: chapters.length };
      return { ...state, chapters: [...state.chapters, newChapter], activeDocumentId: newChapter.id };
    }
    case 'UPDATE_CHAPTER':
      return { ...state, chapters: state.chapters.map(c => c.id === action.payload.id ? { ...c, title: action.payload.title } : c) };
    case 'DELETE_CHAPTER': {
      const chapterId = action.payload;
      const scenesToDelete = state.scenes.filter(s => s.chapterId === chapterId).map(s => s.id);
      const docsToDelete = [chapterId, ...scenesToDelete];
      
      return {
        ...state,
        chapters: state.chapters.filter(c => c.id !== chapterId),
        scenes: state.scenes.filter(s => s.chapterId !== chapterId),
        blocks: state.blocks.filter(b => !docsToDelete.includes(b.documentId)),
        activeDocumentId: state.activeDocumentId === chapterId || scenesToDelete.includes(state.activeDocumentId!) ? null : state.activeDocumentId
      };
    }
    case 'REORDER_CHAPTERS': {
      const { workId, startIndex, endIndex } = action.payload;
      const workChapters = state.chapters.filter(c => c.workId === workId).sort((a, b) => a.order - b.order);
      const [removed] = workChapters.splice(startIndex, 1);
      workChapters.splice(endIndex, 0, removed);
      const updatedChapters = workChapters.map((c, i) => ({ ...c, order: i }));
      return {
        ...state,
        chapters: state.chapters.map(c => c.workId === workId ? updatedChapters.find(uc => uc.id === c.id)! : c)
      };
    }
    case 'ADD_SCENE': {
      const scenes = state.scenes.filter(s => s.chapterId === action.payload.chapterId);
      const newScene: Scene = { id: uuidv4(), chapterId: action.payload.chapterId, title: action.payload.title, order: scenes.length, characterIds: [] };
      return { ...state, scenes: [...state.scenes, newScene], activeDocumentId: newScene.id };
    }
    case 'UPDATE_SCENE':
      return { ...state, scenes: state.scenes.map(s => s.id === action.payload.id ? { ...s, title: action.payload.title } : s) };
    case 'DELETE_SCENE': {
      const sceneId = action.payload;
      return {
        ...state,
        scenes: state.scenes.filter(s => s.id !== sceneId),
        blocks: state.blocks.filter(b => b.documentId !== sceneId),
        activeDocumentId: state.activeDocumentId === sceneId ? null : state.activeDocumentId
      };
    }
    case 'REORDER_SCENES': {
      const { chapterId, startIndex, endIndex } = action.payload;
      const chapterScenes = state.scenes.filter(s => s.chapterId === chapterId).sort((a, b) => a.order - b.order);
      const [removed] = chapterScenes.splice(startIndex, 1);
      chapterScenes.splice(endIndex, 0, removed);
      const updatedScenes = chapterScenes.map((s, i) => ({ ...s, order: i }));
      return {
        ...state,
        scenes: state.scenes.map(s => s.chapterId === chapterId ? updatedScenes.find(us => us.id === s.id)! : s)
      };
    }
    case 'MOVE_SCENE': {
      const { sceneId, newChapterId, newIndex } = action.payload;
      const scene = state.scenes.find(s => s.id === sceneId);
      if (!scene) return state;
      
      const oldChapterId = scene.chapterId;
      let newScenes = [...state.scenes];
      
      // Remove from old chapter and reorder
      const oldChapterScenes = newScenes.filter(s => s.chapterId === oldChapterId && s.id !== sceneId).sort((a, b) => a.order - b.order);
      oldChapterScenes.forEach((s, i) => s.order = i);
      
      // Add to new chapter and reorder
      const newChapterScenes = newScenes.filter(s => s.chapterId === newChapterId && s.id !== sceneId).sort((a, b) => a.order - b.order);
      const updatedScene = { ...scene, chapterId: newChapterId };
      newChapterScenes.splice(newIndex, 0, updatedScene);
      newChapterScenes.forEach((s, i) => s.order = i);
      
      return {
        ...state,
        scenes: newScenes.map(s => {
          if (s.id === sceneId) return updatedScene;
          if (s.chapterId === oldChapterId) return oldChapterScenes.find(os => os.id === s.id) || s;
          if (s.chapterId === newChapterId) return newChapterScenes.find(ns => ns.id === s.id) || s;
          return s;
        })
      };
    }
    case 'TOGGLE_SCENE_CHARACTER': {
      return {
        ...state,
        scenes: state.scenes.map(s => {
          if (s.id === action.payload.sceneId) {
            const hasChar = s.characterIds.includes(action.payload.characterId);
            return {
              ...s,
              characterIds: hasChar 
                ? s.characterIds.filter(id => id !== action.payload.characterId)
                : [...s.characterIds, action.payload.characterId]
            };
          }
          return s;
        })
      };
    }
    case 'UPDATE_SCENE_CHARACTER_NOTE': {
      return {
        ...state,
        scenes: state.scenes.map(s => {
          if (s.id === action.payload.sceneId) {
            return {
              ...s,
              characterNotes: {
                ...(s.characterNotes || {}),
                [action.payload.characterId]: action.payload.note
              }
            };
          }
          return s;
        })
      };
    }
    case 'ADD_BLOCK': {
      const { documentId, type, afterBlockId } = action.payload;
      const docBlocks = state.blocks.filter(b => b.documentId === documentId).sort((a, b) => a.order - b.order);
      const newBlock: Block = {
        id: uuidv4(),
        documentId,
        type,
        content: '',
        color: type === 'lens' ? 'red' : undefined,
        order: 0
      };
      
      if (afterBlockId) {
        const index = docBlocks.findIndex(b => b.id === afterBlockId);
        docBlocks.splice(index + 1, 0, newBlock);
      } else {
        docBlocks.push(newBlock);
      }
      
      const updatedBlocks = docBlocks.map((b, i) => ({ ...b, order: i }));
      
      return {
        ...state,
        blocks: [
          ...state.blocks.filter(b => b.documentId !== documentId),
          ...updatedBlocks
        ]
      };
    }
    case 'UPDATE_BLOCK': {
      return {
        ...state,
        blocks: state.blocks.map(b => b.id === action.payload.id ? { ...b, ...action.payload } : b)
      };
    }
    case 'REMOVE_LENS': {
      return {
        ...state,
        blocks: state.blocks.map(b => {
          if (b.id === action.payload) {
            return { ...b, type: 'text', color: undefined, notes: undefined, linkedLensIds: undefined };
          }
          if (b.linkedLensIds?.includes(action.payload)) {
            return { ...b, linkedLensIds: b.linkedLensIds.filter(id => id !== action.payload) };
          }
          return b;
        })
      };
    }
    case 'DELETE_BLOCK': {
      const blockToDelete = state.blocks.find(b => b.id === action.payload);
      if (!blockToDelete) return state;
      
      const docBlocks = state.blocks.filter(b => b.documentId === blockToDelete.documentId && b.id !== action.payload).sort((a, b) => a.order - b.order);
      const updatedBlocks = docBlocks.map((b, i) => ({ ...b, order: i }));
      
      return {
        ...state,
        blocks: [
          ...state.blocks.filter(b => b.documentId !== blockToDelete.documentId).map(b => {
            if (b.linkedLensIds?.includes(action.payload)) {
              return { ...b, linkedLensIds: b.linkedLensIds.filter(id => id !== action.payload) };
            }
            return b;
          }),
          ...updatedBlocks.map(b => {
            if (b.linkedLensIds?.includes(action.payload)) {
              return { ...b, linkedLensIds: b.linkedLensIds.filter(id => id !== action.payload) };
            }
            return b;
          })
        ]
      };
    }
    case 'ADD_CHARACTER': {
      const chars = state.characters.filter(c => c.workId === action.payload.workId);
      const newChar: Character = { id: uuidv4(), workId: action.payload.workId, name: action.payload.name, description: '', order: chars.length };
      return { ...state, characters: [...state.characters, newChar] };
    }
    case 'UPDATE_CHARACTER': {
      return {
        ...state,
        characters: state.characters.map(c => c.id === action.payload.id ? { ...c, ...action.payload } : c)
      };
    }
    case 'REORDER_CHARACTERS': {
      const { workId, startIndex, endIndex } = action.payload;
      const workChars = state.characters.filter(c => c.workId === workId).sort((a, b) => a.order - b.order);
      const [removed] = workChars.splice(startIndex, 1);
      workChars.splice(endIndex, 0, removed);
      const updatedChars = workChars.map((c, i) => ({ ...c, order: i }));
      return {
        ...state,
        characters: state.characters.map(c => c.workId === workId ? updatedChars.find(uc => uc.id === c.id)! : c)
      };
    }
    case 'IMPORT_DATA': {
      return action.payload;
    }
    default:
      return state;
  }
}

const StoreContext = createContext<{ state: StoreState; dispatch: React.Dispatch<Action> } | undefined>(undefined);

export const StoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(storeReducer, initialState);
  return <StoreContext.Provider value={{ state, dispatch }}>{children}</StoreContext.Provider>;
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) throw new Error('useStore must be used within a StoreProvider');
  return context;
};
