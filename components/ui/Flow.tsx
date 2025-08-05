"use client";

import React, { useCallback } from "react";
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  addEdge,
  useNodesState,
  useEdgesState,
  Connection,
  Edge,
  Handle,
  Position,
} from "reactflow";
import "reactflow/dist/style.css";

const initialNodes = [
  {
    id: "1",
    position: { x: 100, y: 100 },
    data: {
      label: (
        <div className='flex items-center justify-center w-36 h-12 relative'>
          <div>Component A</div>
          <Handle
            type='source'
            position={Position.Right}
            id='right'
            className='!top-1/2 !-right-2 transform -translate-y-1/2'
          />
        </div>
      ),
    },
    style: {
      borderRadius: "0.5rem",
      border: "1px solid var(--fd-border)",
      backgroundColor: "var(--fd-bg)",
      color: "var(--fd-fg)",
    },
  },
  {
    id: "2",
    position: { x: 350, y: 100 },
    data: {
      label: (
        <div className='flex items-center justify-center w-36 h-12 relative'>
          <Handle
            type='target'
            position={Position.Left}
            id='left'
            className='!top-1/2 !-left-2 transform -translate-y-1/2'
          />
          <div>Component B</div>
        </div>
      ),
    },
    style: {
      borderRadius: "0.5rem",
      border: "1px solid var(--fd-border)",
      backgroundColor: "var(--fd-bg)",
      color: "var(--fd-fg)",
    },
  },
];

const initialEdges: Edge[] = [
  {
    id: "e1-2",
    source: "1",
    target: "2",
    sourceHandle: "right",
    targetHandle: "left",
  },
];

export default function OneToOneFlow() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params: Edge | Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const handleReset = () => {
    setNodes(initialNodes);
  };

  return (
    <div className='relative w-full h-[350px] bg-transparent'>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
        proOptions={{ hideAttribution: true }}
      >
        <Background />
        <Controls />
      </ReactFlow>

      <button
        onClick={handleReset}
        className='absolute top-1 right-1 px-3 py-1.5 bg-fd-background text-fd-accent-foreground rounded-md font-semibold shadow-md hover:brightness-90 transition'
      >
        Reset
      </button>
    </div>
  );
}
