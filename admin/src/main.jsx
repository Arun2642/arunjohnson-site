import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
      const error = new Error(body.error || `Request failed: ${response.status}`);
      error.status = response.status;
      throw error;
    }
    return body;
  });
}

function previewForNode(node) {
  if (node.type === 'question') {
    return node.text || 'Untitled question';
  }
  if (node.html) {
    const text = new DOMParser().parseFromString(node.html, 'text/html').body.textContent.trim();
    return text || 'Empty blurb';
  }
  return (node.paragraphs || []).join('\n\n') || 'Empty blurb';
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function escapeAttribute(value) {
  return escapeHtml(value).replaceAll('`', '&#096;');
}

function isSafeRichUrl(url) {
  return /^(https?:\/\/|mailto:|\/|\.\/|\.\.\/)/i.test(url);
}

function markdownToHtml(value) {
  const escaped = escapeHtml(value);
  return escaped
    .replace(/!\[([^\]]*)\]\(((?:https?:\/\/|\/|\.\/|\.\.\/)[^)]+)\)/gi, '<img src="$2" alt="$1">')
    .replace(/\[([^\]]+)\]\(((?:https?:\/\/|mailto:|\/|\.\/|\.\.\/)[^)]+)\)/gi, '<a href="$2">$1</a>')
    .replace(/\n/g, '<br>');
}

function htmlForNode(node) {
  if (node.html) {
    return node.html;
  }
  return (node.paragraphs || []).map((paragraph) => `<p>${markdownToHtml(paragraph)}</p>`).join('');
}

