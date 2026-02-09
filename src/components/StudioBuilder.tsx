import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Eye,
  Grid3X3,
  LayoutDashboard,
  Layers,
  MousePointer2,
  PanelsRightBottom,
  Plus,
  Shield,
  Trash2,
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';

import { AssetLibrary } from './AssetLibrary';
import { BroadcastMonitor } from './BroadcastMonitor';
import { CanvasSidebar } from './CanvasSidebar';
import { CanvasStage } from './CanvasStage';
import { ControlRoom } from './ControlRoom';
import { GameControl } from './GameControl';
import { Overlay } from './Overlay';
import { QuickControl } from './QuickControl';
import { Studio } from './Studio';

import type { ElementModel, LayoutModel } from '../types';
import { cloneElement, getDefaultLayouts, getLayoutById, moveElement } from '../types';
import { supabase } from '../supabaseClient';

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function parseCanvasFromQuery(params: URLSearchParams) {
  const w = Number(params.get('w') || 1920);
  const h = Number(params.get('h') || 1080);
  const width = Number.isFinite(w) ? clamp(w, 320, 10000) : 1920;
  const height = Number.isFinite(h) ? clamp(h, 180, 10000) : 1080;
  return { width, height };
}

const DEFAULT_ZOOM = 0.645;

export default function StudioBuilder() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [activeTab, setActiveTab] = useState<'studio' | 'control' | 'monitor' | 'overlay'>('studio');
  const [activePanel, setActivePanel] = useState<'layers' | 'assets'>('layers');

  const [showGrid, setShowGrid] = useState(false);
  const [showSafeZones, setShowSafeZones] = useState(false);
  const [snapEnabled, setSnapEnabled] = useState(true);

  const [layouts, setLayouts] = useState<LayoutModel[]>(() => getDefaultLayouts());
  const [activeLayoutId, setActiveLayoutId] = useState<string(() => layouts[0]?.id || 'default');
  const activeLayout = useMemo(() => getLayoutById(layouts, activeLayoutId) || layouts[0], [layouts, activeLayoutId]);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const [canvasScale, setCanvasScale] = useState(DEFAULT_ZOOM);
  const [canvasSize, setCanvasSize] = useState(() => parseCanvasFromQuery(searchParams));

  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const next = parseCanvasFromQuery(searchParams);
    setCanvasSize(next);
  }, [searchParams]);

  useEffect(() => {
    const next = new URLSearchParams(searchParams);
    next.set('w', String(canvasSize.width));
    next.set('h', String(canvasSize.height));
    setSearchParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvasSize.width, canvasSize.height]);

  const selectedElements = useMemo(() => {
    if (!activeLayout) return [];
    return activeLayout.elements.filter((el) => selectedIds.includes(el.id));
  }, [activeLayout, selectedIds]);

  const selectedElement = selectedElements.length === 1 ? selectedElements[0] : null;

  const updateLayout = (nextLayout: LayoutModel) => {
    setLayouts((prev) => prev.map((l) => (l.id === nextLayout.id ? nextLayout : l)));
  };

  const setLayout = (nextLayout: LayoutModel) => {
    updateLayout(nextLayout);
  };

  const updateElement = (id: string, patch: Partial<ElementModel>) => {
    if (!activeLayout) return;
    const next: LayoutModel = {
      ...activeLayout,
      elements: activeLayout.elements.map((el) => (el.id === id ? { ...el, ...patch } : el)),
    };
    updateLayout(next);
  };

  const controllerUpdateElement = (id: string, patch: Partial<ElementModel>) => {
    updateElement(id, patch);
  };

  const controllerUpdateElementFromStage = (id: string, patch: Partial<ElementModel>) => {
    updateElement(id, patch);
  };

  const handleDelete = () => {
    if (!activeLayout) return;
    if (selectedIds.length === 0) return;

    const next: LayoutModel = {
      ...activeLayout,
      elements: activeLayout.elements.filter((el) => !selectedIds.includes(el.id)),
    };

    setSelectedIds([]);
    updateLayout(next);
  };

  const handleDuplicate = () => {
    if (!activeLayout) return;
    if (selectedIds.length === 0) return;

    const clones: ElementModel[] = selectedIds
      .map((id) => activeLayout.elements.find((e) => e.id === id))
      .filter(Boolean)
      .map((e) => cloneElement(e as ElementModel));

    const next: LayoutModel = {
      ...activeLayout,
      elements: [...activeLayout.elements, ...clones],
    };

    updateLayout(next);
    setSelectedIds(clones.map((c) => c.id));
  };

  const addText = () => {
    if (!activeLayout) return;

    const id = `text-${uuidv4()}`;
    const next: ElementModel = {
      id,
      type: 'text',
      name: 'Text',
      x: 200,
      y: 200,
      w: 400,
      h: 80,
      rotation: 0,
      opacity: 1,
      fill: '#ffffff',
      border: 0,
      borderColor: '#000000',
      mask: false,
      text: 'Text',
      fontSize: 48,
      fontFamily: 'Inter',
      fontWeight: 700,
      align: 'center',
      valign: 'middle',
      dataSource: 'manual',
    };

    const nextLayout: LayoutModel = {
      ...activeLayout,
      elements: [...activeLayout.elements, next],
    };

    updateLayout(nextLayout);
    setSelectedIds([id]);
  };

  const addShape = () => {
    if (!activeLayout) return;

    const id = `shape-${uuidv4()}`;
    const next: ElementModel = {
      id,
      type: 'shape',
      name: 'Shape',
      x: 200,
      y: 200,
      w: 400,
      h: 200,
      rotation: 0,
      opacity: 1,
      fill: '#3b82f6',
      border: 2,
      borderColor: '#60a5fa',
      mask: false,
      dataSource: 'manual',
    };

    const nextLayout: LayoutModel = {
      ...activeLayout,
      elements: [...activeLayout.elements, next],
    };

    updateLayout(nextLayout);
    setSelectedIds([id]);
  };

  const addContainer = () => {
    if (!activeLayout) return;

    const id = `container-${uuidv4()}`;
    const next: ElementModel = {
      id,
      type: 'container',
      name: 'Container',
      x: 200,
      y: 200,
      w: 600,
      h: 400,
      rotation: 0,
      opacity: 1,
      fill: '#111827',
      border: 2,
      borderColor: '#1f2937',
      mask: false,
      dataSource: 'manual',
      children: [],
    };

    const nextLayout: LayoutModel = {
      ...activeLayout,
      elements: [...activeLayout.elements, next],
    };

    updateLayout(nextLayout);
    setSelectedIds([id]);
  };

  const addImage = (url?: string) => {
    if (!activeLayout) return;

    const id = `image-${uuidv4()}`;
    const next: ElementModel = {
      id,
      type: 'image',
      name: 'Image',
      x: 200,
      y: 200,
      w: 640,
      h: 360,
      rotation: 0,
      opacity: 1,
      fill: '#ffffff',
      border: 0,
      borderColor: '#000000',
      mask: false,
      dataSource: 'manual',
      imageUrl: url || '',
      fit: 'contain',
    };

    const nextLayout: LayoutModel = {
      ...activeLayout,
      elements: [...activeLayout.elements, next],
    };

    updateLayout(nextLayout);
    setSelectedIds([id]);
  };

  const handleDropImage = (url: string) => {
    addImage(url);
  };

  const goToStudio = () => {
    setActiveTab('studio');
    navigate('/?view=studio');
  };

  const goToControl = () => {
    setActiveTab('control');
    navigate('/?view=control');
  };

  const goToMonitor = () => {
    setActiveTab('monitor');
    navigate('/?view=monitor');
  };

  const goToOverlay = () => {
    setActiveTab('overlay');
    navigate('/?view=overlay');
  };

  useEffect(() => {
    const view = searchParams.get('view');
    if (view === 'control') setActiveTab('control');
    else if (view === 'monitor') setActiveTab('monitor');
    else if (view === 'overlay') setActiveTab('overlay');
    else setActiveTab('studio');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const canvasZoomIn = () => setCanvasScale((z) => clamp(z + 0.05, 0.2, 2));
  const canvasZoomOut = () => setCanvasScale((z) => clamp(z - 0.05, 0.2, 2));
  const canvasFit = () => setCanvasScale(DEFAULT_ZOOM);

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Delete' || e.key === 'Backspace') {
      handleDelete();
    }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
      e.preventDefault();
      handleDuplicate();
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedIds, activeLayout]);

  const saveLayoutsToSupabase = async () => {
    try {
      const payload = {
        layouts,
        activeLayoutId,
        canvasSize,
        canvasScale,
        showGrid,
        showSafeZones,
        snapEnabled,
      };

      const { error } = await supabase.from('renderless_layouts').upsert({
        id: 'default',
        payload,
        updated_at: new Date().toISOString(),
      });

      if (error) {
        // eslint-disable-next-line no-console
        console.error(error);
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);
    }
  };

  const loadLayoutsFromSupabase = async () => {
    try {
      const { data, error } = await supabase.from('renderless_layouts').select('*').eq('id', 'default').single();
      if (error) {
        // eslint-disable-next-line no-console
        console.error(error);
        return;
      }
      if (!data?.payload) return;

      const payload = data.payload as any;
      if (payload.layouts) setLayouts(payload.layouts);
      if (payload.activeLayoutId) setActiveLayoutId(payload.activeLayoutId);
      if (payload.canvasSize) setCanvasSize(payload.canvasSize);
      if (payload.canvasScale) setCanvasScale(payload.canvasScale);
      if (typeof payload.showGrid === 'boolean') setShowGrid(payload.showGrid);
      if (typeof payload.showSafeZones === 'boolean') setShowSafeZones(payload.showSafeZones);
      if (typeof payload.snapEnabled === 'boolean') setSnapEnabled(payload.snapEnabled);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);
    }
  };

  useEffect(() => {
    loadLayoutsFromSupabase();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    saveLayoutsToSupabase();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layouts, activeLayoutId, canvasSize, canvasScale, showGrid, showSafeZones, snapEnabled]);

  if (activeTab === 'control') {
    return (
      <div className="h-screen w-screen bg-black text-white overflow-hidden">
        <ControlRoom
          layout={activeLayout}
          selectedIds={selectedIds}
          onSelectIds={setSelectedIds}
          onUpdateElement={controllerUpdateElement}
          onDuplicate={handleDuplicate}
          onDelete={handleDelete}
        />
      </div>
    );
  }

  if (activeTab === 'monitor') {
    return (
      <div className="h-screen w-screen bg-black text-white overflow-hidden">
        <BroadcastMonitor layout={activeLayout} />
      </div>
    );
  }

  if (activeTab === 'overlay') {
    return (
      <div className="h-screen w-screen bg-black text-white overflow-hidden">
        <Overlay layout={activeLayout} />
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen bg-black text-xs text-white overflow-hidden">
      <aside className="w-64 bg-zinc-900 border-r border-zinc-800 flex flex-col">
        <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-900 px-4 py-2 text-xs text-zinc-300">
          <div className="flex items-center gap-2">
            <LayoutDashboard size={16} />
            <span>BUILDING BLOCKS</span>
          </div>
        </div>

        <div className="p-4 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <button
              className="flex items-center justify-center gap-2 rounded-md border border-[#1f2636] bg-[#141a28] px-2 py-2 text-[11px] text-zinc-200 hover:bg-[#192238]"
              onClick={addText}
            >
              <span className="flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-zinc-950 border border-zinc-800">
                  T
                </span>
                Text
              </span>
            </button>

            <button
              className="flex items-center justify-center gap-2 rounded-md border border-[#1f2636] bg-[#141a28] px-2 py-2 text-[11px] text-zinc-200 hover:bg-[#192238]"
              onClick={() => addImage()}
            >
              <span className="flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-zinc-950 border border-zinc-800">
                  <Eye size={14} />
                </span>
                Image
              </span>
            </button>

            <button
              className="flex items-center justify-center gap-2 rounded-md border border-[#1f2636] bg-[#141a28] px-2 py-2 text-[11px] text-zinc-200 hover:bg-[#192238]"
              onClick={addShape}
            >
              <span className="flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-zinc-950 border border-zinc-800">
                  <Plus size={14} />
                </span>
                Shape
              </span>
            </button>

            <button
              className="flex items-center justify-center gap-2 rounded-md border border-[#1f2636] bg-[#141a28] px-2 py-2 text-[11px] text-zinc-200 hover:bg-[#192238]"
              onClick={addContainer}
            >
              <span className="flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-zinc-950 border border-zinc-800">
                  <PanelsRightBottom size={14} />
                </span>
                Container
              </span>
            </button>
          </div>

          <div className="border-t border-zinc-800 pt-3">
            <div className="text-xs font-semibold uppercase tracking-[0.3em] text-zinc-400">LAYER STACK</div>

            <button
              type="button"
              className="mt-3 w-full rounded-md border border-[#2a3346] bg-[#0f1420] px-2 py-1 text-[11px] text-zinc-300 hover:text-white"
              onClick={() => setSelectedIds([])}
            >
              Clear Selection
            </button>

            <div className="mt-4 space-y-2">
              {activeLayout?.elements
                ?.slice()
                .reverse()
                .map((el) => {
                  const selected = selectedIds.includes(el.id);
                  return (
                    <div
                      key={el.id}
                      className={[
                        'relative rounded-lg border px-3 py-2 text-left text-xs transition',
                        selected ? 'border-sky-500 bg-sky-500/10' : 'border-[#1f2636] bg-[#141a28]',
                      ].join(' ')}
                      draggable
                      onClick={() => setSelectedIds([el.id])}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <MousePointer2 size={12} className="text-zinc-400 shrink-0" />
                          <span className="truncate">{el.name || el.type}</span>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            className="text-zinc-400 hover:text-white"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedIds([el.id]);
                              handleDuplicate();
                            }}
                            title="Duplicate"
                          >
                            <Trash2 size={14} className="rotate-180" />
                          </button>

                          <button
                            type="button"
                            className="text-zinc-400 hover:text-white"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedIds([el.id]);
                              handleDelete();
                            }}
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          <div className="border-t border-zinc-800 pt-3">
            <div className="text-xs font-semibold uppercase tracking-[0.3em] text-zinc-400">VIEWS</div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                type="button"
                className={[
                  'rounded-md border px-2 py-2 text-[11px] hover:bg-[#192238]',
                  activeTab === 'studio' ? 'border-sky-500 bg-sky-500/10' : 'border-[#1f2636] bg-[#141a28]',
                ].join(' ')}
                onClick={goToStudio}
              >
                Studio
              </button>

              <button
                type="button"
                className={[
                  'rounded-md border px-2 py-2 text-[11px] hover:bg-[#192238]',
                  activeTab === 'control' ? 'border-sky-500 bg-sky-500/10' : 'border-[#1f2636] bg-[#141a28]',
                ].join(' ')}
                onClick={goToControl}
              >
                Control
              </button>

              <button
                type="button"
                className={[
                  'rounded-md border px-2 py-2 text-[11px] hover:bg-[#192238]',
                  activeTab === 'monitor' ? 'border-sky-500 bg-sky-500/10' : 'border-[#1f2636] bg-[#141a28]',
                ].join(' ')}
                onClick={goToMonitor}
              >
                Monitor
              </button>

              <button
                type="button"
                className={[
                  'rounded-md border px-2 py-2 text-[11px] hover:bg-[#192238]',
                  activeTab === 'overlay' ? 'border-sky-500 bg-sky-500/10' : 'border-[#1f2636] bg-[#141a28]',
                ].join(' ')}
                onClick={goToOverlay}
              >
                Overlay
              </button>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 relative bg-zinc-950 overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0 flex flex-col">
          <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-900 px-4 py-2 text-xs text-zinc-300">
            <div className="flex items-center gap-4">
              <button
                type="button"
                className="flex items-center gap-2 rounded-md border border-[#1f2636] bg-[#141a28] px-2 py-1 text-[11px] text-zinc-200 hover:bg-[#192238]"
                onClick={() => setActivePanel('layers')}
              >
                <Layers size={14} />
                Layers
              </button>

              <button
                type="button"
                className="flex items-center gap-2 rounded-md border border-[#1f2636] bg-[#141a28] px-2 py-1 text-[11px] text-zinc-200 hover:bg-[#192238]"
                onClick={() => setActivePanel('assets')}
              >
                <Eye size={14} />
                Assets
              </button>

              <label className="flex items-center gap-2 select-none text-[10px] text-zinc-500 overflow-hidden">
                <input
                  type="checkbox"
                  checked={snapEnabled}
                  onChange={(e) => setSnapEnabled(e.target.checked)}
                />
                Snap
              </label>

              <button
                type="button"
                className={[
                  'flex items-center gap-2 rounded-md border px-2 py-1 text-[11px] hover:bg-[#192238]',
                  showGrid ? 'border-sky-500 bg-sky-500/10' : 'border-[#1f2636] bg-[#141a28]',
                ].join(' ')}
                onClick={() => setShowGrid((s) => !s)}
              >
                <Grid3X3 size={14} />
                Grid
              </button>

              <button
                type="button"
                className={[
                  'flex items-center gap-2 rounded-md border px-2 py-1 text-[11px] hover:bg-[#192238]',
                  showSafeZones ? 'border-sky-500 bg-sky-500/10' : 'border-[#1f2636] bg-[#141a28]',
                ].join(' ')}
                onClick={() => setShowSafeZones((s) => !s)}
              >
                <Shield size={14} />
                Safe Zones
              </button>

              <div className="text-[11px] text-zinc-400">
                Build: {searchParams.get('build') || 'dev'}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                className="rounded-md border border-[#1f2636] bg-[#141a28] px-2 py-1 text-[11px] text-zinc-200 hover:bg-[#192238]"
                onClick={canvasZoomOut}
              >
                -
              </button>

              <div className="w-14 text-center text-[11px] text-zinc-300">{Math.round(canvasScale * 100)}%</div>

              <button
                type="button"
                className="rounded-md border border-[#1f2636] bg-[#141a28] px-2 py-1 text-[11px] text-zinc-200 hover:bg-[#192238]"
                onClick={canvasZoomIn}
              >
                +
              </button>

              <button
                type="button"
                className="rounded-md border border-[#1f2636] bg-[#141a28] px-2 py-1 text-[11px] text-zinc-200 hover:bg-[#192238]"
                onClick={canvasFit}
              >
                Fit
              </button>
            </div>
          </div>

          <div className="flex-1 p-6">
            <div className="relative h-full w-full overflow-auto rounded-2xl border border-zinc-800 bg-zinc-950 p-6" ref={scrollRef}>
              <div
                className="relative"
                style={{
                  width: canvasSize.width * canvasScale,
                  height: canvasSize.height * canvasScale,
                }}
              >
                <div
                  className="absolute left-0 top-0 origin-top-left rounded-xl border border-zinc-800 bg-zinc-950 shadow-2xl"
                  style={{
                    width: canvasSize.width * canvasScale,
                    height: canvasSize.height * canvasScale,
                  }}
                >
                  <div
                    className="relative h-full w-full"
                    style={{
                      transform: `scale(${canvasScale})`,
                      transformOrigin: 'left top',
                    }}
                  >
                    <div
                      className="relative bg-black shadow-2xl"
                      style={{
                        width: canvasSize.width,
                        height: canvasSize.height,
                        transform: 'scale(1)',
                        transformOrigin: 'center center',
                        transition: 'transform 0.1s ease-out',
                      }}
                    >
                      <CanvasStage
                        layout={activeLayout}
                        updateElement={controllerUpdateElementFromStage}
                        selectedIds={selectedIds}
                        snapEnabled={snapEnabled}
                        showGrid={showGrid}
                        showSafeZones={showSafeZones}
                        onSelectionChange={setSelectedIds}
                        onLayoutChange={setLayout}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <aside className="w-72 bg-zinc-900 border-l border-zinc-800 p-2">
        <div className="flex h-full flex-col gap-6">
          <CanvasSidebar
            layout={activeLayout}
            selectedIds={selectedIds}
            onUpdateElement={updateElement}
            onDuplicate={handleDuplicate}
            onDelete={handleDelete}
          />
        </div>
      </aside>
    </div>
  );
}
