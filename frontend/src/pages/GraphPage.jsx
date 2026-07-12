import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  MdBubbleChart, MdAdd, MdDelete, MdRefresh, MdPerson,
  MdLocationOn, MdFolder, MdGavel, MdWarning, MdGroup, MdZoomIn, MdZoomOut,
} from 'react-icons/md';
import { graphService } from '../services/graphReportService';
import { caseService } from '../services/caseService';
import { getErrorMessage } from '../utils/helpers';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Modal, Select, Alert, EmptyState } from '../components/ui/index.jsx';
import Input from '../components/ui/Input';

const NODE_COLORS = {
  suspect: '#ef4444', victim: '#22c55e', witness: '#f59e0b',
  evidence: '#3b82f6', case: '#8b5cf6', location: '#06b6d4', organization: '#ec4899',
};

const NODE_ICONS = {
  suspect: '🔴', victim: '🟢', witness: '🟡',
  evidence: '🔵', case: '🟣', location: '📍', organization: '🏢',
};

const NODE_TYPES = [
  { value: 'suspect', label: 'Suspect' }, { value: 'victim', label: 'Victim' },
  { value: 'witness', label: 'Witness' }, { value: 'evidence', label: 'Evidence' },
  { value: 'case', label: 'Case' }, { value: 'location', label: 'Location' },
  { value: 'organization', label: 'Organization' },
];

const REL_TYPES = [
  { value: 'connected_to', label: 'Connected To' }, { value: 'witnessed', label: 'Witnessed' },
  { value: 'victim_of', label: 'Victim Of' }, { value: 'suspect_in', label: 'Suspect In' },
  { value: 'linked_to', label: 'Linked To' }, { value: 'located_at', label: 'Located At' },
  { value: 'part_of', label: 'Part Of' }, { value: 'associated_with', label: 'Associated With' },
];

// Demo graph data for visualization
const DEMO_NODES = [
  { id: '1', label: 'Rajesh Kumar', type: 'suspect', x: 400, y: 200 },
  { id: '2', label: 'Priya Sharma', type: 'victim', x: 200, y: 350 },
  { id: '3', label: 'CCTV Footage', type: 'evidence', x: 600, y: 350 },
  { id: '4', label: 'Mobile Phone', type: 'evidence', x: 500, y: 450 },
  { id: '5', label: 'Anand Mall', type: 'location', x: 300, y: 150 },
  { id: '6', label: 'Theft Case #001', type: 'case', x: 150, y: 200 },
  { id: '7', label: 'Witness A', type: 'witness', x: 650, y: 200 },
];

const DEMO_EDGES = [
  { source: '1', target: '2', label: 'suspect_in' },
  { source: '1', target: '3', label: 'linked_to' },
  { source: '2', target: '6', label: 'victim_of' },
  { source: '3', target: '5', label: 'located_at' },
  { source: '4', target: '1', label: 'linked_to' },
  { source: '7', target: '1', label: 'witnessed' },
  { source: '6', target: '5', label: 'located_at' },
];

