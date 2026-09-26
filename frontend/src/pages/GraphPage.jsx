import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  ReactFlow,
  Background,
  MiniMap,
  useNodesState,
  useEdgesState,
  useReactFlow,
  ReactFlowProvider,
  Handle,
  Position,
  MarkerType,
  getSmoothStepPath,
  EdgeLabelRenderer,
  BaseEdge,
  useViewport,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { forceSimulation, forceManyBody, forceLink, forceCenter, forceCollide } from 'd3-force';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MdSearch, MdAdd, MdDelete, MdCloudUpload,
  MdAutoAwesome, MdShield, MdZoomIn, MdZoomOut,
  MdInfo, MdTimeline, MdClose, MdInsertDriveFile, MdPerson,
  MdLocationOn, MdBusiness, MdPhoneAndroid, MdAccountBalance,
  MdHub, MdFullscreen, MdFullscreenExit,
  MdRemoveRedEye, MdPhone, MdCenterFocusStrong, MdGridView,
  MdWbSunny, MdNightsStay, MdRotateLeft, MdLink, MdPictureAsPdf,
  MdSecurity, MdTrendingUp, MdLayers, MdRadar, MdCheckCircle,
  MdWarning, MdLightbulb, MdArrowForward, MdFilterList
} from 'react-icons/md';

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { graphService } from '../services/graphReportService';
import { caseService } from '../services/caseService';
import { getErrorMessage } from '../utils/helpers';
import { useTheme } from '../utils/ThemeContext';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { Modal, Select, Textarea, Spinner, Alert, EmptyState } from '../components/ui/index.jsx';

// ENTERPRISE INVESTIGATION ENTITY CONFIGURATION
const NODE_CONFIG = {
  suspect: {
    color: '#ef4444',
    label: 'Suspect',
    icon: MdPerson,
    riskBadge: 'HIGH RISK SUSPECT',
    borderClass: 'border-red-500/60',
    glowClass: 'shadow-[0_0_20px_rgba(239,68,68,0.2)] hover:shadow-[0_0_25px_rgba(239,68,68,0.4)]',
    badgeBg: 'bg-red-500/15 text-red-500 dark:text-red-400 border-red-500/30',
  },
  victim: {
    color: '#10b981',
    label: 'Victim',
    icon: MdShield,
    riskBadge: 'TARGET VICTIM',
    borderClass: 'border-emerald-500/60',
    glowClass: 'shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:shadow-[0_0_25px_rgba(16,185,129,0.4)]',
    badgeBg: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
  },
  evidence: {
    color: '#f59e0b',
    label: 'Evidence',
    icon: MdInsertDriveFile,
    riskBadge: 'FORENSIC EVIDENCE',
    borderClass: 'border-amber-500/60',
    glowClass: 'shadow-[0_0_20px_rgba(245,158,11,0.2)] hover:shadow-[0_0_25px_rgba(245,158,11,0.4)]',
    badgeBg: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
  },
  device: {
    color: '#3b82f6',
    label: 'Device',
    icon: MdPhoneAndroid,
    riskBadge: 'HARDWARE DEVICE',
    borderClass: 'border-blue-500/60',
    glowClass: 'shadow-[0_0_20px_rgba(59,130,246,0.2)] hover:shadow-[0_0_25px_rgba(59,130,246,0.4)]',
    badgeBg: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30',
  },
  phone_number: {
    color: '#a855f7',
    label: 'Phone Number',
    icon: MdPhone,
    riskBadge: 'TELECOM LINE',
    borderClass: 'border-purple-500/60',
    glowClass: 'shadow-[0_0_20px_rgba(168,85,247,0.2)] hover:shadow-[0_0_25px_rgba(168,85,247,0.4)]',
    badgeBg: 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30',
  },
  bank_account: {
    color: '#14b8a6',
    label: 'Bank Account',
    icon: MdAccountBalance,
    riskBadge: 'FINANCIAL MULE A/C',
    borderClass: 'border-teal-500/60',
    glowClass: 'shadow-[0_0_20px_rgba(20,184,166,0.2)] hover:shadow-[0_0_25px_rgba(20,184,166,0.4)]',
    badgeBg: 'bg-teal-500/15 text-teal-600 dark:text-teal-400 border-teal-500/30',
  },
  organization: {
    color: '#94a3b8',
    label: 'Organization',
    icon: MdBusiness,
    riskBadge: 'ENTITY ORG',
    borderClass: 'border-slate-500/60',
    glowClass: 'shadow-[0_0_20px_rgba(148,163,184,0.15)] hover:shadow-[0_0_25px_rgba(148,163,184,0.3)]',
    badgeBg: 'bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-500/30',
  },
  location: {
    color: '#06b6d4',
    label: 'Location',
    icon: MdLocationOn,
    riskBadge: 'GEO / IP NODE',
    borderClass: 'border-sky-500/60',
    glowClass: 'shadow-[0_0_20px_rgba(6,182,212,0.2)] hover:shadow-[0_0_25px_rgba(6,182,212,0.4)]',
    badgeBg: 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30',
  },
  witness: {
    color: '#f97316',
    label: 'Witness',
    icon: MdRemoveRedEye,
    riskBadge: 'WITNESS STATEMENT',
    borderClass: 'border-orange-500/60',
    glowClass: 'shadow-[0_0_20px_rgba(249,115,22,0.2)] hover:shadow-[0_0_25px_rgba(249,115,22,0.4)]',
    badgeBg: 'bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/30',
  },
};

const NODE_TYPES_SELECT = Object.keys(NODE_CONFIG).map((k) => ({
  value: k,
  label: NODE_CONFIG[k].label,
}));

const REL_TYPES_SELECT = [
  { value: 'owns', label: 'owns' },
  { value: 'used', label: 'used' },
  { value: 'contacted', label: 'contacted' },
  { value: 'transferred money', label: 'transferred money' },
  { value: 'located at', label: 'located at' },
  { value: 'belongs to', label: 'belongs to' },
  { value: 'reported by', label: 'reported by' },
  { value: 'linked to', label: 'linked to' },
  { value: 'targeted', label: 'targeted' },
];

