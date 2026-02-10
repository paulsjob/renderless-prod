import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Box,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Lock,
  Move,
  Square,
  Type,
  Unlock,
} from 'lucide-react';
import { AssetLibrary } from './AssetLibrary';
import { CanvasSidebar } from './CanvasSidebar';
import { CanvasStage } from './CanvasStage';
import { BuildBadge } from './BuildBadge';
import { useBroadcastController } from '../hooks/useBroadcastController';
import type { Element as LayoutElement, Layout } from '../types';

const canvasSize = { width: 1920, height: 1080 };
const rulerSize = 24;

const buildingBlocks = [
  { id: 'text', label: 'Text', icon: Type },
  { id: 'image', label: 'Image', icon: ImageIcon },
  { id: 'shape', label: 'Shape', icon: Square },
  { id: 'container', label: 'Container', icon: Box },
];

const initialLayout: Layout = {
  id: 'layout-1',
  name: 'Flowics Studio',
  aspect_ratio: '16:9',
  elements: [
    {
      id: 'bg',
      type: 'shape',
      name: 'Background Plate',
      visible: true,
      hidden: false,
      locked: true,
      x: 0,
      y: 0,
      width: 1920,
      height: 1080,
      rotation: 0,
      opacity: 100,
      fill: '#0b0f1a',
      borderColor: '#1f2937',
      borderWidth: 0,
      dataSource: 'static',
      dataPath: 'background',
    },
    {
      id: 'headline',
      type: 'text',
      name: 'Headline Text',
      visible: true,
      hidden: false,
      locked: false,
      x: 150,
      y: 140,
      width: 980,
      height: 160,
      rotation: 0,
      opacity: 100,
      fill: '#f8fafc',
      borderColor: '#38bdf8',
      borderWidth: 2,
      text: 'BREAKING NEWS',
      dataSource: 'static',
      dataPath: 'headline',
    },
    {
      id: 'scorebug',
      type: 'container',
      name: 'Scorebug Group',
      visible: true,
      hidden: false,
      locked: false,
      x: 1180,
      y: 64,
      width: 640,
      height: 220,
      rotation: 0,
      opacity: 95,
      fill: '#111827',
      borderColor: '#38bdf8',
      borderWidth: 2,
      dataSource: 'supabase',
      dataPath: 'game.score',
    },
    {
      id: 'ticker',
      type: 'shape',
      name: 'Ticker Bar',
      visible: true,
      hidden: false,
      locked: false,
      x: 140,
      y: 860,
      width: 1640,
      height: 160,
      rotation: 0,
      opacity: 90,
      fill: '#0f172a',
      borderColor: '#f97316',
      borderWidth: 2,
      dataSource: 'supabase',
      dataPath: 'game.ticker',
    },
  ],
};