function GraphCanvas({ nodes, edges, onNodeClick, selectedNode }) {
  const svgRef = useRef(null);
  const [dragging, setDragging] = useState(null);
  const [positions, setPositions] = useState(() =>
    Object.fromEntries(nodes.map((n) => [n.id, { x: n.x, y: n.y }]))
  );

  useEffect(() => {
    setPositions(Object.fromEntries(nodes.map((n) => [n.id, { x: n.x, y: n.y }])));
  }, [nodes]);

  const onMouseDown = (e, id) => {
    e.preventDefault();
    setDragging(id);
  };

  const onMouseMove = (e) => {
    if (!dragging || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    setPositions((p) => ({ ...p, [dragging]: { x: e.clientX - rect.left, y: e.clientY - rect.top } }));
  };

  const onMouseUp = () => setDragging(null);

  return (
    <svg
      ref={svgRef}
      className="w-full h-full"
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
    >
      <defs>
        <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3 z" fill="rgba(148,163,184,0.5)" />
        </marker>
      </defs>

      {/* Edges */}
      {edges.map((e, i) => {
        const s = positions[e.source];
        const t = positions[e.target];
        if (!s || !t) return null;
        const mx = (s.x + t.x) / 2;
        const my = (s.y + t.y) / 2;
        return (
          <g key={i}>
            <line
              x1={s.x} y1={s.y} x2={t.x} y2={t.y}
              stroke="rgba(148,163,184,0.25)" strokeWidth="1.5"
              markerEnd="url(#arrow)"
            />
            <text x={mx} y={my - 4} textAnchor="middle" fill="rgba(148,163,184,0.6)" fontSize="9">
              {e.label?.replace(/_/g, ' ')}
            </text>
          </g>
        );
      })}

      {/* Nodes */}
      {nodes.map((node) => {
        const pos = positions[node.id] || { x: node.x, y: node.y };
        const color = NODE_COLORS[node.type] || '#3b82f6';
        const isSelected = selectedNode?.id === node.id;
        return (
          <g
            key={node.id}
            transform={`translate(${pos.x},${pos.y})`}
            onMouseDown={(e) => onMouseDown(e, node.id)}
            onClick={() => onNodeClick(node)}
            style={{ cursor: 'grab' }}
          >
            <circle r={isSelected ? 28 : 24} fill={color} fillOpacity={0.15} stroke={color} strokeWidth={isSelected ? 2.5 : 1.5} />
            <text textAnchor="middle" dominantBaseline="middle" fontSize="16">{NODE_ICONS[node.type]}</text>
            <text y={36} textAnchor="middle" fill="white" fontSize="11" fontWeight="500">
              {node.label?.length > 14 ? node.label.slice(0, 14) + '…' : node.label}
            </text>
            <text y={48} textAnchor="middle" fill={color} fontSize="9" opacity={0.8}>
              {node.type}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export default function GraphPage() {
  const [nodes, setNodes] = useState(DEMO_NODES);
  const [edges, setEdges] = useState(DEMO_EDGES);
  const [selectedNode, setSelectedNode] = useState(null);
  const [addNodeOpen, setAddNodeOpen] = useState(false);
  const [addEdgeOpen, setAddEdgeOpen] = useState(false);
  const [error, setError] = useState('');
  const [nodeForm, setNodeForm] = useState({ label: '', type: 'suspect', description: '' });
  const [edgeForm, setEdgeForm] = useState({ source: '', target: '', label: 'connected_to' });

  const setNF = (k) => (e) => setNodeForm((f) => ({ ...f, [k]: e.target.value }));
  const setEF = (k) => (e) => setEdgeForm((f) => ({ ...f, [k]: e.target.value }));

  const addNode = (e) => {
    e.preventDefault();
    const id = Date.now().toString();
    setNodes((n) => [...n, { id, ...nodeForm, x: 300 + Math.random() * 200, y: 200 + Math.random() * 200 }]);
    setAddNodeOpen(false);
    setNodeForm({ label: '', type: 'suspect', description: '' });
  };

  const addEdge = (e) => {
    e.preventDefault();
    setEdges((ed) => [...ed, edgeForm]);
    setAddEdgeOpen(false);
    setEdgeForm({ source: '', target: '', label: 'connected_to' });
  };

  const deleteNode = (id) => {
    setNodes((n) => n.filter((x) => x.id !== id));
    setEdges((ed) => ed.filter((e) => e.source !== id && e.target !== id));
    setSelectedNode(null);
  };

  const nodeOptions = nodes.map((n) => ({ value: n.id, label: `${n.label} (${n.type})` }));

  const typeCounts = NODE_TYPES.map((t) => ({
    ...t,
    count: nodes.filter((n) => n.type === t.value).length,
  }));

  return (
    <div className="space-y-4">
      {error && <Alert type="error" message={error} onClose={() => setError('')} />}

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Evidence Relationship Graph</h2>
          <p className="text-sm text-slate-400">{nodes.length} nodes · {edges.length} relationships</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setAddEdgeOpen(true)} variant="secondary" size="sm" icon={<MdAdd size={16} />}>Add Relation</Button>
          <Button onClick={() => setAddNodeOpen(true)} size="sm" icon={<MdAdd size={16} />}>Add Node</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Graph canvas */}
        <div className="lg:col-span-3">
          <Card className="p-0 overflow-hidden" style={{ height: '520px' }}>
            <div className="flex items-center justify-between border-b border-white/10 p-3">
              <p className="text-xs text-slate-400">Drag nodes to rearrange · Click to inspect</p>
              <div className="flex items-center gap-2">
                <button className="rounded-lg border border-white/10 bg-slate-900/70 p-1.5 text-slate-300"><MdZoomIn size={15} /></button>
                <button className="rounded-lg border border-white/10 bg-slate-900/70 p-1.5 text-slate-300"><MdZoomOut size={15} /></button>
                <div className="flex gap-1">
                  {NODE_TYPES.slice(0, 4).map((t) => (
                    <span key={t.value} className="rounded-full px-2 py-0.5 text-[11px]" style={{ background: NODE_COLORS[t.value] + '30', color: NODE_COLORS[t.value] }}>
                      {t.label}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <div style={{ height: '460px' }}>
              <GraphCanvas nodes={nodes} edges={edges} onNodeClick={setSelectedNode} selectedNode={selectedNode} />
            </div>
          </Card>
        </div>

        {/* Side panel */}
        <div className="space-y-4">
          {/* Legend */}
          <Card>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Node Types</h3>
            <div className="space-y-2">
              {typeCounts.map((t) => (
                <div key={t.value} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ background: NODE_COLORS[t.value] }} />
                    <span className="text-xs text-slate-300">{t.label}</span>
                  </div>
                  <span className="text-xs font-bold" style={{ color: NODE_COLORS[t.value] }}>{t.count}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Selected node info */}
          {selectedNode ? (
            <Card>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Selected Node</h3>
                <button onClick={() => deleteNode(selectedNode.id)} className="text-red-400 hover:text-red-300 p-1 rounded-lg hover:bg-red-500/10">
                  <MdDelete size={14} />
                </button>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{NODE_ICONS[selectedNode.type]}</span>
                  <div>
                    <p className="text-sm font-semibold text-white">{selectedNode.label}</p>
                    <p className="text-xs capitalize" style={{ color: NODE_COLORS[selectedNode.type] }}>{selectedNode.type}</p>
                  </div>
                </div>
                {selectedNode.description && (
                  <p className="text-xs text-slate-400">{selectedNode.description}</p>
                )}
                <div className="pt-2 border-t border-white/10">
                  <p className="text-xs text-slate-500">Connections: {edges.filter((e) => e.source === selectedNode.id || e.target === selectedNode.id).length}</p>
                </div>
              </div>
            </Card>
          ) : (
            <Card>
              <p className="text-xs text-slate-500 text-center py-4">Click a node to see details</p>
            </Card>
          )}

          {/* Recent edges */}
          <Card>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Relationships</h3>
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {edges.slice(-8).map((e, i) => {
                const s = nodes.find((n) => n.id === e.source);
                const t = nodes.find((n) => n.id === e.target);
                if (!s || !t) return null;
                return (
                  <div key={i} className="text-xs text-slate-400 flex items-center gap-1 flex-wrap">
                    <span className="text-white">{s.label}</span>
                    <span className="text-blue-400">→ {e.label?.replace(/_/g, ' ')} →</span>
                    <span className="text-white">{t.label}</span>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>

      {/* Add Node Modal */}
      <Modal open={addNodeOpen} onClose={() => setAddNodeOpen(false)} title="Add Graph Node">
        <form onSubmit={addNode} className="space-y-4">
          <Input label="Label / Name" value={nodeForm.label} onChange={setNF('label')} placeholder="e.g. John Doe" required />
          <Select label="Node Type" value={nodeForm.type} onChange={setNF('type')} options={NODE_TYPES} required />
          <Input label="Description (optional)" value={nodeForm.description} onChange={setNF('description')} placeholder="Brief description" />
          <Button type="submit" className="w-full">Add Node</Button>
        </form>
      </Modal>

      {/* Add Edge Modal */}
      <Modal open={addEdgeOpen} onClose={() => setAddEdgeOpen(false)} title="Add Relationship">
        <form onSubmit={addEdge} className="space-y-4">
          <Select label="From Node" value={edgeForm.source} onChange={setEF('source')} options={[{ value: '', label: 'Select source...' }, ...nodeOptions]} required />
          <Select label="Relationship Type" value={edgeForm.label} onChange={setEF('label')} options={REL_TYPES} required />
          <Select label="To Node" value={edgeForm.target} onChange={setEF('target')} options={[{ value: '', label: 'Select target...' }, ...nodeOptions]} required />
          <Button type="submit" className="w-full">Add Relationship</Button>
        </form>
      </Modal>
    </div>
  );
}
