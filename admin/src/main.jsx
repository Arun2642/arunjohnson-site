import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  addEdge,
  Background,
  Controls,
  Handle,
  MarkerType,
  MiniMap,
  Panel,
  Position,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState
} from '@xyflow/react';
import dagre from 'dagre';
import '@xyflow/react/dist/style.css';
import './styles.css';

const PASSWORD_KEY = 'qna-admin-password';
const THEME_KEY = 'qna-admin-theme';
const NODE_WIDTH = 280;
const NODE_HEIGHT = 150;

function GraphNode({ data, selected }) {
  return (
    <div className={`graph-node graph-node-${data.type} ${selected ? 'is-selected' : ''}`}>
      <Handle type="target" position={Position.Left} />
      <div className="node-kicker">{data.type === 'question' ? `Question ${data.label || ''}` : 'Blurb'}</div>
      <div className="node-body">{data.preview}</div>
      <Handle type="source" position={Position.Right} />
    </div>
  );
}

const nodeTypes = { graphNode: GraphNode };

function api(password, path, options = {}) {
  return fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-Admin-Password': password,
      ...(options.headers || {})
    }
  }).then(async (response) => {
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(body.error || `Request failed: ${response.status}`);
    }
    return body;
  });
}

function previewForNode(node) {
  if (node.type === 'question') {
    return node.text || 'Untitled question';
  }
  return (node.paragraphs || []).join('\n\n') || 'Empty blurb';
}

function toFlowNode(node, layout) {
  const position = layout.get(node._id) || { x: 100, y: 100 };
  return {
    id: node._id,
    type: 'graphNode',
    position,
    data: {
      ...node,
      preview: previewForNode(node)
    }
  };
}

function toFlowEdge(edge) {
  return {
    id: edge._id,
    source: edge.fromNodeId,
    target: edge.toNodeId,
    label: edge.kind === 'shows_question' ? 'asks' : 'answers',
    type: 'smoothstep',
    markerEnd: { type: MarkerType.ArrowClosed },
    data: edge
  };
}

function layoutNodes(nodes, edges, selectedIds) {
  const graph = new dagre.graphlib.Graph();
  graph.setDefaultEdgeLabel(() => ({}));
  graph.setGraph({ rankdir: 'LR', nodesep: 70, ranksep: 130 });

  const selected = selectedIds.size ? selectedIds : new Set(nodes.map((node) => node.id));
  nodes.forEach((node) => {
    if (selected.has(node.id)) {
      graph.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
    }
  });
  edges.forEach((edge) => {
    if (selected.has(edge.source) && selected.has(edge.target)) {
      graph.setEdge(edge.source, edge.target);
    }
  });

  dagre.layout(graph);

  return nodes.map((node) => {
    if (!selected.has(node.id)) {
      return node;
    }
    const point = graph.node(node.id);
    return {
      ...node,
      position: {
        x: point.x - NODE_WIDTH / 2,
        y: point.y - NODE_HEIGHT / 2
      }
    };
  });
}

