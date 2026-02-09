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
import type { Element as LayoutElement } from '../types';

type StudioElement = LayoutElement & {
  fill: string;
  borderColor: string;
  borderWidth: number;
  text?: string;
  src?: string;
};

type DragState = {
  startX: number;
  startY: number;
  origin: Record<string, { x: number; y: number }>;
  axis: 'x' | 'y' | null;
};

const canvasSize = { width: 1920, height: 1080 };
const canvasScale = 0.5;
const rulerSize = 24;

const initialElements: StudioElement[] = [
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
    fill: '#111827',
    borderColor: '#1f2937',
    borderWidth: 0,
  },
  {
    id: 'title',
    type: 'text',
    name: 'Headline Text',
    visible: true,
    hidden: false,
    locked: false,
    x: 160,
    y: 140,
    width: 920,
    height: 160,
    rotation: 0,
    opacity: 100,
    fill: '#ffffff',
    borderColor: '#0ea5e9',
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
    x: 1200,
    y: 60,
    width: 620,
    height: 220,
    rotation: 0,
    opacity: 95,
    fill: '#0f172a',
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
    x: 120,
    y: 880,
    width: 1680,
    height: 140,
    rotation: 0,
    opacity: 90,
    fill: '#0f172a',
    borderColor: '#f97316',
    borderWidth: 2,
    dataSource: 'supabase',
    dataPath: 'game.ticker',
  },
];

const buildingBlocks = [
  { id: 'text', label: 'Text', icon: Type },
  { id: 'image', label: 'Image', icon: ImageIcon },
  { id: 'shape', label: 'Rectangle', icon: Square },
  { id: 'container', label: 'Container', icon: Box },
];

const dataPaths = [
  'game.score.home',
  'game.score.away',
  'game.inning',
  'game.clock',
  'game.ticker',
];

