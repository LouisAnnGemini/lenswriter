import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useStore } from '../store/StoreContext';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Node,
  Edge,
  Connection,
  Handle,
  Position,
  NodeProps,
  EdgeProps,
  BaseEdge,
  getBezierPath,
  EdgeLabelRenderer,
  ConnectionMode,
  useInternalNode,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Plus, Trash2, Book, MousePointer2, Link2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { WorkIcon } from './WorkIcon';

// Custom Node for Work
const WorkNode = ({ data, id }: NodeProps) => {
  const { state, dispatch } = useStore();
  const work = state.works.find(w => w.id === data.workId);

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    dispatch({
      type: 'UPDATE_WHITEBOARD_NODE',
      payload: { id, description: e.target.value }
    });
  };

  const handleDelete = () => {
    dispatch({ type: 'DELETE_WHITEBOARD_NODE', payload: id });
  };

  const handleJumpToWork = () => {
    dispatch({ type: 'SET_ACTIVE_WORK', payload: data.workId });
    dispatch({ type: 'SET_ACTIVE_TAB', payload: 'writing' });
  };

  if (!work) return null;

  const mode = data.mode || 'move';

  return (
    <div className={cn(
      "bg-white rounded-xl shadow-lg border border-stone-200 w-64 overflow-hidden group relative transition-all",
      mode === 'connect' && "ring-2 ring-emerald-500/50 cursor-crosshair"
    )}>
      <Handle 
        type="target" 
        position={Position.Top} 
        className={cn(
          "bg-emerald-500 transition-all",
          mode === 'connect' ? "opacity-0 z-30 rounded-none border-none cursor-crosshair" : "w-3 h-3"
        )}
        style={mode === 'connect' ? { top: 0, left: 0, transform: 'none', width: '100%', height: '50%' } : undefined}
      />
      
      <div className={cn("relative z-20", mode === 'connect' && "pointer-events-none")}>
        <div className="bg-stone-50 p-3 border-b border-stone-200 flex items-center justify-between">
          <button 
            onClick={handleJumpToWork}
            className="flex items-center font-serif font-semibold text-stone-800 hover:text-emerald-600 transition-colors text-left flex-1 min-w-0"
            title="Go to Work"
          >
            <WorkIcon icon={work.icon} size={16} className="mr-2 shrink-0" />
            <span className="truncate">{work.title}</span>
          </button>
          <button
            onClick={handleDelete}
            className="text-stone-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity ml-2 shrink-0"
            title="Remove from Board"
          >
            <Trash2 size={14} />
          </button>
        </div>
        
        <div className="p-3">
          <textarea
            value={data.description || ''}
            onChange={handleDescriptionChange}
            placeholder="Describe this work's role in the architecture..."
            className="w-full h-24 text-sm text-stone-600 bg-transparent resize-none outline-none placeholder:text-stone-300"
            // Stop propagation so typing doesn't trigger React Flow shortcuts
            onKeyDown={(e) => e.stopPropagation()}
          />
        </div>
      </div>

      <Handle 
        type="source" 
        position={Position.Bottom} 
        className={cn(
          "bg-emerald-500 transition-all",
          mode === 'connect' ? "opacity-0 z-30 rounded-none border-none cursor-crosshair" : "w-3 h-3"
        )}
        style={mode === 'connect' ? { bottom: 0, left: 0, transform: 'none', width: '100%', height: '50%', top: 'auto' } : undefined}
      />
    </div>
  );
};

// Helper functions for floating edges
function getNodeCenter(node: any) {
  return {
    x: node.internals.positionAbsolute.x + (node.measured?.width || 0) / 2,
    y: node.internals.positionAbsolute.y + (node.measured?.height || 0) / 2,
  };
}

function getNodeIntersection(intersectionNode: any, targetNode: any) {
  const width = intersectionNode.measured?.width || 0;
  const height = intersectionNode.measured?.height || 0;
  const pos = intersectionNode.internals.positionAbsolute;
  const targetCenter = getNodeCenter(targetNode);

  const w = width / 2;
  const h = height / 2;

  const x2 = pos.x + w;
  const y2 = pos.y + h;
  const x1 = targetCenter.x;
  const y1 = targetCenter.y;

  if (w === 0 || h === 0) return { x: x2, y: y2 };

  const xx1 = (x1 - x2) / (2 * w) - (y1 - y2) / (2 * h);
  const yy1 = (x1 - x2) / (2 * w) + (y1 - y2) / (2 * h);
  
  if (Math.abs(xx1) + Math.abs(yy1) === 0) return { x: x2, y: y2 };

  const a = 1 / (Math.abs(xx1) + Math.abs(yy1));
  const xx3 = a * xx1;
  const yy3 = a * yy1;
  const x = w * (xx3 + yy3) + x2;
  const y = h * (-xx3 + yy3) + y2;

  return { x, y };
}