export default function StudioBuilder() {
  const { layout, setLayout, updateElement: controllerUpdateElement } = useBroadcastController();
  const [selectedIds, setSelectedIds] = useState<string[]>(['headline']);
  const [snapEnabled, setSnapEnabled] = useState(true);
  const [showRulers, setShowRulers] = useState(true);
  const [showGrid, setShowGrid] = useState(false);
  const [showSafeZones, setShowSafeZones] = useState(false);
  const [canvasScale, setCanvasScale] = useState(0.55);
  const [dragLayerId, setDragLayerId] = useState<string | null>(null);
  const [dropLayerId, setDropLayerId] = useState<string | null>(null);
  const [leftPanelTab, setLeftPanelTab] = useState<'layers' | 'assets'>('layers');
  const canvasViewportRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!layout) {
      setLayout(initialLayout);
    }
  }, [layout, setLayout]);

  const activeLayout = layout ?? initialLayout;
  const elements = activeLayout.elements;
  const reversedElements = useMemo(() => [...elements].reverse(), [elements]);

  const updateElement = (id: string, updates: Partial<LayoutElement>) => {
    setLayout((prev) => {
      const current = prev ?? initialLayout;
      return {
        ...current,
        elements: current.elements.map((item) =>
          item.id === id ? { ...item, ...updates } : item,
        ),
      };
    });
  };

  const addElement = (
    type: LayoutElement['type'],
    overrides: Partial<LayoutElement> = {},
  ) => {
    const id = `${type}-${Date.now()}`;
    const baseDefaults = {
      x: canvasSize.width / 2,
      y: canvasSize.height / 2,
      width: 260,
      height: 180,
      fill: '#111827',
      borderColor: '#38bdf8',
      borderWidth: 2,
      text: undefined,
      src: undefined,
      fontSize: undefined,
      dataPath: `static.${type}`,
    };
    const defaultsByType: Record<LayoutElement['type'], Partial<LayoutElement>> = {
      text: {
        name: 'Text Layer',
        width: 520,
        height: 96,
        fill: '#ffffff',
        borderWidth: 0,
        text: 'HEADLINE',
        fontSize: 48,
        dataPath: 'static.text',
      },
      shape: {
        name: 'Shape Layer',
        width: 100,
        height: 100,
        fill: '#2563eb',
        borderWidth: 0,
        dataPath: 'static.shape',
      },
      image: {
        name: 'Image Layer',
        width: 260,
        height: 180,
        fill: '#4b5563',
        borderColor: '#9ca3af',
        borderWidth: 1,
        dataPath: 'static.image',
      },
      container: {
        name: 'Container Layer',
        width: 320,
        height: 220,
        fill: 'transparent',
        borderColor: '#38bdf8',
        borderWidth: 2,
        dataPath: 'static.container',
      },
    };
    const resolved = { ...baseDefaults, ...defaultsByType[type], ...overrides };
    const newElement: LayoutElement = {
      id,
      type,
      name: resolved.name ?? `${type[0].toUpperCase()}${type.slice(1)} Layer`,
      visible: true,
      hidden: false,
      locked: false,
      x: (resolved.x ?? 0) - (resolved.width ?? 0) / 2,
      y: (resolved.y ?? 0) - (resolved.height ?? 0) / 2,
      width: resolved.width ?? 260,
      height: resolved.height ?? 180,
      rotation: 0,
      opacity: 100,
      fill: resolved.fill,
      borderColor: resolved.borderColor,
      borderWidth: resolved.borderWidth,
      text: resolved.text,
      src: resolved.src,
      fontSize: resolved.fontSize,
      dataSource: 'static',
      dataPath: resolved.dataPath,
      maskEnabled: false,
    };
    setLayout((prev) => {
      const current = prev ?? initialLayout;
      return { ...current, elements: [...current.elements, newElement] };
    });
    setSelectedIds([id]);
  };

  const addAsset = (url: string) => {
    const img = new Image();

    img.onload = () => {
      // NOTE: addElement() treats x/y as the ELEMENT CENTER (then converts to top-left).
      // So to center a new asset on the stage, pass the stage center.
      const stageW = canvasSize?.width ?? 1920;
      const stageH = canvasSize?.height ?? 1080;

      const imgW = img.naturalWidth || 1;
      const imgH = img.naturalHeight || 1;

      // Fit-to-stage but never upscale
      const fitScale = Math.min(stageW / imgW, stageH / imgH, 1);
      const startWidth = Math.round(imgW * fitScale);
      const startHeight = Math.round(imgH * fitScale);

      addElement('image', {
        src: url,
        borderWidth: 0,
        fill: '#111827',
        width: startWidth,
        height: startHeight,
        // IMPORTANT: center coords (not top-left)
        x: stageW / 2,
        y: stageH / 2,
      });

      setLeftPanelTab('layers');
    };

    img.onerror = () => {
      const stageW = canvasSize?.width ?? 1920;
      const stageH = canvasSize?.height ?? 1080;

      // Fallback size, still centered
      addElement('image', {
        src: url,
        borderWidth: 0,
        fill: '#111827',
        width: 640,
        height: 360,
        x: stageW / 2,
        y: stageH / 2,
      });

      setLeftPanelTab('layers');
    };

    img.src = url;
  };
    img.onerror = () => {
      addElement('image', { src: url, borderWidth: 0, fill: '#111827' });
      setLeftPanelTab('layers');
    };
    img.src = url;
  };

  const handleBuildingBlockClick = (type: LayoutElement['type']) => {
    if (type === 'image') {
      setLeftPanelTab('assets');
      return;
    }
    if (type === 'text') {
      addElement(type, { text: 'HEADLINE', fill: '#ffffff' });
      return;
    }
    if (type === 'container') {
      addElement(type, {
        fill: 'transparent',
        borderColor: '#38bdf8',
        borderWidth: 2,
      });
      return;
    }
    addElement(type);
  };

  const handleAssetSelect = (url: string) => {
    addAsset(url);
  };

  const handleLayerSelect = (id: string, event: React.MouseEvent) => {
    const isMulti = event.ctrlKey || event.metaKey;
    const isShift = event.shiftKey;
    if (isShift && selectedIds.length) {
      const startIndex = elements.findIndex((item) => item.id === selectedIds[0]);
      const endIndex = elements.findIndex((item) => item.id === id);
      if (startIndex !== -1 && endIndex !== -1) {
        const [from, to] = startIndex < endIndex ? [startIndex, endIndex] : [endIndex, startIndex];
        const rangeIds = elements.slice(from, to + 1).map((item) => item.id);
        setSelectedIds(rangeIds);
        return;
      }
    }
    if (isMulti) {
      setSelectedIds((prev) =>
        prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
      );
    } else {
      setSelectedIds([id]);
    }
  };

  const handleLayerDrop = (event: React.DragEvent, dropId: string, listIndex: number) => {
    event.preventDefault();
    if (!dragLayerId || dragLayerId === dropId) return;
    const sourceIndex = elements.findIndex((item) => item.id === dragLayerId);
    const targetIndex = elements.length - 1 - listIndex;
    if (sourceIndex === -1 || targetIndex === -1) return;
    const next = [...elements];
    const [moved] = next.splice(sourceIndex, 1);
    next.splice(targetIndex, 0, moved);
    setLayout((prev) => {
      const current = prev ?? initialLayout;
      return { ...current, elements: next };
    });
    setDragLayerId(null);
    setDropLayerId(null);
  };

  const handleLayerDragOver = (event: React.DragEvent, layerId: string) => {
    event.preventDefault();
    if (!dragLayerId || dragLayerId === layerId) return;
    setDropLayerId(layerId);
  };

  const handleLayerDragEnd = () => {
    setDragLayerId(null);
    setDropLayerId(null);
  };

  const handleLayerMove = (id: string, direction: 'up' | 'down') => {
    const currentIndex = elements.findIndex((item) => item.id === id);
    if (currentIndex === -1) return;
    const targetIndex = direction === 'up' ? currentIndex + 1 : currentIndex - 1;
    if (targetIndex < 0 || targetIndex >= elements.length) return;
    const next = [...elements];
    [next[currentIndex], next[targetIndex]] = [next[targetIndex], next[currentIndex]];
    setLayout((prev) => {
      const current = prev ?? initialLayout;
      return { ...current, elements: next };
    });
  };

  const handleNudge = (dx: number, dy: number) => {
    setLayout((prev) => {
      const current = prev ?? initialLayout;
      return {
        ...current,
        elements: current.elements.map((element) =>
          selectedIds.includes(element.id)
            ? { ...element, x: element.x + dx, y: element.y + dy }
            : element,
        ),
      };
    });
  };

  const handleDelete = () => {
    setLayout((prev) => {
      const current = prev ?? initialLayout;
      return {
        ...current,
        elements: current.elements.filter((element) => !selectedIds.includes(element.id)),
      };
    });
    setSelectedIds([]);
  };

  const handleDuplicate = () => {
    if (selectedIds.length === 0) return;
    const sourceElements = activeLayout.elements.filter((element) =>
      selectedIds.includes(element.id),
    );
    if (sourceElements.length === 0) return;
    const timestamp = Date.now();
    let counter = 0;
    const duplicated = sourceElements.map((element) => {
      counter += 1;
      return {
        ...element,
        id: `${element.id}-copy-${timestamp}-${counter}`,
        x: element.x + 20,
        y: element.y + 20,
      };
    });
    setLayout((prev) => {
      const current = prev ?? initialLayout;
      return {
        ...current,
        elements: [...current.elements, ...duplicated],
      };
    });
    setSelectedIds(duplicated.map((element) => element.id));
  };

  const handleFit = () => {
    const viewport = canvasViewportRef.current;
    if (!viewport) return;
    const { width, height } = viewport.getBoundingClientRect();
    const scale = Math.min(width / canvasSize.width, height / canvasSize.height) * 0.9;
    setCanvasScale(Math.max(0.1, Math.min(1, scale)));
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (selectedIds.length === 0) return;
      const step = event.shiftKey ? 10 : 1;
      if (event.key === 'Delete' || event.key === 'Backspace') {
        event.preventDefault();
        handleDelete();
        return;
      }
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) {
        event.preventDefault();
      }
      if (event.key === 'ArrowLeft') handleNudge(-step, 0);
      if (event.key === 'ArrowRight') handleNudge(step, 0);
      if (event.key === 'ArrowUp') handleNudge(0, -step);
      if (event.key === 'ArrowDown') handleNudge(0, step);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIds]);

  return (
    <div className="flex h-screen w-screen bg-black text-xs">
      <aside className="w-64 bg-zinc-900 border-r border-zinc-800 flex flex-col">
        <div className="flex items-center gap-2 border-b border-zinc-800 px-4 py-3">
          <button
            type="button"
            onClick={() => setLeftPanelTab('layers')}
            className={`rounded-full px-3 py-1 text-[11px] font-semibold ${
              leftPanelTab === 'layers'
                ? 'bg-sky-500/20 text-white'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Layers
          </button>
          <button
            type="button"
            onClick={() => setLeftPanelTab('assets')}
            className={`rounded-full px-3 py-1 text-[11px] font-semibold ${
              leftPanelTab === 'assets'
                ? 'bg-sky-500/20 text-white'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Assets
          </button>
        </div>

        <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-4">
          {leftPanelTab === 'assets' ? (
            <AssetLibrary onAssetSelect={handleAssetSelect} />
          ) : (
            <>
              <div>
                <h2 className="text-xs font-semibold uppercase tracking-[0.3em] text-zinc-400">
                  Building Blocks
                </h2>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  {buildingBlocks.map((block) => {
                    const Icon = block.icon;
                    return (
                      <button
                        key={block.id}
                        type="button"
                        onClick={() => handleBuildingBlockClick(block.id as LayoutElement['type'])}
                        className="flex items-center gap-2 rounded-lg border border-dashed border-[#2a3346] bg-[#141a28] px-3 py-3 text-xs text-zinc-200 hover:border-sky-500 hover:text-white"
                      >
                        <Icon className="h-4 w-4" />
                        {block.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <h2 className="text-xs font-semibold uppercase tracking-[0.3em] text-zinc-400">
                  Layer Stack
                </h2>
                {selectedIds.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedIds([])}
                    className="mt-3 w-full rounded-md border border-[#2a3346] bg-[#0f1420] px-2 py-1 text-[11px] text-zinc-300 hover:text-white"
                  >
                    Clear Selection
                  </button>
                )}
                <div className="mt-4 space-y-2">
                  {reversedElements.map((layer, listIndex) => {
                    const isSelected = selectedIds.includes(layer.id);
                    const isDragging = dragLayerId === layer.id;
                    const isDropTarget = dropLayerId === layer.id && dragLayerId !== layer.id;
                    const currentIndex = elements.findIndex((item) => item.id === layer.id);
                    const canMoveUp = currentIndex < elements.length - 1;
                    const canMoveDown = currentIndex > 0;
                    return (
                      <div
                        key={layer.id}
                        draggable
                        onDragStart={() => {
                          setDragLayerId(layer.id);
                        }}
                        onDragEnd={handleLayerDragEnd}
                        onDragOver={(event) => handleLayerDragOver(event, layer.id)}
                        onDrop={(event) => handleLayerDrop(event, layer.id, listIndex)}
                        className={`relative rounded-lg border px-3 py-2 text-left text-xs transition ${
                          isSelected
                            ? 'border-sky-500 bg-sky-500/10'
                            : 'border-[#1f2636] bg-[#141a28]'
                        } ${isDragging ? 'opacity-50' : ''}`}
                      >
                        {isDropTarget && (
                          <div className="absolute -top-1 left-2 right-2 h-0.5 rounded-full bg-sky-500" />
                        )}
                        <div className="flex items-center justify-between gap-2">
                          <button
                            type="button"
                            onClick={(event) => handleLayerSelect(layer.id, event)}
                            className="flex items-center gap-2 text-left"
                          >
                            <Move className="h-3 w-3 text-zinc-500" />
                            <span className="font-semibold">{layer.name}</span>
                          </button>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleLayerMove(layer.id, 'up')}
                              disabled={!canMoveUp}
                              className="text-zinc-400 hover:text-white disabled:cursor-not-allowed disabled:text-zinc-600"
                            >
                              ↑
                            </button>
                            <button
                              type="button"
                              onClick={() => handleLayerMove(layer.id, 'down')}
                              disabled={!canMoveDown}
                              className="text-zinc-400 hover:text-white disabled:cursor-not-allowed disabled:text-zinc-600"
                            >
                              ↓
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                updateElement(layer.id, {
                                  hidden: !layer.hidden,
                                  visible: layer.hidden,
                                })
                              }
                              className="text-zinc-400 hover:text-white"
                            >
                              {layer.hidden ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => updateElement(layer.id, { locked: !layer.locked })}
                              className="text-zinc-400 hover:text-white"
                            >
                              {layer.locked ? (
                                <Lock className="h-4 w-4" />
                              ) : (
                                <Unlock className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-lg border border-[#1f2636] bg-[#141a28] p-3 text-xs text-zinc-400">
                Selected Elements: {selectedIds.length ? selectedIds.join(', ') : 'None'}
              </div>
            </>
          )}
        </div>
      </aside>

      <main className="flex-1 relative bg-zinc-950 overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0 flex flex-col">
          <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-900 px-4 py-2 text-xs text-zinc-300">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={showRulers}
                  onChange={() => setShowRulers((prev) => !prev)}
                />
                Rulers
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={snapEnabled}
                  onChange={() => setSnapEnabled((prev) => !prev)}
                />
                Snap
              </label>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowGrid((prev) => !prev)}
                className={`rounded-md border px-2 py-1 text-[11px] ${
                  showGrid
                    ? 'border-sky-500 bg-sky-500/20 text-white'
                    : 'border-zinc-800 bg-zinc-850 text-zinc-300 hover:text-white'
                }`}
              >
                Grid
              </button>
              <button
                type="button"
                onClick={() => setShowSafeZones((prev) => !prev)}
                className={`rounded-md border px-2 py-1 text-[11px] ${
                  showSafeZones
                    ? 'border-sky-500 bg-sky-500/20 text-white'
                    : 'border-zinc-800 bg-zinc-850 text-zinc-300 hover:text-white'
                }`}
              >
                Safe Zones
              </button>
              <BuildBadge />
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCanvasScale((prev) => Math.max(0.3, prev - 0.05))}
                  className="rounded-md border border-zinc-800 bg-zinc-850 px-2 py-1 text-[11px] text-zinc-300 hover:text-white"
                >
                  -
                </button>
                <span className="text-[11px] text-zinc-400">{Math.round(canvasScale * 100)}%</span>
                <button
                  type="button"
                  onClick={() => setCanvasScale((prev) => Math.min(1, prev + 0.05))}
                  className="rounded-md border border-zinc-800 bg-zinc-850 px-2 py-1 text-[11px] text-zinc-300 hover:text-white"
                >
                  +
                </button>
                <button
                  type="button"
                  onClick={handleFit}
                  className="rounded-md border border-zinc-800 bg-zinc-850 px-2 py-1 text-[11px] text-zinc-300 hover:text-white"
                >
                  Fit
                </button>
              </div>
            </div>
          </div>

          <div className="flex-1 p-6" ref={canvasViewportRef}>
            <div className="relative h-full w-full overflow-auto rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
              <div
                className="relative"
                style={{
                  width: canvasSize.width * canvasScale + (showRulers ? rulerSize : 0),
                  height: canvasSize.height * canvasScale + (showRulers ? rulerSize : 0),
                }}
              >
                {showRulers && (
                  <div
                    className="absolute left-[24px] top-0 h-[24px] w-full border-b border-zinc-800 bg-zinc-900"
                    style={{ width: canvasSize.width * canvasScale }}
                  >
                    <div className="flex h-full w-full">
                      {Array.from({ length: canvasSize.width / 100 + 1 }).map((_, index) => (
                        <div key={`x-${index}`} className="relative flex-1">
                          <div className="absolute bottom-1 left-0 h-2 w-px bg-zinc-600" />
                          <span className="absolute bottom-0 left-1 text-[10px] text-zinc-500">
                            {index * 100}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {showRulers && (
                  <div
                    className="absolute left-0 top-[24px] h-full w-[24px] border-r border-zinc-800 bg-zinc-900"
                    style={{ height: canvasSize.height * canvasScale }}
                  >
                    <div className="flex h-full w-full flex-col">
                      {Array.from({ length: canvasSize.height / 100 + 1 }).map((_, index) => (
                        <div key={`y-${index}`} className="relative flex-1">
                          <div className="absolute right-1 top-0 h-px w-2 bg-zinc-600" />
                          <span className="absolute right-1 top-1 text-[10px] text-zinc-500">
                            {index * 100}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div
                    className="absolute left-[24px] top-[24px] origin-top-left rounded-xl border border-zinc-800 bg-zinc-950 shadow-2xl"
                    style={
                      width: canvasSize.width * canvasScale,
                      height: canvasSize.height * canvasScale,
                    }
                  >
                    <CanvasStage
                      layout={activeLayout}
                      updateElement={controllerUpdateElement}
                      selectedIds={selectedIds}
                      scale={canvasScale}
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