function Editor() {
  const [password, setPassword] = useState(() => sessionStorage.getItem(PASSWORD_KEY) || '');
  const [passwordDraft, setPasswordDraft] = useState('');
  const [theme, setTheme] = useState(() => localStorage.getItem(THEME_KEY) || 'dark');
  const [isAuthed, setIsAuthed] = useState(Boolean(password));
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [status, setStatus] = useState('');
  const [menu, setMenu] = useState(null);
  const [editing, setEditing] = useState(null);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  const selectedNodeIds = useMemo(() => new Set(nodes.filter((node) => node.selected).map((node) => node.id)), [nodes]);
  const selectedEdgeIds = useMemo(() => new Set(edges.filter((edge) => edge.selected).map((edge) => edge.id)), [edges]);
  const connectedIds = useMemo(() => {
    const selected = [...selectedNodeIds];
    const ids = new Set(selected);
    edges.forEach((edge) => {
      if (selected.includes(edge.source) || selected.includes(edge.target)) {
        ids.add(edge.source);
        ids.add(edge.target);
      }
    });
    return ids;
  }, [edges, selectedNodeIds]);

  const decoratedNodes = useMemo(() => {
    if (!selectedNodeIds.size) {
      return nodes;
    }
    return nodes.map((node) => ({
      ...node,
      className: connectedIds.has(node.id) ? 'is-connected' : 'is-faded'
    }));
  }, [connectedIds, nodes, selectedNodeIds]);

  const decoratedEdges = useMemo(() => {
    if (!selectedNodeIds.size) {
      return edges;
    }
    return edges.map((edge) => ({
      ...edge,
      className: selectedNodeIds.has(edge.source) || selectedNodeIds.has(edge.target) ? 'is-connected-edge' : 'is-faded-edge',
      animated: selectedNodeIds.has(edge.source) || selectedNodeIds.has(edge.target)
    }));
  }, [edges, selectedNodeIds]);

  const loadGraph = useCallback(async () => {
    setStatus('Loading graph...');
    const graph = await api(password, '/api/admin/graph');
    const layout = new Map((graph.layout || []).map((item) => [item.nodeId, { x: item.x, y: item.y }]));
    setNodes(graph.nodes.map((node) => toFlowNode(node, layout)));
    setEdges(graph.edges.map(toFlowEdge));
    setStatus('');
  }, [password, setEdges, setNodes]);

  useEffect(() => {
    if (!isAuthed) {
      return;
    }
    loadGraph().catch((error) => {
      setStatus(error.message);
      sessionStorage.removeItem(PASSWORD_KEY);
      setIsAuthed(false);
    });
  }, [isAuthed, loadGraph]);

  async function savePositions(nextNodes = nodes) {
    await api(password, '/api/admin/layout', {
      method: 'PUT',
      body: JSON.stringify({
        positions: nextNodes.map((node) => ({ nodeId: node.id, x: node.position.x, y: node.position.y }))
      })
    });
  }

  async function createNode(type, point) {
    const body = {
      type,
      text: type === 'question' ? 'New question?' : '',
      paragraphs: type === 'blurb' ? ['New blurb'] : [],
      x: point.x,
      y: point.y
    };
    const created = await api(password, '/api/admin/nodes', { method: 'POST', body: JSON.stringify(body) });
    setNodes((items) => [...items, toFlowNode(created, new Map([[created._id, point]]))]);
    setMenu(null);
  }

  async function updateNode(form) {
    const body = editing.data.type === 'question'
      ? { text: form.text.value }
      : { paragraphs: form.paragraphs.value.split(/\n\s*\n/).map((item) => item.trim()).filter(Boolean) };
    const updated = await api(password, `/api/admin/nodes/${editing.id}`, { method: 'PATCH', body: JSON.stringify(body) });
    setNodes((items) => items.map((node) => (node.id === updated._id ? { ...node, data: { ...updated, preview: previewForNode(updated) } } : node)));
    setEditing(null);
  }

  async function deleteSelection() {
    for (const edgeId of selectedEdgeIds) {
      await api(password, `/api/admin/edges/${edgeId}`, { method: 'DELETE' });
    }
    for (const nodeId of selectedNodeIds) {
      await api(password, `/api/admin/nodes/${nodeId}`, { method: 'DELETE' });
    }
    setEdges((items) => items.filter((edge) => !selectedEdgeIds.has(edge.id) && !selectedNodeIds.has(edge.source) && !selectedNodeIds.has(edge.target)));
    setNodes((items) => items.filter((node) => !selectedNodeIds.has(node.id)));
  }

  async function deleteNode(nodeId) {
    await api(password, `/api/admin/nodes/${nodeId}`, { method: 'DELETE' });
    setEdges((items) => items.filter((edge) => edge.source !== nodeId && edge.target !== nodeId));
    setNodes((items) => items.filter((node) => node.id !== nodeId));
    setMenu(null);
  }

  async function deleteEdge(edgeId) {
    await api(password, `/api/admin/edges/${edgeId}`, { method: 'DELETE' });
    setEdges((items) => items.filter((edge) => edge.id !== edgeId));
    setMenu(null);
  }

  const onConnect = useCallback(async (connection) => {
    const source = nodes.find((node) => node.id === connection.source);
    const target = nodes.find((node) => node.id === connection.target);
    if (!source || !target) {
      return;
    }

    const kind = source.data.type === 'blurb' && target.data.type === 'question'
      ? 'shows_question'
      : source.data.type === 'question' && target.data.type === 'blurb'
        ? 'answers_with'
        : null;

    if (!kind) {
      setStatus('Connections must be blurb -> question or question -> blurb.');
      return;
    }

    const created = await api(password, '/api/admin/edges', {
      method: 'POST',
      body: JSON.stringify({ fromNodeId: connection.source, toNodeId: connection.target, kind })
    });
    setEdges((items) => addEdge(toFlowEdge(created), items));
    setStatus('');
  }, [nodes, password, setEdges]);

  function onPaneContextMenu(event) {
    event.preventDefault();
    if (!reactFlowInstance) {
      return;
    }
    const point = reactFlowInstance.screenToFlowPosition({ x: event.clientX, y: event.clientY });
    setMenu({ type: 'pane', screenX: event.clientX, screenY: event.clientY, point });
  }

  function onNodeContextMenu(event, node) {
    event.preventDefault();
    setMenu({ type: 'node', screenX: event.clientX, screenY: event.clientY, node });
  }

  function onEdgeContextMenu(event, edge) {
    event.preventDefault();
    setMenu({ type: 'edge', screenX: event.clientX, screenY: event.clientY, edge });
  }

  async function autoOrganize() {
    const next = layoutNodes(nodes, edges, selectedNodeIds);
    setNodes(next);
    await savePositions(next);
  }

  useEffect(() => {
    function onKeyDown(event) {
      if (event.key !== 'Delete' && event.key !== 'Backspace') {
        return;
      }
      const active = document.activeElement;
      if (active && ['INPUT', 'TEXTAREA'].includes(active.tagName)) {
        return;
      }
      if (selectedNodeIds.size || selectedEdgeIds.size) {
        deleteSelection().catch((error) => setStatus(error.message));
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedEdgeIds, selectedNodeIds]);

  function insertSnippet(fieldName, snippet) {
    const field = document.querySelector(`[name="${fieldName}"]`);
    if (!field) {
      return;
    }

    const start = field.selectionStart;
    const end = field.selectionEnd;
    field.value = `${field.value.slice(0, start)}${snippet}${field.value.slice(end)}`;
    field.focus();
    field.setSelectionRange(start + snippet.length, start + snippet.length);
  }

  if (!isAuthed) {
    return (
      <main className="login-shell">
        <form
          className="login-panel"
          onSubmit={(event) => {
            event.preventDefault();
            sessionStorage.setItem(PASSWORD_KEY, passwordDraft);
            setPassword(passwordDraft);
            setIsAuthed(true);
          }}
        >
          <h1>Q&A Flow Admin</h1>
          <label htmlFor="password">Password</label>
          <input id="password" type="password" value={passwordDraft} onChange={(event) => setPasswordDraft(event.target.value)} autoFocus />
          <button type="submit">Enter</button>
          <p>{status || 'Local default is admin unless ADMIN_PASSWORD is set.'}</p>
        </form>
      </main>
    );
  }

  return (
    <main className="admin-shell">
      <ReactFlowProvider>
        <ReactFlow
          nodes={decoratedNodes}
          edges={decoratedEdges}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onInit={setReactFlowInstance}
          onPaneContextMenu={onPaneContextMenu}
          onNodeContextMenu={onNodeContextMenu}
          onEdgeContextMenu={onEdgeContextMenu}
          onPaneClick={() => setMenu(null)}
          onNodeDoubleClick={(_, node) => setEditing(node)}
          onNodeDragStop={() => savePositions().catch((error) => setStatus(error.message))}
          fitView
        >
          <Background color="#26364f" gap={22} />
          <Controls />
          <MiniMap pannable zoomable nodeColor={(node) => (node.data.type === 'question' ? '#4ea1ff' : '#16243a')} />
          <Panel position="top-left" className="toolbar">
            <button type="button" onClick={autoOrganize}>Auto-organize</button>
            <button type="button" onClick={loadGraph}>Reload</button>
            <button type="button" onClick={() => { sessionStorage.removeItem(PASSWORD_KEY); setIsAuthed(false); }}>Lock</button>
            <span>{status}</span>
          </Panel>
          <Panel position="top-right" className="theme-panel">
            <button
              type="button"
              className="theme-toggle"
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              onClick={() => setTheme((current) => (current === 'dark' ? 'light' : 'dark'))}
            >
              {theme === 'dark' ? 'Light' : 'Dark'}
            </button>
          </Panel>
        </ReactFlow>
      </ReactFlowProvider>

      {menu && (
        <div className="context-menu" style={{ left: menu.screenX, top: menu.screenY }}>
          {menu.type === 'pane' && (
            <>
              <button type="button" onClick={() => createNode('blurb', menu.point)}>Create blurb</button>
              <button type="button" onClick={() => createNode('question', menu.point)}>Create question</button>
            </>
          )}
          {menu.type === 'node' && (
            <>
              <button type="button" onClick={() => { setEditing(menu.node); setMenu(null); }}>Edit</button>
              <button type="button" onClick={() => deleteNode(menu.node.id).catch((error) => setStatus(error.message))}>Delete</button>
            </>
          )}
          {menu.type === 'edge' && (
            <button type="button" onClick={() => deleteEdge(menu.edge.id).catch((error) => setStatus(error.message))}>Delete connection</button>
          )}
        </div>
      )}

      {editing && (
        <div className="modal-backdrop" onClick={() => setEditing(null)}>
          <form
            className="edit-modal"
            onClick={(event) => event.stopPropagation()}
            onSubmit={(event) => {
              event.preventDefault();
              updateNode(event.currentTarget).catch((error) => setStatus(error.message));
            }}
          >
            <h2>Edit {editing.data.type}</h2>
            {editing.data.type === 'question' ? (
              <>
                <label htmlFor="edit-text">Question</label>
                <textarea id="edit-text" name="text" defaultValue={editing.data.text || ''} rows={5} />
              </>
            ) : (
              <>
                <label htmlFor="edit-paragraphs">Paragraphs</label>
                <div className="insert-toolbar" aria-label="Insert content">
                  <button type="button" onClick={() => insertSnippet('paragraphs', '[link text](https://example.com)')}>Link</button>
                  <button type="button" onClick={() => insertSnippet('paragraphs', '![image description](https://example.com/image.jpg)')}>Image</button>
                </div>
                <textarea id="edit-paragraphs" name="paragraphs" defaultValue={(editing.data.paragraphs || []).join('\n\n')} rows={10} />
              </>
            )}
            <div className="modal-actions">
              <button type="button" onClick={() => setEditing(null)}>Cancel</button>
              <button type="submit">Save</button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
}

createRoot(document.getElementById('root')).render(<Editor />);