function getEdgePosition(node: any, intersectionPoint: any) {
  const n = { ...node.internals.positionAbsolute, ...node.measured };
  const nx = Math.round(n.x);
  const ny = Math.round(n.y);
  const px = Math.round(intersectionPoint.x);
  const py = Math.round(intersectionPoint.y);

  if (px <= nx + 1) return Position.Left;
  if (px >= nx + (n.width || 0) - 1) return Position.Right;
  if (py <= ny + 1) return Position.Top;
  if (py >= ny + (n.height || 0) - 1) return Position.Bottom;

  return Position.Top;
}

// Custom Edge with editable label
const EditableEdge = ({
  id,
  source,
  target,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data,
}: EdgeProps) => {
  const { dispatch } = useStore();
  const sourceNode = useInternalNode(source);
  const targetNode = useInternalNode(target);

  if (!sourceNode || !targetNode) {
    return null;
  }

  const sourceIntersectionPoint = getNodeIntersection(sourceNode, targetNode);
  const targetIntersectionPoint = getNodeIntersection(targetNode, sourceNode);

  const sourcePos = getEdgePosition(sourceNode, sourceIntersectionPoint);
  const targetPos = getEdgePosition(targetNode, targetIntersectionPoint);

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX: sourceIntersectionPoint.x,
    sourceY: sourceIntersectionPoint.y,
    sourcePosition: sourcePos,
    targetX: targetIntersectionPoint.x,
    targetY: targetIntersectionPoint.y,
    targetPosition: targetPos,
  });

  const handleLabelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch({
      type: 'UPDATE_WHITEBOARD_EDGE',
      payload: { id, label: e.target.value }
    });
  };

  const handleDeleteEdge = () => {
    dispatch({ type: 'DELETE_WHITEBOARD_EDGE', payload: id });
  };

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={{ ...style, strokeWidth: 2, stroke: '#10b981' }} />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
          }}
          className="nodrag nopan bg-white px-2 py-1 rounded shadow-sm border border-stone-200 flex items-center group"
        >
          <input
            value={data?.label || ''}
            onChange={handleLabelChange}
            placeholder="Label..."
            className="text-xs font-medium text-stone-600 outline-none bg-transparent w-24 text-center"
            onKeyDown={(e) => e.stopPropagation()}
          />
          <button
            onClick={handleDeleteEdge}
            className="ml-1 text-stone-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </EdgeLabelRenderer>
    </>
  );
};