function RichBlurbEditor({ node, password, onSave, onCancel }) {
  const editorRef = useRef(null);
  const recognitionRef = useRef(null);
  const transcriptRef = useRef('');
  const stopRequestedRef = useRef(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [dictationState, setDictationState] = useState('idle');
  const [dictationNote, setDictationNote] = useState('');

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = htmlForNode(node);
    }
  }, [node]);

  useEffect(() => () => {
    if (recognitionRef.current) {
      recognitionRef.current.abort();
    }
  }, []);

  function runCommand(command, value = null) {
    editorRef.current?.focus();
    document.execCommand(command, false, value);
  }

  function insertLink() {
    const url = window.prompt('Link URL (https://..., mailto:, or a relative path)');
    if (!url || !isSafeRichUrl(url.trim())) {
      return;
    }

    const selection = window.getSelection();
    if (selection && !selection.isCollapsed) {
      runCommand('createLink', url.trim());
      return;
    }

    const label = window.prompt('Link text', url.trim()) || url.trim();
    runCommand('insertHTML', `<a href="${escapeAttribute(url.trim())}">${escapeHtml(label)}</a>`);
  }

  function insertImage() {
    const url = window.prompt('Image URL (https://..., or a relative path)');
    if (!url || !isSafeRichUrl(url.trim())) {
      return;
    }

    const alt = window.prompt('Image description', 'Q&A image') || 'Q&A image';
    runCommand('insertHTML', `<img src="${escapeAttribute(url.trim())}" alt="${escapeAttribute(alt)}">`);
  }

  async function polishText(text) {
    const transcript = text.trim();
    if (!transcript) {
      throw new Error('No dictated text was captured. Try again or use Windows dictation, then click Polish draft.');
    }

    setDictationState('polishing');
    setDictationNote('Asking local Codex Luna to polish the answer...');
    setError('');

    const response = await fetch('/api/admin/polish-dictation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-Password': password
      },
      body: JSON.stringify({ transcript })
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(result.error || `Dictation failed: ${response.status}`);
    }

    if (!result.html) {
      throw new Error('Codex Luna returned an empty answer.');
    }

    if (editorRef.current) {
      editorRef.current.innerHTML = result.html;
    }
    setDictationNote('Polished draft inserted. Review it, then save the answer.');
    setDictationState('idle');
  }

  async function startDictation() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      editorRef.current?.focus();
      setError('This browser does not expose speech recognition.');
      setDictationNote('Use Windows dictation: focus the editor, press Win+H, dictate, then click Polish draft.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    transcriptRef.current = '';
    stopRequestedRef.current = false;
    recognitionRef.current = recognition;

    recognition.onresult = (event) => {
      let interim = '';
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const phrase = event.results[index][0].transcript;
        if (event.results[index].isFinal) {
          transcriptRef.current += `${phrase} `;
        } else {
          interim += phrase;
        }
      }
      const preview = `${transcriptRef.current} ${interim}`.trim();
      setDictationNote(preview ? `Recording... ${preview}` : 'Recording... click Stop & polish when you are done.');
    };

    recognition.onerror = (event) => {
      if (event.error === 'aborted') {
        return;
      }
      stopRequestedRef.current = false;
      recognitionRef.current = null;
      setDictationState('idle');
      setError(`Dictation error: ${event.error || 'speech recognition failed'}.`);
    };

    recognition.onend = () => {
      recognitionRef.current = null;
      if (!stopRequestedRef.current) {
        setDictationState('idle');
        setDictationNote('Dictation ended. Click Dictate to try again.');
        return;
      }

      stopRequestedRef.current = false;
      polishText(transcriptRef.current).catch((dictationError) => {
        setDictationState('idle');
        setDictationNote('');
        setError(dictationError.message);
      });
    };

    try {
      recognition.start();
      setError('');
      setDictationNote('Recording... click Stop & polish when you are done.');
      setDictationState('recording');
    } catch (recordingError) {
      recognitionRef.current = null;
      setError(recordingError.message || 'Could not start browser dictation.');
    }
  }

  function stopDictation() {
    if (recognitionRef.current) {
      stopRequestedRef.current = true;
      setDictationState('polishing');
      recognitionRef.current.stop();
    }
  }

  function polishCurrentDraft() {
    polishText(editorRef.current?.innerText || '').catch((polishError) => {
      setDictationState('idle');
      setDictationNote('');
      setError(polishError.message);
    });
  }

  async function submit(event) {
    event.preventDefault();
    setIsSaving(true);
    setError('');
    try {
      await onSave(editorRef.current?.innerHTML.trim() || '');
    } catch (saveError) {
      setError(saveError.message);
      setIsSaving(false);
    }
  }

  return (
    <form className="edit-modal rich-edit-modal" onClick={(event) => event.stopPropagation()} onSubmit={submit}>
      <p className="modal-eyebrow">ANSWER</p>
      <h2>Edit answer</h2>
      <p className="rich-help">Format the answer directly. Dictate uses your browser's speech recognition; stopping it sends the text to the local Codex CLI. If unavailable, press Win+H while the editor is focused, then click Polish draft.</p>
      <div className="rich-toolbar" aria-label="Answer formatting">
        <button type="button" onClick={() => runCommand('bold')} title="Bold"><strong>B</strong></button>
        <button type="button" onClick={() => runCommand('italic')} title="Italic"><em>I</em></button>
        <button type="button" onClick={() => runCommand('underline')} title="Underline"><u>U</u></button>
        <button type="button" onClick={() => runCommand('formatBlock', 'h3')} title="Heading">H</button>
        <button type="button" onClick={() => runCommand('insertUnorderedList')} title="Bulleted list">&bull;</button>
        <button type="button" onClick={() => runCommand('insertOrderedList')} title="Numbered list">1.</button>
        <button type="button" onClick={insertLink} title="Add link">Link</button>
        <button type="button" onClick={insertImage} title="Add image">Image</button>
        {dictationState === 'recording' ? (
          <button type="button" className="dictation-button is-recording" onClick={stopDictation} title="Stop recording and polish with Codex Luna">Stop &amp; polish</button>
        ) : (
          <button type="button" className="dictation-button" onClick={startDictation} disabled={dictationState === 'polishing'} title="Dictate and polish with Codex Luna">
            <i className="fa-solid fa-microphone" aria-hidden="true"></i> Dictate
          </button>
        )}
        <button type="button" className="dictation-button polish-draft-button" onClick={polishCurrentDraft} disabled={dictationState !== 'idle'} title="Polish the text currently in the editor">Polish draft</button>
      </div>
      <div
        ref={editorRef}
        className="rich-editor"
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-label="Answer content"
        aria-multiline="true"
      />
      {dictationNote && <p className="dictation-note" role="status" aria-live="polite">{dictationNote}</p>}
      {error && <p className="rich-error" role="alert">{error}</p>}
      <div className="modal-actions">
        <button type="button" onClick={onCancel} disabled={isSaving || dictationState !== 'idle'}>Cancel</button>
        <button type="submit" disabled={isSaving || dictationState !== 'idle'}>{isSaving ? 'Saving...' : 'Save answer'}</button>
      </div>
    </form>
  );
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

  async function updateQuestion(form) {
    let updated;
    try {
      updated = await api(password, `/api/admin/nodes/${editing.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ text: form.text.value })
      });
    } catch (error) {
      if (error.status === 404) {
        await loadGraph();
        throw new Error('This node no longer exists. The graph was reloaded; reopen the current node and try again.');
      }
      throw error;
    }
    setNodes((items) => items.map((node) => (node.id === updated._id ? { ...node, data: { ...updated, preview: previewForNode(updated) } } : node)));
    setEditing(null);
  }

  async function updateBlurb(html) {
    let updated;
    try {
      updated = await api(password, `/api/admin/nodes/${editing.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ html })
      });
    } catch (error) {
      if (error.status === 404) {
        await loadGraph();
        throw new Error('This answer no longer exists. The graph was reloaded; reopen the current answer and try again.');
      }
      throw error;
    }
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
      if (editing) {
        return;
      }
      if (event.key !== 'Delete' && event.key !== 'Backspace') {
        return;
      }
      const active = document.activeElement;
      if (active && (['INPUT', 'TEXTAREA'].includes(active.tagName) || active.isContentEditable)) {
        return;
      }
      if (selectedNodeIds.size || selectedEdgeIds.size) {
        deleteSelection().catch((error) => setStatus(error.message));
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [editing, selectedEdgeIds, selectedNodeIds]);

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
          {editing.data.type === 'question' ? (
            <form
              className="edit-modal"
              onClick={(event) => event.stopPropagation()}
              onSubmit={(event) => {
                event.preventDefault();
                updateQuestion(event.currentTarget).catch((error) => setStatus(error.message));
              }}
            >
              <h2>Edit question</h2>
              <label htmlFor="edit-text">Question</label>
              <textarea id="edit-text" name="text" defaultValue={editing.data.text || ''} rows={5} />
              <div className="modal-actions">
                <button type="button" onClick={() => setEditing(null)}>Cancel</button>
                <button type="submit">Save question</button>
              </div>
            </form>
          ) : (
            <RichBlurbEditor
              node={editing.data}
              password={password}
              onSave={updateBlurb}
              onCancel={() => setEditing(null)}
            />
          )}
        </div>
      )}
    </main>
  );
}

createRoot(document.getElementById('root')).render(<Editor />);