export default function StudioBuilder() {
  const [elements, setElements] = useState<StudioElement[]>(initialElements);
  const [selectedIds, setSelectedIds] = useState<string[]>(['title']);
  const [dragLayerId, setDragLayerId] = useState<string | null>(null);
  const [snapGuides, setSnapGuides] = useState({
    centerX: false,
    centerY: false,
    left: false,
    right: false,
    top: false,
    bottom: false,
  });
  const [showRulers, setShowRulers] = useState(true);
  const [showGuides, setShowGuides] = useState(true);
  const [snapEnabled, setSnapEnabled] = useState(true);
  const stageRef = useRef<HTMLDivElement>(null);
  const dragStateRef = useRef<DragState | null>(null);

  const selectedElements = useMemo(
    () => elements.filter((element) => selectedIds.includes(element.id)),
    [elements, selectedIds],
  );

  const primarySelection = selectedElements[0];

  const boundingBox = useMemo(() => {
    if (selectedElements.length === 0) return null;
    const minX = Math.min(...selectedElements.map((element) => element.x));
    const minY = Math.min(...selectedElements.map((element) => element.y));
    const maxX = Math.max(...selectedElements.map((element) => element.x + element.width));
    const maxY = Math.max(...selectedElements.map((element) => element.y + element.height));
    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    };
  }, [selectedElements]);

  const toggleSelection = (id: string, multi: boolean) => {
    setSelectedIds((prev) => {
      if (multi) {
        return prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id];
      }
      return [id];
    });
  };

  const updateElement = (id: string, updates: Partial<StudioElement>) => {
    setElements((prev) => prev.map((item) => (item.id === id ? { ...item, ...updates } : item)));
  };

  const handleMouseDown = (event: React.MouseEvent, id: string) => {
    event.stopPropagation();
    const element = elements.find((item) => item.id === id);
    if (!element || element.locked) return;
    const multiSelect = event.ctrlKey || event.metaKey;
    const nextSelected = multiSelect
      ? selectedIds.includes(id)
        ? selectedIds.filter((item) => item !== id)
        : [...selectedIds, id]
      : [id];
    setSelectedIds(nextSelected);
    if (!nextSelected.includes(id)) return;

    const origin: DragState['origin'] = {};
    nextSelected.forEach((selectedId) => {
      const selected = elements.find((item) => item.id === selectedId);
      if (selected) {
        origin[selected.id] = { x: selected.x, y: selected.y };
      }
    });

    dragStateRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      origin,
      axis: null,
    };
  };

  const handleMouseMove = (event: MouseEvent) => {
    const dragState = dragStateRef.current;
    if (!dragState) return;
    const dx = (event.clientX - dragState.startX) / canvasScale;
    const dy = (event.clientY - dragState.startY) / canvasScale;
    let nextDx = dx;
    let nextDy = dy;

    if (event.shiftKey) {
      if (!dragState.axis) {
        dragState.axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
      }
      if (dragState.axis === 'x') {
        nextDy = 0;
      }
      if (dragState.axis === 'y') {
        nextDx = 0;
      }
    } else {
      dragState.axis = null;
    }

    setElements((prev) =>
      prev.map((element) => {
        const origin = dragState.origin[element.id];
        if (!origin) return element;
        return {
          ...element,
          x: origin.x + nextDx,
          y: origin.y + nextDy,
        };
      }),
    );

    if (snapEnabled && selectedElements[0]) {
      const active = selectedElements[0];
      const centerX = active.x + active.width / 2 + nextDx;
      const centerY = active.y + active.height / 2 + nextDy;
      const threshold = 6;
      setSnapGuides({
        centerX: Math.abs(centerX - canvasSize.width / 2) < threshold,
        centerY: Math.abs(centerY - canvasSize.height / 2) < threshold,
        left: Math.abs(active.x + nextDx) < threshold,
        right: Math.abs(active.x + active.width + nextDx - canvasSize.width) < threshold,
        top: Math.abs(active.y + nextDy) < threshold,
        bottom: Math.abs(active.y + active.height + nextDy - canvasSize.height) < threshold,
      });
    }
  };

  const handleMouseUp = () => {
    if (dragStateRef.current) {
      dragStateRef.current = null;
      setSnapGuides({
        centerX: false,
        centerY: false,
        left: false,
        right: false,
        top: false,
        bottom: false,
      });
    }
  };

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  });

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (selectedIds.length === 0) return;
      const step = event.shiftKey ? 10 : 1;
      let dx = 0;
      let dy = 0;
      if (event.key === 'ArrowLeft') dx = -step;
      if (event.key === 'ArrowRight') dx = step;
      if (event.key === 'ArrowUp') dy = -step;
      if (event.key === 'ArrowDown') dy = step;
      if (dx === 0 && dy === 0) return;
      event.preventDefault();
      setElements((prev) =>
        prev.map((element) =>
          selectedIds.includes(element.id)
            ? { ...element, x: element.x + dx, y: element.y + dy }
            : element,
        ),
      );
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIds]);

  const handleCanvasDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const blockType = event.dataTransfer.getData('application/x-block');
    if (!blockType || !stageRef.current) return;
    const rect = stageRef.current.getBoundingClientRect();
    const x = (event.clientX - rect.left) / canvasScale;
    const y = (event.clientY - rect.top) / canvasScale;
    const id = `${blockType}-${Date.now()}`;
    const newElement: StudioElement = {
      id,
      type: blockType as StudioElement['type'],
      name: `${blockType[0].toUpperCase()}${blockType.slice(1)} Layer`,
      visible: true,
      hidden: false,
      locked: false,
      x: Math.max(0, Math.min(canvasSize.width - 200, x)),
      y: Math.max(0, Math.min(canvasSize.height - 120, y)),
      width: blockType === 'text' ? 360 : 240,
      height: blockType === 'text' ? 120 : 180,
      rotation: 0,
      opacity: 100,
      fill: '#1e293b',
      borderColor: '#38bdf8',
      borderWidth: 2,
      text: blockType === 'text' ? 'New Text' : undefined,
      dataSource: 'static',
      dataPath: 'static.text',
    };
    setElements((prev) => [...prev, newElement]);
    setSelectedIds([id]);
  };

  const handleLayerDrop = (event: React.DragEvent, dropId: string) => {
    event.preventDefault();
    if (!dragLayerId || dragLayerId === dropId) return;
    const sourceIndex = elements.findIndex((item) => item.id === dragLayerId);
    const targetIndex = elements.findIndex((item) => item.id === dropId);
    if (sourceIndex === -1 || targetIndex === -1) return;
    const next = [...elements];
    const [moved] = next.splice(sourceIndex, 1);
    next.splice(targetIndex, 0, moved);
    setElements(next);
  };

  return (
    <div className="h-screen w-screen bg-[#0b0d12] text-white flex overflow-hidden">
      <aside className="w-80 border-r border-[#1d2331] bg-[#0f1420] p-4 flex flex-col gap-6">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-widest text-zinc-400">
            Layer Stack
          </h2>
          <div className="mt-4 space-y-2">
            {elements.map((layer) => {
              const isSelected = selectedIds.includes(layer.id);
              return (
                <div
                  key={layer.id}
                  draggable
                  onDragStart={() => setDragLayerId(layer.id)}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => handleLayerDrop(event, layer.id)}
                  className={`rounded-lg border px-3 py-2 text-left text-xs transition ${
                    isSelected
                      ? 'border-sky-500 bg-sky-500/10'
                      : 'border-[#1f2636] bg-[#141a28]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={(event) => toggleSelection(layer.id, event.ctrlKey || event.metaKey)}
                      className="flex items-center gap-2 text-left"
                    >
                      <Move className="h-3 w-3 text-zinc-500" />
                      <span className="font-semibold">{layer.name}</span>
                    </button>
                    <div className="flex items-center gap-2">
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
                        {layer.hidden ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => updateElement(layer.id, { locked: !layer.locked })}
                        className="text-zinc-400 hover:text-white"
                      >
                        {layer.locked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <h2 className="text-sm font-semibold uppercase tracking-widest text-zinc-400">
            Building Blocks
          </h2>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {buildingBlocks.map((block) => {
              const Icon = block.icon;
              return (
                <div
                  key={block.id}
                  draggable
                  onDragStart={(event) => event.dataTransfer.setData('application/x-block', block.id)}
                  className="flex items-center gap-2 rounded-lg border border-dashed border-[#2a3346] bg-[#141a28] px-3 py-3 text-xs text-zinc-300 hover:border-sky-500"
                >
                  <Icon className="h-4 w-4" />
                  {block.label}
                </div>
              );
            })}
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col">
        <div className="flex items-center justify-between border-b border-[#1d2331] bg-[#0f1420] px-4 py-2 text-xs text-zinc-400">
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
                checked={showGuides}
                onChange={() => setShowGuides((prev) => !prev)}
              />
              Guides
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
          <div>Ctrl+Click Multi-select · Shift+Drag Axis Lock · Arrow Keys Nudge</div>
        </div>

        <div className="flex-1 flex items-center justify-center bg-[#0b0f1a] p-6">
          <div
            className="relative"
            style={{
              width: canvasSize.width * canvasScale + rulerSize,
              height: canvasSize.height * canvasScale + rulerSize,
            }}
          >
            {showRulers && (
              <div
                className="absolute left-[24px] top-0 h-[24px] w-full bg-[#0f1420] border-b border-[#1f2636]"
                style={{ width: canvasSize.width * canvasScale }}
              >
                <div className="flex h-full">
                  {Array.from({ length: canvasSize.width / 100 + 1 }).map((_, index) => (
                    <div key={`x-${index}`} className="relative h-full flex-1">
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
                className="absolute left-0 top-[24px] w-[24px] h-full bg-[#0f1420] border-r border-[#1f2636]"
                style={{ height: canvasSize.height * canvasScale }}
              >
                <div className="flex h-full flex-col">
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
              ref={stageRef}
              className="absolute left-[24px] top-[24px] origin-top-left rounded-xl border border-[#2a3346] bg-[#0a0d14] shadow-2xl"
              style={{
                width: canvasSize.width * canvasScale,
                height: canvasSize.height * canvasScale,
              }}
              onClick={() => setSelectedIds([])}
              onDrop={handleCanvasDrop}
              onDragOver={(event) => event.preventDefault()}
            >
              <div
                className="relative h-full w-full"
                style={{ transform: `scale(${canvasScale})`, transformOrigin: 'top left' }}
              >
                {showGuides && snapGuides.centerX && (
                  <div className="absolute left-1/2 top-0 h-full w-px bg-cyan-400/80" />
                )}
                {showGuides && snapGuides.centerY && (
                  <div className="absolute left-0 top-1/2 h-px w-full bg-cyan-400/80" />
                )}
                {showGuides && snapGuides.left && (
                  <div className="absolute left-0 top-0 h-full w-px bg-cyan-400/80" />
                )}
                {showGuides && snapGuides.right && (
                  <div className="absolute right-0 top-0 h-full w-px bg-cyan-400/80" />
                )}
                {showGuides && snapGuides.top && (
                  <div className="absolute left-0 top-0 h-px w-full bg-cyan-400/80" />
                )}
                {showGuides && snapGuides.bottom && (
                  <div className="absolute left-0 bottom-0 h-px w-full bg-cyan-400/80" />
                )}

                {elements.map((element) => {
                  if (element.hidden || !element.visible) return null;
                  const isSelected = selectedIds.includes(element.id);
                  return (
                    <div
                      key={element.id}
                      onMouseDown={(event) => handleMouseDown(event, element.id)}
                      className={`absolute cursor-pointer border ${
                        isSelected ? 'border-sky-400' : 'border-transparent'
                      }`}
                      style={{
                        left: element.x,
                        top: element.y,
                        width: element.width,
                        height: element.height,
                        transform: `rotate(${element.rotation}deg)`,
                        opacity: element.opacity / 100,
                      }}
                    >
                      <div
                        className="flex h-full w-full items-center justify-center text-xs text-white"
                        style={{
                          backgroundColor: element.fill,
                          border: `${element.borderWidth}px solid ${element.borderColor}`,
                        }}
                      >
                        {element.type === 'text' ? element.text : element.name}
                      </div>
                    </div>
                  );
                })}

                {boundingBox && (
                  <div
                    className="absolute border border-sky-400"
                    style={{
                      left: boundingBox.x,
                      top: boundingBox.y,
                      width: boundingBox.width,
                      height: boundingBox.height,
                    }}
                  >
                    {['tl', 'tm', 'tr', 'ml', 'mr', 'bl', 'bm', 'br'].map((handle) => (
                      <div
                        key={handle}
                        className="absolute h-3 w-3 rounded-sm border border-sky-200 bg-sky-500"
                        style={{
                          left: handle.includes('l') ? -6 : handle.includes('r') ? '100%' : '50%',
                          top: handle.includes('t') ? -6 : handle.includes('b') ? '100%' : '50%',
                          transform: 'translate(-50%, -50%)',
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <aside className="w-80 border-l border-[#1d2331] bg-[#0f1420] p-4 flex flex-col gap-6">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-widest text-zinc-400">
            Inspector
          </h2>
          <div className="mt-4 space-y-4">
            <div className="rounded-lg border border-[#1f2636] bg-[#141a28] p-4">
              <h3 className="text-xs font-semibold uppercase text-zinc-400">Content</h3>
              {primarySelection ? (
                <div className="mt-3 space-y-2 text-xs text-zinc-300">
                  <div className="flex items-center justify-between">
                    <span>Type</span>
                    <span className="font-semibold capitalize">{primarySelection.type}</span>
                  </div>
                  {primarySelection.type === 'text' && (
                    <input
                      className="w-full rounded-md border border-[#2a3346] bg-[#0f1420] px-2 py-1 text-xs"
                      value={primarySelection.text ?? ''}
                      onChange={(event) => updateElement(primarySelection.id, { text: event.target.value })}
                    />
                  )}
                  {primarySelection.type === 'image' && (
                    <input
                      className="w-full rounded-md border border-[#2a3346] bg-[#0f1420] px-2 py-1 text-xs"
                      placeholder="Image URL"
                      value={primarySelection.src ?? ''}
                      onChange={(event) => updateElement(primarySelection.id, { src: event.target.value })}
                    />
                  )}
                </div>
              ) : (
                <div className="mt-3 text-xs text-zinc-500">Select an element to edit.</div>
              )}
            </div>

            <div className="rounded-lg border border-[#1f2636] bg-[#141a28] p-4">
              <h3 className="text-xs font-semibold uppercase text-zinc-400">Transform</h3>
              {primarySelection ? (
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  {[
                    { label: 'X', key: 'x' },
                    { label: 'Y', key: 'y' },
                    { label: 'W', key: 'width' },
                    { label: 'H', key: 'height' },
                    { label: 'Rot', key: 'rotation' },
                  ].map((field) => (
                    <label key={field.key} className="flex flex-col gap-1 text-zinc-400">
                      <span>{field.label}</span>
                      <input
                        type="number"
                        className="rounded-md border border-[#2a3346] bg-[#0f1420] px-2 py-1 text-xs text-white"
                        value={primarySelection[field.key as keyof StudioElement] as number}
                        onChange={(event) =>
                          updateElement(primarySelection.id, {
                            [field.key]: Number(event.target.value),
                          } as Partial<StudioElement>)
                        }
                      />
                    </label>
                  ))}
                </div>
              ) : (
                <div className="mt-3 text-xs text-zinc-500">No selection.</div>
              )}
            </div>

            <div className="rounded-lg border border-[#1f2636] bg-[#141a28] p-4">
              <h3 className="text-xs font-semibold uppercase text-zinc-400">Appearance</h3>
              {primarySelection ? (
                <div className="mt-3 space-y-3 text-xs">
                  <label className="flex flex-col gap-1 text-zinc-400">
                    Opacity
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={primarySelection.opacity}
                      onChange={(event) =>
                        updateElement(primarySelection.id, { opacity: Number(event.target.value) })
                      }
                    />
                  </label>
                  <label className="flex items-center justify-between gap-2 text-zinc-400">
                    Color
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={primarySelection.fill}
                        onChange={(event) => updateElement(primarySelection.id, { fill: event.target.value })}
                        className="h-6 w-6 rounded border border-[#2a3346] bg-transparent"
                      />
                      <input
                        className="w-24 rounded-md border border-[#2a3346] bg-[#0f1420] px-2 py-1 text-xs text-white"
                        value={primarySelection.fill}
                        onChange={(event) => updateElement(primarySelection.id, { fill: event.target.value })}
                      />
                    </div>
                  </label>
                  <label className="flex items-center justify-between gap-2 text-zinc-400">
                    Border
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        className="w-16 rounded-md border border-[#2a3346] bg-[#0f1420] px-2 py-1 text-xs text-white"
                        value={primarySelection.borderWidth}
                        onChange={(event) =>
                          updateElement(primarySelection.id, {
                            borderWidth: Number(event.target.value),
                          })
                        }
                      />
                      <input
                        type="color"
                        value={primarySelection.borderColor}
                        onChange={(event) =>
                          updateElement(primarySelection.id, { borderColor: event.target.value })
                        }
                        className="h-6 w-6 rounded border border-[#2a3346] bg-transparent"
                      />
                    </div>
                  </label>
                </div>
              ) : (
                <div className="mt-3 text-xs text-zinc-500">No selection.</div>
              )}
            </div>

            <div className="rounded-lg border border-[#1f2636] bg-[#141a28] p-4">
              <h3 className="text-xs font-semibold uppercase text-zinc-400">Data Binding</h3>
              {primarySelection ? (
                <div className="mt-3 space-y-3 text-xs text-zinc-300">
                  <label className="flex flex-col gap-1">
                    Source
                    <select
                      className="rounded-md border border-[#2a3346] bg-[#0f1420] px-2 py-1 text-xs"
                      value={primarySelection.dataSource ?? 'static'}
                      onChange={(event) =>
                        updateElement(primarySelection.id, { dataSource: event.target.value })
                      }
                    >
                      <option value="static">Static Text</option>
                      <option value="supabase">Supabase Data</option>
                    </select>
                  </label>
                  {primarySelection.dataSource === 'supabase' && (
                    <label className="flex flex-col gap-1">
                      Path
                      <select
                        className="rounded-md border border-[#2a3346] bg-[#0f1420] px-2 py-1 text-xs"
                        value={primarySelection.dataPath ?? dataPaths[0]}
                        onChange={(event) =>
                          updateElement(primarySelection.id, { dataPath: event.target.value })
                        }
                      >
                        {dataPaths.map((path) => (
                          <option key={path} value={path}>
                            {path}
                          </option>
                        ))}
                      </select>
                    </label>
                  )}
                </div>
              ) : (
                <div className="mt-3 text-xs text-zinc-500">No data binding available.</div>
              )}
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-[#1f2636] bg-[#141a28] p-3 text-xs text-zinc-400">
          Selected Elements: {selectedIds.length ? selectedIds.join(', ') : 'None'}
        </div>
      </aside>
    </div>
  );
}