export function ArchitectureTab() {
  const { state, dispatch } = useStore();
  const [mode, setMode] = useState<'move' | 'connect'>('move');
  
  const nodeTypes = useMemo(() => ({ workNode: WorkNode }), []);
  const edgeTypes = useMemo(() => ({ editableEdge: EditableEdge }), []);

  // Convert store state to React Flow state
  const initialNodes: Node[] = state.whiteboardNodes.map(n => ({
    id: n.id,
    type: 'workNode',
    position: n.position,
    data: { workId: n.workId, description: n.description, mode: 'move' },
  }));

  const initialEdges: Edge[] = state.whiteboardEdges.map(e => ({
    id: e.id,
    source: e.source,
    target: e.target,
    type: 'editableEdge',
    data: { label: e.label },
  }));

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Sync React Flow state changes back to store when dragging ends
  const onNodeDragStop = useCallback((event: React.MouseEvent, node: Node) => {
    dispatch({
      type: 'UPDATE_WHITEBOARD_NODE',
      payload: { id: node.id, position: node.position }
    });
  }, [dispatch]);

  const onConnect = useCallback((params: Connection) => {
    dispatch({
      type: 'ADD_WHITEBOARD_EDGE',
      payload: { source: params.source, target: params.target, label: '' }
    });
  }, [dispatch]);

  const onNodesDelete = useCallback((deletedNodes: Node[]) => {
    deletedNodes.forEach(node => {
      dispatch({ type: 'DELETE_WHITEBOARD_NODE', payload: node.id });
    });
  }, [dispatch]);

  const onEdgesDelete = useCallback((deletedEdges: Edge[]) => {
    deletedEdges.forEach(edge => {
      dispatch({ type: 'DELETE_WHITEBOARD_EDGE', payload: edge.id });
    });
  }, [dispatch]);

  // Update local state when store changes (e.g. node deleted from inside custom node)
  useEffect(() => {
    setNodes(state.whiteboardNodes.map(n => ({
      id: n.id,
      type: 'workNode',
      position: n.position,
      data: { workId: n.workId, description: n.description, mode },
    })));
  }, [state.whiteboardNodes, setNodes, mode]);

  useEffect(() => {
    setEdges(state.whiteboardEdges.map(e => ({
      id: e.id,
      source: e.source,
      target: e.target,
      type: 'editableEdge',
      data: { label: e.label },
    })));
  }, [state.whiteboardEdges, setEdges]);

  // Add Work Dropdown
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);

  const handleAddWorkToWhiteboard = (workId: string) => {
    // Add to center of view (simplified)
    dispatch({
      type: 'ADD_WHITEBOARD_NODE',
      payload: { workId, position: { x: window.innerWidth / 2 - 100, y: window.innerHeight / 2 - 100 } }
    });
    setIsAddMenuOpen(false);
  };

  const availableWorks = state.works.filter(w => !state.whiteboardNodes.some(n => n.workId === w.id));

  return (
    <div className="flex-1 h-full relative bg-stone-50">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeDragStop={onNodeDragStop}
        onNodesDelete={onNodesDelete}
        onEdgesDelete={onEdgesDelete}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        connectionMode={ConnectionMode.Loose}
        nodesDraggable={mode === 'move'}
        nodesConnectable={mode === 'connect'}
        elementsSelectable={mode === 'move'}
        panOnDrag={mode === 'move'}
        fitView
        className="bg-stone-50"
      >
        <Background color="#e7e5e4" gap={16} />
        <Controls className="bg-white border border-stone-200 shadow-sm rounded-md" />
        <MiniMap 
          nodeColor="#10b981" 
          maskColor="rgba(245, 245, 244, 0.7)" 
          className="bg-white border border-stone-200 shadow-sm rounded-md"
        />
      </ReactFlow>

      {/* Top Left Controls */}
      <div className="absolute top-6 left-6 z-10 flex flex-col space-y-4">
        {/* Mode Toggle */}
        <div className="flex bg-white rounded-md shadow-md border border-stone-200 p-1 w-fit">
          <button
            onClick={() => setMode('move')}
            className={cn(
              "flex items-center px-3 py-1.5 rounded text-sm font-medium transition-colors",
              mode === 'move' ? "bg-stone-100 text-stone-900" : "text-stone-500 hover:text-stone-700 hover:bg-stone-50"
            )}
            title="Move Mode: Drag cards and edit content"
          >
            <MousePointer2 size={16} className="mr-2" />
            Move
          </button>
          <button
            onClick={() => setMode('connect')}
            className={cn(
              "flex items-center px-3 py-1.5 rounded text-sm font-medium transition-colors",
              mode === 'connect' ? "bg-emerald-50 text-emerald-700" : "text-stone-500 hover:text-stone-700 hover:bg-stone-50"
            )}
            title="Connect Mode: Drag between cards to create links"
          >
            <Link2 size={16} className="mr-2" />
            Connect
          </button>
        </div>

        {/* Add Button */}
        <div className="relative">
          <button
            onClick={() => setIsAddMenuOpen(!isAddMenuOpen)}
            className="flex items-center px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md shadow-md transition-colors font-medium text-sm"
          >
            <Plus size={16} className="mr-2" />
            Add Work to Board
          </button>
          
          {isAddMenuOpen && (
            <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-md shadow-xl border border-stone-200 overflow-hidden">
              <div className="p-2 border-b border-stone-100 bg-stone-50 text-xs font-semibold text-stone-500 uppercase tracking-wider">
                Available Works
              </div>
              <div className="max-h-64 overflow-y-auto">
                {availableWorks.length === 0 ? (
                  <div className="p-4 text-sm text-stone-400 text-center">
                    All works are already on the board.
                  </div>
                ) : (
                  availableWorks.map(work => (
                    <button
                      key={work.id}
                      onClick={() => handleAddWorkToWhiteboard(work.id)}
                      className="w-full text-left px-4 py-2 text-sm text-stone-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors flex items-center"
                    >
                      <WorkIcon icon={work.icon} size={14} className="mr-2 opacity-50" />
                      <span className="truncate">{work.title}</span>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