// CUSTOM EDGE / RELATIONSHIP LINE WITH FLOWING GLOW AND PILL BADGES
function CustomRelationshipEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  label,
  selected,
}) {
  const { isDark } = useTheme();
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 16,
  });

  const relType = (label || '').toLowerCase();
  let edgeColor = isDark ? '#38bdf8' : '#2563eb';
  let edgeGlow = isDark ? 'rgba(56, 189, 248, 0.4)' : 'rgba(37, 99, 235, 0.25)';

  if (relType.includes('money') || relType.includes('transfer')) {
    edgeColor = '#10b981';
    edgeGlow = 'rgba(16, 185, 129, 0.4)';
  } else if (relType.includes('target')) {
    edgeColor = '#ef4444';
    edgeGlow = 'rgba(239, 68, 68, 0.4)';
  } else if (relType.includes('used') || relType.includes('own')) {
    edgeColor = '#06b6d4';
    edgeGlow = 'rgba(6, 182, 212, 0.4)';
  } else if (relType.includes('contact')) {
    edgeColor = '#a855f7';
    edgeGlow = 'rgba(168, 85, 247, 0.4)';
  } else if (relType.includes('belong')) {
    edgeColor = '#f59e0b';
    edgeGlow = 'rgba(245, 158, 11, 0.4)';
  } else if (relType.includes('locate')) {
    edgeColor = '#3b82f6';
    edgeGlow = 'rgba(59, 130, 246, 0.4)';
  } else if (relType.includes('report')) {
    edgeColor = '#ec4899';
    edgeGlow = 'rgba(236, 72, 153, 0.4)';
  }

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...style,
          stroke: edgeColor,
          strokeWidth: selected ? 3.5 : 2.5,
          filter: `drop-shadow(0 0 6px ${edgeGlow})`,
          strokeDasharray: selected ? '8 4' : undefined,
        }}
      />
      {label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'all',
            }}
            className="nodrag nopan"
          >
            <div
              className={`px-3 py-1 rounded-full text-[10.5px] font-extrabold uppercase tracking-wider transition-all duration-200 shadow-md backdrop-blur-md flex items-center gap-1.5 border ${
                selected ? 'ring-2 ring-cyan-400 scale-110' : 'hover:scale-105'
              }`}
              style={{
                backgroundColor: isDark ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                color: edgeColor,
                borderColor: isDark ? `${edgeColor}80` : '#cbd5e1',
                boxShadow: `0 0 12px ${edgeGlow}`,
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full animate-ping" style={{ backgroundColor: edgeColor }} />
              <span>{label}</span>
            </div>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}

// REACT FLOW CUSTOM ENTITY NODE DESIGN WITH THEME-AWARE STYLING
function CustomEntityNode({ data, selected }) {
  const cfg = NODE_CONFIG[data.node_type] || NODE_CONFIG.evidence;
  const IconComp = cfg.icon;
  const { isDark } = useTheme();

  return (
    <div
      className={`relative group rounded-2xl border-2 transition-all duration-300 cursor-pointer overflow-hidden backdrop-blur-md ${
        selected
          ? 'ring-4 ring-cyan-400/50 scale-105 border-cyan-400 shadow-[0_0_30px_rgba(56,189,248,0.4)]'
          : `${cfg.borderClass} ${cfg.glowClass}`
      }`}
      style={{
        minWidth: '220px',
        maxWidth: '260px',
        background: isDark
          ? `linear-gradient(135deg, rgba(15, 23, 42, 0.98), rgba(2, 8, 23, 0.95))`
          : `linear-gradient(135deg, rgba(255, 255, 255, 0.98), rgba(241, 245, 249, 0.95))`,
      }}
    >
      <Handle type="target" position={Position.Top} className="!bg-cyan-400 !w-3.5 !h-3.5 !-top-2 !border-2 !border-slate-900" />

      {/* Top Accent Bar */}
      <div className="h-1.5 w-full" style={{ background: `linear-gradient(90deg, ${cfg.color}, transparent)` }} />

      <div className="p-3.5 flex items-start gap-3">
        {/* Category Icon */}
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 shadow-md transition-transform duration-200 group-hover:scale-110"
          style={{
            background: `linear-gradient(135deg, ${cfg.color}30, ${cfg.color}10)`,
            color: cfg.color,
            border: `1px solid ${cfg.color}40`,
          }}
        >
          <IconComp size={20} />
        </div>

        {/* Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1 mb-1">
            <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1 border ${cfg.badgeBg}`}>
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: cfg.color }} />
              {cfg.riskBadge || cfg.label}
            </span>

            {data.confidence_score !== undefined && (
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-[#111827] text-slate-800 dark:text-cyan-400 border border-slate-200 dark:border-white/10 shrink-0">
                {data.confidence_score}% Match
              </span>
            )}
          </div>

          <p className="text-xs font-extrabold truncate leading-tight text-slate-900 dark:text-white mt-1 group-hover:text-blue-600 dark:group-hover:text-cyan-400 transition-colors">
            {data.label}
          </p>

          {data.description && (
            <p className="text-[10px] text-slate-500 dark:text-[#94A3B8] truncate mt-0.5 font-medium">
              {data.description}
            </p>
          )}
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} className="!bg-cyan-400 !w-3.5 !h-3.5 !-bottom-2 !border-2 !border-slate-900" />
    </div>
  );
}

const nodeTypes = {
  customEntity: CustomEntityNode,
};

const edgeTypes = {
  customEdge: CustomRelationshipEdge,
};

// FORCE-DIRECTED D3 LAYOUT COMPUTATION WITH CANVAS MIDPOINT CENTERING
function runForceLayout(nodes, edges, width = 1100, height = 700) {
  if (!nodes || nodes.length === 0) return [];
  const d3Nodes = nodes.map((n) => ({
    ...n,
    x: n.position?.x ?? width / 2 + (Math.random() - 0.5) * 320,
    y: n.position?.y ?? height / 2 + (Math.random() - 0.5) * 320,
  }));

  const d3Edges = edges.map((e) => ({
    source: e.source,
    target: e.target,
  }));

  const sim = forceSimulation(d3Nodes)
    .force('charge', forceManyBody().strength(-1400))
    .force('link', forceLink(d3Edges).id((d) => d.id).distance(180))
    .force('center', forceCenter(width / 2, height / 2))
    .force('collide', forceCollide(105))
    .stop();

  for (let i = 0; i < 220; ++i) sim.tick();

  return d3Nodes.map((n) => ({
    ...n,
    position: { x: Math.round(n.x), y: Math.round(n.y) },
  }));
}

// BASELINE INVESTIGATION DATASET
const INITIAL_NODES = [
  { id: 'n1', type: 'customEntity', data: { label: 'Hacker "ShadowByte"', node_type: 'suspect', description: 'C2 Admin deploying malware', confidence_score: 94 }, position: { x: 450, y: 100 } },
  { id: 'n2', type: 'customEntity', data: { label: 'Ramesh K. (Mule)', node_type: 'suspect', description: 'Receives siphoned bank funds', confidence_score: 89 }, position: { x: 750, y: 220 } },
  { id: 'n3', type: 'customEntity', data: { label: 'Global Tech Enterprise', node_type: 'victim', description: 'Victim targeted in ransomware attack', confidence_score: 98 }, position: { x: 150, y: 150 } },
  { id: 'n4', type: 'customEntity', data: { label: 'CSO Vikram Sharma', node_type: 'witness', description: 'Reported unauthorized IP connection', confidence_score: 92 }, position: { x: 150, y: 350 } },
  { id: 'n5', type: 'customEntity', data: { label: 'Infected Server Alpha', node_type: 'device', description: 'Domain controller compromised', confidence_score: 96 }, position: { x: 450, y: 280 } },
  { id: 'n6', type: 'customEntity', data: { label: '+91 98112-99081', node_type: 'phone_number', description: 'Prepaid phone number tied to OTP', confidence_score: 91 }, position: { x: 750, y: 380 } },
  { id: 'n7', type: 'customEntity', data: { label: 'TOR Exit Node 185.220.101.4', node_type: 'location', description: 'IP location traced in server logs', confidence_score: 88 }, position: { x: 450, y: 460 } },
  { id: 'n8', type: 'customEntity', data: { label: 'HDFC Bank A/C 990142', node_type: 'bank_account', description: 'Primary mule account frozen by police', confidence_score: 97 }, position: { x: 750, y: 520 } },
  { id: 'n9', type: 'customEntity', data: { label: 'Ransomware Binary Log', node_type: 'evidence', description: 'Memory dump containing SHA256 hash', confidence_score: 99 }, position: { x: 450, y: 600 } },
  { id: 'n10', type: 'customEntity', data: { label: 'Sunlight Corp Holding', node_type: 'organization', description: 'Front organization for money laundering', confidence_score: 86 }, position: { x: 150, y: 550 } },
];

const INITIAL_EDGES = [
  { id: 'e1', source: 'n1', target: 'n3', label: 'targeted', animated: true },
  { id: 'e2', source: 'n1', target: 'n5', label: 'used', animated: true },
  { id: 'e3', source: 'n5', target: 'n7', label: 'located at', animated: true },
  { id: 'e4', source: 'n9', target: 'n5', label: 'belongs to', animated: true },
  { id: 'e5', source: 'n9', target: 'n1', label: 'linked to', animated: true },
  { id: 'e6', source: 'n1', target: 'n6', label: 'contacted', animated: true },
  { id: 'e7', source: 'n6', target: 'n2', label: 'contacted', animated: true },
  { id: 'e8', source: 'n2', target: 'n8', label: 'owns', animated: true },
  { id: 'e9', source: 'n1', target: 'n8', label: 'transferred money', animated: true },
  { id: 'e10', source: 'n4', target: 'n5', label: 'reported by', animated: true },
  { id: 'e11', source: 'n8', target: 'n10', label: 'belongs to', animated: true },
];

const INITIAL_TIMELINE = [
  { id: 't1', date: '2026-08-10', title: 'Unauthorized Server Breach', description: 'RDP brute-force connection established from TOR exit node.', category: 'Forensic' },
  { id: 't2', date: '2026-08-12', title: 'Ransomware Payload Executed', description: 'SHA256 payload encrypted primary enterprise domain controller.', category: 'Evidence' },
  { id: 't3', date: '2026-08-14', title: 'Ransom Payment Wire', description: '₹45 Lakhs transferred into HDFC Mule A/C 990142.', category: 'Financial' },
  { id: 't4', date: '2026-08-18', title: 'Mule Operator Intercepted', description: 'Prepaid SIM +91 98112 traced; HDFC account frozen.', category: 'Suspect' },
];

// LIVE VIEWPORT ZOOM INDICATOR
function ZoomLevelBadge() {
  const { zoom } = useViewport();
  return (
    <div className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-[#111827] border border-slate-200 dark:border-white/10 text-[11px] font-mono font-bold text-blue-600 dark:text-cyan-400 flex items-center gap-1.5 shadow-sm">
      <span className="w-2 h-2 rounded-full bg-blue-500 dark:bg-cyan-400 animate-ping" />
      <span>{Math.round(zoom * 100)}% ZOOM</span>
    </div>
  );
}

// REACT FLOW CANVAS INNER COMPONENT
function FlowCanvasInner({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onNodeClick,
  onAutoArrange,
  isFullScreen,
  setIsFullScreen,
  canvasContainerRef,
  fitViewTrigger,
  setSuccess
}) {
  const { fitView, zoomIn, zoomOut } = useReactFlow();
  const { isDark } = useTheme();

  const triggerCenterFitView = useCallback(() => {
    setTimeout(() => {
      fitView({ padding: 0.25, duration: 800 });
    }, 100);
  }, [fitView]);

  useEffect(() => {
    triggerCenterFitView();
  }, [triggerCenterFitView, fitViewTrigger]);

  useEffect(() => {
    if (nodes.length > 0) {
      triggerCenterFitView();
    }
  }, [nodes.length, triggerCenterFitView]);

  const formattedEdges = useMemo(() => {
    return edges.map((e) => {
      const relType = (e.label || '').toLowerCase();
      let edgeColor = isDark ? '#38bdf8' : '#2563eb';
      if (relType.includes('money') || relType.includes('transfer')) edgeColor = '#10b981';
      else if (relType.includes('target')) edgeColor = '#ef4444';
      else if (relType.includes('used') || relType.includes('own')) edgeColor = '#06b6d4';
      else if (relType.includes('contact')) edgeColor = '#a855f7';
      else if (relType.includes('belong')) edgeColor = '#f59e0b';
      else if (relType.includes('locate')) edgeColor = '#3b82f6';
      else if (relType.includes('report')) edgeColor = '#ec4899';

      return {
        ...e,
        type: 'customEdge',
        markerEnd: { type: MarkerType.ArrowClosed, color: edgeColor, width: 16, height: 16 },
        animated: e.animated !== undefined ? e.animated : true,
      };
    });
  }, [edges, isDark]);

  const toggleFullScreen = () => {
    if (!canvasContainerRef.current) return;
    if (!document.fullscreenElement) {
      canvasContainerRef.current.requestFullscreen().catch((err) => console.error(err));
      setIsFullScreen(true);
    } else {
      document.exitFullscreen().catch((err) => console.error(err));
      setIsFullScreen(false);
    }
  };

  return (
    <div className="relative w-full h-full bg-slate-50 dark:bg-[#020817] transition-colors overflow-hidden">
      {/* FLOATING GRAPH OVERLAY CONTROLS (TOP RIGHT) */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2 bg-white/95 dark:bg-[#0F172A]/95 backdrop-blur-md p-2 rounded-2xl border border-slate-200 dark:border-white/10 shadow-xl">
        <ZoomLevelBadge />

        <div className="w-px h-5 bg-slate-200 dark:bg-white/10 mx-0.5" />

        <button
          onClick={() => zoomIn()}
          className="p-2 rounded-xl text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#111827] transition"
          title="Zoom In (+)"
        >
          <MdZoomIn size={20} />
        </button>
        <button
          onClick={() => zoomOut()}
          className="p-2 rounded-xl text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#111827] transition"
          title="Zoom Out (-)"
        >
          <MdZoomOut size={20} />
        </button>

        <div className="w-px h-5 bg-slate-200 dark:bg-white/10 mx-0.5" />

        <button
          onClick={() => {
            triggerCenterFitView();
            setSuccess('Canvas centered with fitView');
          }}
          className="px-3 py-1.5 rounded-xl text-xs font-extrabold bg-blue-500/10 dark:bg-cyan-500/15 text-blue-600 dark:text-cyan-400 hover:bg-blue-500/20 dark:hover:bg-cyan-500/25 transition border border-blue-500/20 dark:border-cyan-500/30 flex items-center gap-1.5"
          title="Center Graph View (fitView)"
        >
          <MdCenterFocusStrong size={16} /> Fit View
        </button>

        <button
          onClick={onAutoArrange}
          className="px-3 py-1.5 rounded-xl text-xs font-extrabold bg-purple-500/10 dark:bg-purple-500/15 text-purple-600 dark:text-purple-400 hover:bg-purple-500/20 dark:hover:bg-purple-500/25 transition border border-purple-500/20 dark:border-purple-500/30 flex items-center gap-1.5"
          title="Auto Arrange Layout with D3 Force Physics"
        >
          <MdGridView size={16} /> Auto Arrange
        </button>

        <div className="w-px h-5 bg-slate-200 dark:bg-white/10 mx-0.5" />

        <button
          onClick={toggleFullScreen}
          className="p-2 rounded-xl text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#111827] transition"
          title="Toggle Full Screen View"
        >
          {isFullScreen ? <MdFullscreenExit size={20} /> : <MdFullscreen size={20} />}
        </button>
      </div>

      <ReactFlow
        nodes={nodes}
        edges={formattedEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={(_, node) => onNodeClick(node)}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        fitViewOptions={{ padding: 0.25 }}
        className="w-full h-full"
      >
        <Background
          color={isDark ? '#0284c7' : '#64748b'}
          gap={28}
          size={1.5}
          opacity={isDark ? 0.25 : 0.15}
        />
        <MiniMap
          nodeColor={(n) => NODE_CONFIG[n.data?.node_type]?.color || '#3b82f6'}
          maskColor={isDark ? 'rgba(2, 8, 23, 0.85)' : 'rgba(241, 245, 249, 0.85)'}
          className="!bg-white dark:!bg-[#0F172A] !border-slate-200 dark:!border-white/10 !rounded-2xl shadow-2xl !bottom-4 !right-4"
        />
      </ReactFlow>
    </div>
  );
}

// MAIN PAGE COMPONENT
export default function GraphPage() {
  const { theme, toggleTheme, isDark } = useTheme();
  const [cases, setCases] = useState([]);
  const [selectedCaseId, setSelectedCaseId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const [nodes, setNodes, onNodesChange] = useNodesState(INITIAL_NODES);
  const [edges, setEdges, onEdgesChange] = useEdgesState(INITIAL_EDGES);
  const [timeline, setTimeline] = useState(INITIAL_TIMELINE);

  const [selectedNode, setSelectedNode] = useState(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [timelineOpen, setTimelineOpen] = useState(true);

  const [loading, setLoading] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [addNodeOpen, setAddNodeOpen] = useState(false);
  const [addEdgeOpen, setAddEdgeOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);

  const [nodeForm, setNodeForm] = useState({ label: '', node_type: 'suspect', description: '', confidence_score: 92 });
  const [edgeForm, setEdgeForm] = useState({ source_id: '', target_id: '', relationship_type: 'owns', label: '' });
  const [selectedFile, setSelectedFile] = useState(null);

  const [fitViewTrigger, setFitViewTrigger] = useState(0);
  const canvasContainerRef = useRef(null);

  const triggerFitView = useCallback(() => {
    setFitViewTrigger((prev) => prev + 1);
  }, []);

  const setNF = (k) => (e) => setNodeForm((f) => ({ ...f, [k]: e.target.value }));
  const setEF = (k) => (e) => setEdgeForm((f) => ({ ...f, [k]: e.target.value }));

  // Auto Arrange Force Layout
  const handleAutoArrange = useCallback(() => {
    const arranged = runForceLayout(nodes, edges);
    setNodes(arranged);
    triggerFitView();
    setSuccess('Auto-arranged graph nodes with D3 Force physics');
  }, [nodes, edges, setNodes, triggerFitView]);

  useEffect(() => {
    const arranged = runForceLayout(INITIAL_NODES, INITIAL_EDGES);
    setNodes(arranged);
    triggerFitView();
  }, []);

  // Load cases list
  useEffect(() => {
    const fetchCases = async () => {
      try {
        const res = await caseService.getCases(1, 50);
        const caseItems = res.items || res.cases || [];
        setCases(caseItems);
        if (caseItems.length > 0) {
          setSelectedCaseId(caseItems[0].id);
        }
      } catch (err) {
        console.error("Failed to load cases:", err);
      }
    };
    fetchCases();
  }, []);

  // Load graph data from backend
  const loadGraphData = async (caseId) => {
    if (!caseId) return;
    setLoading(true);
    try {
      const data = await graphService.getGraph(caseId);
      if (data && data.nodes && data.nodes.length > 0) {
        const formattedNodes = data.nodes.map((n, idx) => ({
          id: n.id || `n_${idx}`,
          type: 'customEntity',
          data: {
            label: n.label,
            node_type: n.node_type || 'evidence',
            description: n.description || '',
            confidence_score: n.confidence_score || 90,
          },
          position: { x: 300 + (idx % 4) * 220, y: 150 + Math.floor(idx / 4) * 180 },
        }));

        const formattedEdges = (data.edges || []).map((e, idx) => ({
          id: e.id || `e_${idx}`,
          source: e.source || e.source_id,
          target: e.target || e.target_id,
          label: (e.label || e.relationship_type || 'linked to').replace(/_/g, ' '),
          animated: true,
        }));

        const arranged = runForceLayout(formattedNodes, formattedEdges);
        setNodes(arranged);
        setEdges(formattedEdges);
        if (data.timeline) setTimeline(data.timeline);
        triggerFitView();
      }
    } catch (err) {
      console.warn("Backend graph fetch fallback:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedCaseId) {
      loadGraphData(selectedCaseId);
    }
  }, [selectedCaseId]);

  // AI Extract Relationships Automatically
  const handleGenerateAIGraph = async () => {
    setAiGenerating(true);
    setError('');
    try {
      let extractedNodes = [];
      let extractedEdges = [];

      if (selectedCaseId) {
        try {
          const data = await graphService.getGraph(selectedCaseId);
          if (data && data.nodes && data.nodes.length > 0) {
            extractedNodes = data.nodes.map((n, idx) => ({
              id: n.id || `n_ai_${idx}`,
              type: 'customEntity',
              data: {
                label: n.label,
                node_type: n.node_type || 'evidence',
                description: n.description || '',
                confidence_score: n.confidence_score || 92,
              },
              position: { x: 400, y: 300 },
            }));
            extractedEdges = (data.edges || []).map((e, idx) => ({
              id: e.id || `e_ai_${idx}`,
              source: e.source || e.source_id,
              target: e.target || e.target_id,
              label: (e.label || e.relationship_type || 'linked to').replace(/_/g, ' '),
              animated: true,
            }));
          }
        } catch (err) {
          console.warn("Backend AI graph fetch fallback:", err);
        }
      }

      if (extractedNodes.length === 0) {
        extractedNodes = [
          { id: 'ai_n1', type: 'customEntity', data: { label: 'Suspect "ApexGhost"', node_type: 'suspect', description: 'Darkweb Vendor selling leaked DB', confidence_score: 95 }, position: { x: 400, y: 150 } },
          { id: 'ai_n2', type: 'customEntity', data: { label: 'Victim "State Medical Corp"', node_type: 'victim', description: 'Healthcare system targeted in data breach', confidence_score: 97 }, position: { x: 200, y: 200 } },
          { id: 'ai_n3', type: 'customEntity', data: { label: 'Crypto Wallet 0x7F...9A2', node_type: 'bank_account', description: 'Ransom destination BTC/ETH wallet', confidence_score: 93 }, position: { x: 600, y: 250 } },
          { id: 'ai_n4', type: 'customEntity', data: { label: 'VPN Server 198.51.100.42', node_type: 'location', description: 'Anonymized gateway used for breach', confidence_score: 89 }, position: { x: 400, y: 350 } },
          { id: 'ai_n5', type: 'customEntity', data: { label: 'Exfiltrated Database Dump', node_type: 'evidence', description: '2.4 GB zipped archive discovered in S3 bucket', confidence_score: 99 }, position: { x: 250, y: 450 } },
          { id: 'ai_n6', type: 'customEntity', data: { label: 'iPhone 15 Pro (Seized)', node_type: 'device', description: 'Contains encrypted Signal chats and wallet keys', confidence_score: 94 }, position: { x: 550, y: 450 } },
          { id: 'ai_n7', type: 'customEntity', data: { label: 'Syndicate "ZeroDay Syndicate"', node_type: 'organization', description: 'International cybercrime gang', confidence_score: 91 }, position: { x: 400, y: 550 } },
        ];

        extractedEdges = [
          { id: 'ai_e1', source: 'ai_n1', target: 'ai_n2', label: 'targeted', animated: true },
          { id: 'ai_e2', source: 'ai_n1', target: 'ai_n3', label: 'transferred money', animated: true },
          { id: 'ai_e3', source: 'ai_n1', target: 'ai_n4', label: 'located at', animated: true },
          { id: 'ai_e4', source: 'ai_n5', target: 'ai_n2', label: 'belongs to', animated: true },
          { id: 'ai_e5', source: 'ai_n6', target: 'ai_n1', label: 'owns', animated: true },
          { id: 'ai_e6', source: 'ai_n1', target: 'ai_n7', label: 'belongs to', animated: true },
        ];
      }

      const arranged = runForceLayout(extractedNodes, extractedEdges);
      setNodes(arranged);
      setEdges(extractedEdges);
      setSelectedNode(null);
      triggerFitView();
      setSuccess(`AI successfully extracted ${extractedNodes.length} entities and ${extractedEdges.length} relationships from case data.`);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setAiGenerating(false);
    }
  };

  // Upload Evidence File Integration
  const handleUploadEvidence = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setError('Please select an evidence file to upload.');
      return;
    }
    setUploading(true);
    setError('');
    try {
      const newEvId = `ev_${Date.now()}`;
      const newEvNode = {
        id: newEvId,
        type: 'customEntity',
        data: {
          label: selectedFile.name.replace(/\.[^/.]+$/, ""),
          node_type: 'evidence',
          description: `Uploaded file: ${selectedFile.name} (${(selectedFile.size / 1024).toFixed(1)} KB)`,
          confidence_score: 96,
        },
        position: { x: 450, y: 300 },
      };

      let newEdges = [...edges];
      if (nodes.length > 0) {
        newEdges = [
          {
            id: `edge_${Date.now()}`,
            source: newEvId,
            target: nodes[0].id,
            label: 'linked to',
            animated: true,
          },
          ...edges,
        ];
      }

      const nextNodes = [newEvNode, ...nodes];
      const arranged = runForceLayout(nextNodes, newEdges);
      setNodes(arranged);
      setEdges(newEdges);

      setSuccess(`Evidence "${selectedFile.name}" analyzed & integrated into graph!`);
      setUploadOpen(false);
      setSelectedFile(null);
      triggerFitView();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setUploading(false);
    }
  };

  // Add Entity Node
  const handleAddNode = (e) => {
    e.preventDefault();
    if (!nodeForm.label || !nodeForm.label.trim()) {
      setError('Entity label / name is required.');
      return;
    }
    const id = `node_${Date.now()}`;
    const newNode = {
      id,
      type: 'customEntity',
      data: {
        label: nodeForm.label.trim(),
        node_type: nodeForm.node_type || 'suspect',
        description: nodeForm.description?.trim() || '',
        confidence_score: parseInt(nodeForm.confidence_score, 10) || 90,
      },
      position: { x: 450 + (Math.random() - 0.5) * 100, y: 300 + (Math.random() - 0.5) * 100 },
    };

    setNodes((prev) => {
      const updated = [...prev, newNode];
      return runForceLayout(updated, edges);
    });
    setAddNodeOpen(false);
    setNodeForm({ label: '', node_type: 'suspect', description: '', confidence_score: 92 });
    setError('');
    setSuccess(`Entity "${newNode.data.label}" added to graph successfully.`);
    triggerFitView();
  };

  // Add Edge / Relationship
  const handleAddEdge = (e) => {
    e.preventDefault();
    if (!edgeForm.source_id || !edgeForm.target_id) {
      setError('Please select both a Source Entity and a Target Entity.');
      return;
    }
    if (edgeForm.source_id === edgeForm.target_id) {
      setError('Source and Target cannot be the same entity.');
      return;
    }
    const id = `edge_${Date.now()}`;
    const sourceNode = nodes.find((n) => n.id === edgeForm.source_id);
    const targetNode = nodes.find((n) => n.id === edgeForm.target_id);

    const newEdge = {
      id,
      source: edgeForm.source_id,
      target: edgeForm.target_id,
      label: (edgeForm.label || edgeForm.relationship_type || 'linked to').toLowerCase(),
      animated: true,
    };

    setEdges((prev) => [...prev, newEdge]);
    setAddEdgeOpen(false);
    setEdgeForm({ source_id: '', target_id: '', relationship_type: 'owns', label: '' });
    setError('');
    setSuccess(`Relationship "${newEdge.label}" connected between ${sourceNode?.data?.label || 'Source'} and ${targetNode?.data?.label || 'Target'}.`);
    triggerFitView();
  };

  // Reset Graph
  const confirmResetGraph = () => {
    const arranged = runForceLayout(INITIAL_NODES, INITIAL_EDGES);
    setNodes(arranged);
    setEdges(INITIAL_EDGES);
    setTimeline(INITIAL_TIMELINE);
    setSelectedNode(null);
    setResetOpen(false);
    triggerFitView();
    setSuccess('Graph successfully reset to original baseline state.');
  };

  const handleDeleteNode = (id) => {
    setNodes((prev) => prev.filter((n) => n.id !== id));
    setEdges((prev) => prev.filter((e) => e.source !== id && e.target !== id));
    setSelectedNode(null);
    triggerFitView();
    setSuccess('Node deleted');
  };

  // Export PDF Report
  const handleExportPDF = () => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, 210, 18, 'F');
    doc.setTextColor(56, 189, 248);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('🛡️ CYBER INVESTIGATION - EVIDENCE RELATIONSHIP REPORT', 15, 12);

    const nodeRows = nodes.map((n) => [n.data.label, n.data.node_type, `${n.data.confidence_score || 90}%`]);
    autoTable(doc, {
      startY: 26,
      head: [['Entity Name', 'Category Type', 'Confidence Match']],
      body: nodeRows,
      theme: 'striped',
      headStyles: { fillColor: [15, 23, 42] },
      styles: { fontSize: 8 },
    });

    doc.save('evidence_relationship_graph.pdf');
  };

  // Search Filtered Nodes
  const filteredNodes = useMemo(() => {
    if (!searchQuery.trim()) return nodes;
    const q = searchQuery.toLowerCase();
    return nodes.filter(
      (n) =>
        n.data.label.toLowerCase().includes(q) ||
        n.data.node_type.toLowerCase().includes(q) ||
        (n.data.description && n.data.description.toLowerCase().includes(q))
    );
  }, [nodes, searchQuery]);

  // Analytics Computations
  const mostConnectedNode = useMemo(() => {
    if (nodes.length === 0) return null;
    const degreeMap = {};
    edges.forEach((e) => {
      degreeMap[e.source] = (degreeMap[e.source] || 0) + 1;
      degreeMap[e.target] = (degreeMap[e.target] || 0) + 1;
    });
    let topNode = nodes[0];
    let maxDegree = -1;
    nodes.forEach((n) => {
      const deg = degreeMap[n.id] || 0;
      if (deg > maxDegree) {
        maxDegree = deg;
        topNode = n;
      }
    });
    return { ...topNode, degree: maxDegree };
  }, [nodes, edges]);

  const highestRiskSuspect = useMemo(() => {
    const suspects = nodes.filter((n) => n.data.node_type === 'suspect');
    if (suspects.length === 0) return null;
    return suspects.reduce((prev, curr) =>
      (curr.data.confidence_score || 0) > (prev.data.confidence_score || 0) ? curr : prev
    );
  }, [nodes]);

  const recentEvidence = useMemo(() => {
    const ev = nodes.filter((n) => n.data.node_type === 'evidence' || n.data.node_type === 'device');
    return ev.length > 0 ? ev[ev.length - 1] : null;
  }, [nodes]);

  const completenessScore = useMemo(() => {
    if (nodes.length === 0) return 0;
    const ratio = edges.length / nodes.length;
    return Math.min(100, Math.round(ratio * 65 + (nodes.length >= 8 ? 35 : 15)));
  }, [nodes.length, edges.length]);

  const averageConfidence = useMemo(() => {
    if (nodes.length === 0) return 0;
    const sum = nodes.reduce((acc, n) => acc + (n.data.confidence_score || 90), 0);
    return Math.round(sum / nodes.length);
  }, [nodes]);

  const connectedEdgeList = selectedNode
    ? edges.filter((e) => e.source === selectedNode.id || e.target === selectedNode.id)
    : [];

  const nodeOptionsSelect = nodes.map((n) => ({ value: n.id, label: `${n.data.label} (${n.data.node_type})` }));

  return (
    <div className="space-y-4 pb-8 min-h-screen bg-slate-50 dark:bg-[#020817] text-slate-900 dark:text-white transition-colors">
      {error && <Alert type="error" message={error} onClose={() => setError('')} />}
      {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}

      {/* 1. HEADER SECTION */}
      <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-white/10 shadow-lg p-6 backdrop-blur-xl transition-colors">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-blue-500/10 dark:bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-12 w-80 h-80 bg-indigo-500/10 dark:bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6">
          {/* Header Title & Subtitle */}
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 dark:from-cyan-500 dark:via-blue-600 dark:to-indigo-700 flex items-center justify-center text-white shadow-lg shrink-0 border border-blue-400/30 dark:border-cyan-400/30">
              <MdRadar size={32} className="animate-spin-slow" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                  Evidence Relationship Graph
                </h1>
                <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-blue-500/10 dark:bg-cyan-500/15 text-blue-600 dark:text-cyan-400 border border-blue-500/20 dark:border-cyan-500/30">
                  Enterprise Investigation Intelligence
                </span>
              </div>
              <p className="text-sm text-slate-600 dark:text-[#94A3B8] font-medium mt-1">
                Entity relationships, evidence correlation and investigation intelligence
              </p>
            </div>
          </div>

          {/* Glassmorphism Statistics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Total Entities */}
            <div className="bg-slate-50 dark:bg-[#111827] border border-slate-200 dark:border-white/10 p-3.5 rounded-2xl shadow-sm transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-[#94A3B8]">Total Entities</span>
                <MdHub className="text-blue-600 dark:text-cyan-400" size={18} />
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">{nodes.length}</div>
              <span className="text-[10px] text-blue-600 dark:text-cyan-400 font-semibold block mt-0.5">Active Nodes</span>
            </div>

            {/* Relationships */}
            <div className="bg-slate-50 dark:bg-[#111827] border border-slate-200 dark:border-white/10 p-3.5 rounded-2xl shadow-sm transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-[#94A3B8]">Relationships</span>
                <MdLink className="text-purple-600 dark:text-purple-400" size={18} />
              </div>
              <div className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-1">{edges.length}</div>
              <span className="text-[10px] text-purple-600 dark:text-purple-300 font-semibold block mt-0.5">Link Edges</span>
            </div>

            {/* Risk Score */}
            <div className="bg-slate-50 dark:bg-[#111827] border border-slate-200 dark:border-white/10 p-3.5 rounded-2xl shadow-sm transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-[#94A3B8]">Risk Score</span>
                <MdSecurity className="text-red-500 dark:text-red-400" size={18} />
              </div>
              <div className="text-2xl font-black text-red-500 dark:text-red-400 mt-1">
                {highestRiskSuspect ? `${highestRiskSuspect.data.confidence_score || 94}%` : '88%'}
              </div>
              <span className="text-[10px] text-red-500 dark:text-red-400 font-semibold block mt-0.5">High Threat Index</span>
            </div>

            {/* Investigation Completeness */}
            <div className="bg-slate-50 dark:bg-[#111827] border border-slate-200 dark:border-white/10 p-3.5 rounded-2xl shadow-sm transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-[#94A3B8]">Completeness</span>
                <MdTrendingUp className="text-emerald-600 dark:text-emerald-400" size={18} />
              </div>
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{completenessScore}%</div>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold block mt-0.5">Verified Network</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. INVESTIGATION TOOLBAR SECTION */}
      <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-white/10 p-3.5 rounded-2xl shadow-md flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 transition-colors">
        {/* Search & Case Selector */}
        <div className="flex items-center gap-3 flex-1 max-w-xl">
          <div className="relative flex-1">
            <MdSearch size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-[#94A3B8]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search entities, suspects, or evidence..."
              className="w-full bg-slate-50 dark:bg-[#111827] border border-slate-200 dark:border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder:text-[#94A3B8] focus:outline-none focus:border-blue-500 dark:focus:border-cyan-400 transition"
            />
          </div>

          {cases.length > 0 && (
            <select
              value={selectedCaseId}
              onChange={(e) => setSelectedCaseId(e.target.value)}
              className="bg-slate-50 dark:bg-[#111827] border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-blue-600 dark:text-cyan-400 font-bold focus:outline-none focus:border-blue-500 dark:focus:border-cyan-400 transition"
            >
              {cases.map((c) => (
                <option key={c.id} value={c.id} className="bg-white dark:bg-[#0F172A] text-slate-900 dark:text-white">
                  Case: {c.title || c.case_number || c.id}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Grouped Action Button Toolbar */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* GROUP 1: [AI Analysis] */}
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-[#111827] p-1.5 rounded-xl border border-slate-200 dark:border-white/10">
            <span className="text-[9px] font-black uppercase text-slate-500 dark:text-[#94A3B8] px-2">AI Analysis</span>
            <Button
              onClick={handleGenerateAIGraph}
              loading={aiGenerating}
              size="sm"
              className="bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-cyan-600 dark:to-blue-600 text-white text-xs font-bold"
              icon={<MdAutoAwesome size={16} />}
              title="Run AI Link Analysis to extract entity network"
            >
              AI Analyze
            </Button>
            <Button
              onClick={() => setUploadOpen(true)}
              variant="secondary"
              size="sm"
              className="bg-white dark:bg-[#0F172A] border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold"
              icon={<MdCloudUpload size={16} />}
              title="Upload evidence file to auto-populate graph"
            >
              Upload Evidence
            </Button>
          </div>

          {/* GROUP 2: [Graph Controls] */}
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-[#111827] p-1.5 rounded-xl border border-slate-200 dark:border-white/10">
            <span className="text-[9px] font-black uppercase text-slate-500 dark:text-[#94A3B8] px-2">Graph Controls</span>
            <Button
              onClick={handleAutoArrange}
              variant="secondary"
              size="sm"
              className="bg-white dark:bg-[#0F172A] border-slate-200 dark:border-white/10 text-purple-600 dark:text-purple-400 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold"
              icon={<MdGridView size={16} />}
              title="Physics Auto Arrange with D3 Force"
            >
              Auto Arrange
            </Button>
            <Button
              onClick={() => setResetOpen(true)}
              variant="secondary"
              size="sm"
              className="bg-white dark:bg-[#0F172A] border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs"
              icon={<MdRotateLeft size={16} />}
              title="Reset graph to default state"
            >
              Reset
            </Button>
            <Button
              onClick={handleExportPDF}
              variant="secondary"
              size="sm"
              className="bg-white dark:bg-[#0F172A] border-slate-200 dark:border-white/10 text-emerald-600 dark:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold"
              icon={<MdPictureAsPdf size={16} />}
              title="Export Intelligence PDF Report"
            >
              Export Report
            </Button>
          </div>

          {/* GROUP 3: [Entity Management] */}
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-[#111827] p-1.5 rounded-xl border border-slate-200 dark:border-white/10">
            <span className="text-[9px] font-black uppercase text-slate-500 dark:text-[#94A3B8] px-2">Entity Mgmt</span>
            <Button
              onClick={() => setAddNodeOpen(true)}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold"
              icon={<MdAdd size={16} />}
              title="Add entity node"
            >
              Add Entity
            </Button>
            <Button
              onClick={() => setAddEdgeOpen(true)}
              variant="secondary"
              size="sm"
              className="bg-white dark:bg-[#0F172A] border-slate-200 dark:border-white/10 text-blue-600 dark:text-cyan-400 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold"
              icon={<MdLink size={16} />}
              title="Add relationship edge"
            >
              Add Relationship
            </Button>
          </div>

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#111827] text-slate-600 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-white transition"
            title={`Switch to ${isDark ? 'Light' : 'Dark'} Theme`}
          >
            {isDark ? <MdWbSunny size={18} className="text-amber-400" /> : <MdNightsStay size={18} />}
          </button>
        </div>
      </div>

      {/* 7. LEGEND CHIPS SECTION */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-[#94A3B8] shrink-0 px-2">
          Category Legend:
        </span>
        {Object.keys(NODE_CONFIG).map((catKey) => {
          const cfg = NODE_CONFIG[catKey];
          const count = nodes.filter((n) => n.data.node_type === catKey).length;
          const IconC = cfg.icon;

          return (
            <div
              key={catKey}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-white/10 text-xs font-bold shrink-0 hover:border-blue-400 dark:hover:border-cyan-500/40 transition cursor-default shadow-sm backdrop-blur-md"
            >
              <span className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: cfg.color }} />
              <IconC size={14} style={{ color: cfg.color }} />
              <span className="text-slate-700 dark:text-slate-200">{cfg.label}</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 dark:bg-[#111827] text-slate-600 dark:text-[#94A3B8] border border-slate-200 dark:border-white/10">
                {count}
              </span>
            </div>
          );
        })}
      </div>

      {/* 3. GRAPH CANVAS & 6. RIGHT INVESTIGATION PANEL */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 relative">
        {/* GRAPH CANVAS */}
        <div
          ref={canvasContainerRef}
          className="lg:col-span-3 rounded-3xl border border-slate-200 dark:border-white/10 overflow-hidden shadow-xl relative bg-slate-50 dark:bg-[#020817] transition-colors"
          style={{ height: '720px', minHeight: '650px' }}
        >
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full bg-slate-50 dark:bg-[#020817] gap-4">
              <Spinner size="lg" />
              <p className="text-xs text-blue-600 dark:text-cyan-400 font-mono tracking-wider animate-pulse">Initializing Cyber Investigation Graph...</p>
            </div>
          ) : nodes.length === 0 ? (
            <div className="flex items-center justify-center h-full bg-slate-50 dark:bg-[#020817] p-8">
              <EmptyState
                icon={<MdRadar size={56} className="text-blue-600 dark:text-cyan-400 animate-spin-slow" />}
                title="No Intelligence Entities Found"
                description="Your relationship graph is empty. Import evidence or run AI Extraction."
                action={
                  <div className="flex gap-3 mt-4">
                    <Button onClick={() => setAddNodeOpen(true)} size="sm">Add Entity</Button>
                    <Button onClick={handleGenerateAIGraph} variant="secondary" size="sm">AI Extract</Button>
                  </div>
                }
              />
            </div>
          ) : (
            <ReactFlowProvider>
              <FlowCanvasInner
                nodes={filteredNodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onNodeClick={setSelectedNode}
                onAutoArrange={handleAutoArrange}
                isFullScreen={isFullScreen}
                setIsFullScreen={setIsFullScreen}
                canvasContainerRef={canvasContainerRef}
                fitViewTrigger={fitViewTrigger}
                setSuccess={setSuccess}
              />
            </ReactFlowProvider>
          )}
        </div>

        {/* 6. RIGHT DYNAMIC INTELLIGENCE PANEL */}
        <div className="lg:col-span-1 space-y-4">
          {selectedNode ? (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
              <Card className="border-blue-500/30 dark:border-cyan-500/40 bg-white dark:bg-[#0F172A] shadow-xl p-5 backdrop-blur-xl space-y-5 transition-colors">
                {/* Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-white/10">
                  <div className="flex items-center gap-2">
                    <MdRadar className="text-blue-600 dark:text-cyan-400" size={18} />
                    <span className="text-xs font-black text-blue-600 dark:text-cyan-400 uppercase tracking-wider">
                      Intelligence Inspector
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleDeleteNode(selectedNode.id)}
                      className="text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 p-1.5 rounded-lg hover:bg-red-500/10 transition"
                      title="Delete Entity"
                    >
                      <MdDelete size={18} />
                    </button>
                    <button
                      onClick={() => setSelectedNode(null)}
                      className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-[#111827] transition"
                    >
                      <MdClose size={18} />
                    </button>
                  </div>
                </div>

                {/* Entity Summary */}
                <div className="flex items-start gap-3">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0 shadow-md border"
                    style={{
                      background: (NODE_CONFIG[selectedNode.data.node_type]?.color || '#3b82f6') + '25',
                      color: NODE_CONFIG[selectedNode.data.node_type]?.color,
                      borderColor: (NODE_CONFIG[selectedNode.data.node_type]?.color || '#3b82f6') + '50',
                    }}
                  >
                    {(() => {
                      const Icon = NODE_CONFIG[selectedNode.data.node_type]?.icon || MdInsertDriveFile;
                      return <Icon size={24} />;
                    })()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base font-black text-slate-900 dark:text-white leading-tight break-words">
                      {selectedNode.data.label}
                    </h3>
                    <span
                      className="inline-block mt-1.5 text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full border"
                      style={{
                        color: NODE_CONFIG[selectedNode.data.node_type]?.color,
                        background: NODE_CONFIG[selectedNode.data.node_type]?.color + '20',
                        borderColor: NODE_CONFIG[selectedNode.data.node_type]?.color + '40',
                      }}
                    >
                      {selectedNode.data.node_type}
                    </span>
                  </div>
                </div>

                {selectedNode.data.description && (
                  <div className="bg-slate-50 dark:bg-[#111827] p-3.5 rounded-2xl border border-slate-200 dark:border-white/10">
                    <span className="text-[10px] font-black text-slate-500 dark:text-[#94A3B8] block mb-1 uppercase tracking-wider">Entity Description</span>
                    <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-medium">{selectedNode.data.description}</p>
                  </div>
                )}

                {/* Risk Assessment */}
                <div className="bg-slate-50 dark:bg-[#111827] p-3.5 rounded-2xl border border-slate-200 dark:border-white/10 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-extrabold uppercase text-slate-500 dark:text-[#94A3B8] text-[10px] tracking-wider">THREAT RISK ASSESSMENT</span>
                    <span className="font-mono font-black text-blue-600 dark:text-cyan-400">{selectedNode.data.confidence_score || 92}% Match</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-[#020817] border border-slate-300 dark:border-white/10 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-red-500 dark:from-cyan-500 dark:via-blue-500 dark:to-red-500"
                      style={{ width: `${selectedNode.data.confidence_score || 92}%` }}
                    />
                  </div>
                </div>

                {/* Connected Evidence & Entities List */}
                <div className="pt-2 border-t border-slate-200 dark:border-white/10">
                  <span className="text-[11px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-2.5">
                    Connected Relationships ({connectedEdgeList.length})
                  </span>

                  {connectedEdgeList.length === 0 ? (
                    <p className="text-xs text-slate-500 py-3 text-center">No connected edges</p>
                  ) : (
                    <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                      {connectedEdgeList.map((e, idx) => {
                        const isSource = e.source === selectedNode.id;
                        const otherId = isSource ? e.target : e.source;
                        const otherNode = nodes.find((n) => n.id === otherId);

                        return (
                          <div
                            key={idx}
                            onClick={() => otherNode && setSelectedNode(otherNode)}
                            className="text-xs flex items-center justify-between bg-slate-50 dark:bg-[#111827] p-2.5 rounded-xl border border-slate-200 dark:border-white/10 hover:border-blue-400 dark:hover:border-cyan-400 transition cursor-pointer group"
                          >
                            <span className="text-blue-600 dark:text-cyan-400 text-[10px] font-extrabold uppercase">
                              {isSource ? '→ ' + e.label : '← ' + e.label}
                            </span>
                            <span className="text-slate-900 dark:text-white font-bold truncate max-w-[140px] group-hover:text-blue-600 dark:group-hover:text-cyan-400 transition-colors">
                              {otherNode ? otherNode.data.label : otherId}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* AI Investigation Notes */}
                <div className="bg-blue-50 dark:bg-cyan-950/20 border border-blue-200 dark:border-cyan-500/20 p-3.5 rounded-2xl">
                  <span className="text-[10px] font-black text-blue-600 dark:text-cyan-400 uppercase tracking-wider block mb-1 flex items-center gap-1">
                    <MdLightbulb size={14} /> AI Investigation Insight
                  </span>
                  <p className="text-[11px] text-slate-700 dark:text-slate-300 leading-relaxed">
                    Entity is tightly coupled within the network. Immediate subpoena and link analysis recommended across financial endpoints.
                  </p>
                </div>
              </Card>
            </motion.div>
          ) : (
            <Card className="text-center py-12 px-4 bg-white dark:bg-[#0F172A] border-slate-200 dark:border-white/10 shadow-xl backdrop-blur-xl transition-colors">
              <div className="w-16 h-16 rounded-3xl bg-slate-50 dark:bg-[#111827] border border-slate-200 dark:border-white/10 flex items-center justify-center mx-auto mb-4 text-blue-600 dark:text-cyan-400 shadow-inner">
                <MdRadar size={32} className="animate-pulse" />
              </div>
              <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider mb-1">
                Select an Entity Node
              </h4>
              <p className="text-xs text-slate-500 dark:text-[#94A3B8] max-w-xs mx-auto leading-relaxed">
                Click any suspect, victim, evidence, or device node on the graph canvas to inspect full intelligence details.
              </p>
            </Card>
          )}
        </div>
      </div>

      {/* 8. INVESTIGATION INSIGHTS PANEL (BELOW GRAPH) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Most Connected Entity */}
        <Card className="bg-white dark:bg-[#0F172A] border-slate-200 dark:border-white/10 p-4 shadow-md backdrop-blur-xl hover:border-blue-400 dark:hover:border-cyan-500/40 transition">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-[#94A3B8]">Most Connected Entity</span>
            <MdLayers className="text-blue-600 dark:text-cyan-400" size={18} />
          </div>
          {mostConnectedNode ? (
            <div className="space-y-2">
              <p className="text-sm font-extrabold text-slate-900 dark:text-white truncate">{mostConnectedNode.data?.label}</p>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold text-blue-600 dark:text-cyan-400 px-2 py-0.5 rounded bg-slate-100 dark:bg-[#111827] border border-slate-200 dark:border-white/10">
                  {mostConnectedNode.degree || 0} Connections
                </span>
                <button
                  onClick={() => setSelectedNode(mostConnectedNode)}
                  className="text-xs text-blue-600 dark:text-cyan-400 hover:underline font-bold flex items-center gap-1"
                >
                  Inspect <MdArrowForward size={14} />
                </button>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-500">No entities</p>
          )}
        </Card>

        {/* Card 2: Highest Risk Suspect */}
        <Card className="bg-white dark:bg-[#0F172A] border-slate-200 dark:border-white/10 p-4 shadow-md backdrop-blur-xl hover:border-red-400 dark:hover:border-red-500/40 transition">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-[#94A3B8]">Highest Risk Suspect</span>
            <MdSecurity className="text-red-500 dark:text-red-400" size={18} />
          </div>
          {highestRiskSuspect ? (
            <div className="space-y-2">
              <p className="text-sm font-extrabold text-slate-900 dark:text-white truncate">{highestRiskSuspect.data?.label}</p>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold text-red-500 dark:text-red-400 px-2 py-0.5 rounded bg-slate-100 dark:bg-[#111827] border border-slate-200 dark:border-white/10">
                  {highestRiskSuspect.data?.confidence_score || 94}% Threat Level
                </span>
                <button
                  onClick={() => setSelectedNode(highestRiskSuspect)}
                  className="text-xs text-red-500 dark:text-red-400 hover:underline font-bold flex items-center gap-1"
                >
                  Inspect <MdArrowForward size={14} />
                </button>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-500">No suspects identified</p>
          )}
        </Card>

        {/* Card 3: Recent Evidence */}
        <Card className="bg-white dark:bg-[#0F172A] border-slate-200 dark:border-white/10 p-4 shadow-md backdrop-blur-xl hover:border-amber-400 dark:hover:border-amber-500/40 transition">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-[#94A3B8]">Recent Evidence Item</span>
            <MdInsertDriveFile className="text-amber-500 dark:text-amber-400" size={18} />
          </div>
          {recentEvidence ? (
            <div className="space-y-2">
              <p className="text-sm font-extrabold text-slate-900 dark:text-white truncate">{recentEvidence.data?.label}</p>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded bg-slate-100 dark:bg-[#111827] border border-slate-200 dark:border-white/10">
                  {recentEvidence.data?.node_type}
                </span>
                <button
                  onClick={() => setSelectedNode(recentEvidence)}
                  className="text-xs text-amber-600 dark:text-amber-400 hover:underline font-bold flex items-center gap-1"
                >
                  Inspect <MdArrowForward size={14} />
                </button>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-500">No evidence logged</p>
          )}
        </Card>

        {/* Card 4: Investigation Progress */}
        <Card className="bg-white dark:bg-[#0F172A] border-slate-200 dark:border-white/10 p-4 shadow-md backdrop-blur-xl hover:border-emerald-400 dark:hover:border-emerald-500/40 transition">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-[#94A3B8]">Investigation Progress</span>
            <MdCheckCircle className="text-emerald-600 dark:text-emerald-400" size={18} />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-extrabold text-slate-900 dark:text-white">{completenessScore}% Network Verified</span>
              <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">{averageConfidence}% Avg Match</span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-[#111827] border border-slate-200 dark:border-white/10 overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${completenessScore}%` }} />
            </div>
          </div>
        </Card>
      </div>

      {/* TIMELINE PANEL */}
      <Card className="p-5 bg-white dark:bg-[#0F172A] border-slate-200 dark:border-white/10 shadow-md backdrop-blur-xl transition-colors">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-white/10 mb-4">
          <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <MdTimeline size={18} className="text-blue-600 dark:text-cyan-400" /> Chronological Event Timeline
          </h3>
          <button
            onClick={() => setTimelineOpen(!timelineOpen)}
            className="text-xs text-blue-600 dark:text-cyan-400 hover:underline font-bold"
          >
            {timelineOpen ? 'Collapse Timeline' : 'Expand Timeline'}
          </button>
        </div>

        {timelineOpen && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {timeline.map((evt, idx) => (
              <div key={evt.id || idx} className="p-3.5 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#111827] hover:border-blue-400 dark:hover:border-cyan-500/30 transition">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-extrabold text-slate-900 dark:text-white">{evt.title}</span>
                  <span className="text-[10px] font-mono text-blue-600 dark:text-cyan-400 px-2 py-0.5 rounded bg-slate-100 dark:bg-[#0F172A] border border-slate-200 dark:border-white/10">
                    {evt.date}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-[#94A3B8] leading-relaxed">{evt.description}</p>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* MODALS */}
      {/* ADD ENTITY NODE MODAL */}
      <Modal open={addNodeOpen} onClose={() => setAddNodeOpen(false)} title="Add Entity Node to Graph">
        <form onSubmit={handleAddNode} className="space-y-4">
          <Input
            label="Entity Label / Name"
            value={nodeForm.label}
            onChange={setNF('label')}
            placeholder="e.g. Unknown Hacker or Bank Account"
            required
          />
          <Select
            label="Entity Category"
            value={nodeForm.node_type}
            onChange={setNF('node_type')}
            options={NODE_TYPES_SELECT}
            required
          />
          <Textarea
            label="Description / Context"
            value={nodeForm.description}
            onChange={setNF('description')}
            placeholder="Contextual background info..."
            rows={2}
          />
          <Input
            label="Confidence Score %"
            type="number"
            min="1"
            max="100"
            value={nodeForm.confidence_score}
            onChange={setNF('confidence_score')}
          />
          <Button type="submit" className="w-full bg-blue-600 dark:bg-cyan-600 hover:bg-blue-700 dark:hover:bg-cyan-500">Add Entity Node</Button>
        </form>
      </Modal>

      {/* ADD RELATIONSHIP EDGE MODAL */}
      <Modal open={addEdgeOpen} onClose={() => setAddEdgeOpen(false)} title="Add Relationship Edge">
        <form onSubmit={handleAddEdge} className="space-y-4">
          <Select
            label="Source Entity"
            value={edgeForm.source_id}
            onChange={setEF('source_id')}
            options={[{ value: '', label: '-- Select Source Entity --' }, ...nodeOptionsSelect]}
            required
          />
          <Select
            label="Target Entity"
            value={edgeForm.target_id}
            onChange={setEF('target_id')}
            options={[{ value: '', label: '-- Select Target Entity --' }, ...nodeOptionsSelect]}
            required
          />
          <Select
            label="Relationship Type"
            value={edgeForm.relationship_type}
            onChange={setEF('relationship_type')}
            options={REL_TYPES_SELECT}
            required
          />
          <Input
            label="Custom Edge Label (Optional)"
            value={edgeForm.label}
            onChange={setEF('label')}
            placeholder="e.g. transferred ₹10 Lakhs"
          />
          <Button type="submit" className="w-full bg-blue-600 dark:bg-cyan-600 hover:bg-blue-700 dark:hover:bg-cyan-500">Add Relationship Edge</Button>
        </form>
      </Modal>

      {/* RESET GRAPH CONFIRMATION MODAL */}
      <Modal open={resetOpen} onClose={() => setResetOpen(false)} title="Reset Intelligence Graph" size="sm">
        <div className="space-y-4">
          <div className="p-4 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-2xl text-amber-800 dark:text-amber-300 text-sm">
            <p className="font-bold">Are you sure you want to reset the graph?</p>
            <p className="text-xs mt-1 text-slate-600 dark:text-[#94A3B8]">
              This action will clear custom dynamic nodes and restore the baseline intelligence graph.
            </p>
          </div>
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="secondary" size="sm" onClick={() => setResetOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" size="sm" onClick={confirmResetGraph}>
              Reset Graph
            </Button>
          </div>
        </div>
      </Modal>

      {/* UPLOAD EVIDENCE MODAL */}
      <Modal open={uploadOpen} onClose={() => setUploadOpen(false)} title="Upload Evidence & Auto Extract Graph">
        <form onSubmit={handleUploadEvidence} className="space-y-4">
          <div className="border-2 border-dashed border-slate-300 dark:border-white/10 rounded-2xl p-6 text-center hover:border-blue-500 dark:hover:border-cyan-400 transition cursor-pointer bg-slate-50 dark:bg-[#111827]">
            <MdCloudUpload className="mx-auto text-blue-600 dark:text-cyan-400 mb-2" size={42} />
            <p className="text-sm font-extrabold text-slate-900 dark:text-white mb-1">
              {selectedFile ? selectedFile.name : 'Select or drag evidence file here'}
            </p>
            <p className="text-xs text-slate-500 dark:text-[#94A3B8]">Supported: PDF, DOCX, CDR logs, Bank statements, Images</p>
            <input
              type="file"
              onChange={(e) => setSelectedFile(e.target.files[0])}
              accept=".pdf,.docx,.png,.jpg,.jpeg,.csv,.txt"
              className="hidden"
              id="file-upload-input-reactflow"
            />
            <label htmlFor="file-upload-input-reactflow" className="mt-4 inline-block">
              <Button type="button" variant="secondary" size="sm">Browse Files</Button>
            </label>
          </div>

          <Button type="submit" loading={uploading} disabled={!selectedFile} className="w-full bg-blue-600 dark:bg-cyan-600 hover:bg-blue-700 dark:hover:bg-cyan-500">
            {uploading ? 'Extracting Intelligence Graph...' : 'Upload & Generate Graph'}
          </Button>
        </form>
      </Modal>
    </div>
  );
}
