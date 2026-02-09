import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Eye,
  EyeOff,
  GripVertical,
  Lock,
  Unlock,
  Type,
  Image as ImageIcon,
  Square,
  LayoutTemplate,
} from 'lucide-react';
import type { LayoutElement, LayoutState } from '../types';

const canvasSize = { width: 1920, height: 1080 };
const canvasScale = 0.5;

const buildingBlocks = [
  { id: 'text', label: 'Text', icon: Type },
  { id: 'image', label: 'Image', icon: ImageIcon },
  { id: 'rectangle', label: 'Rectangle', icon: Square },
  { id: 'container', label: 'Container', icon: LayoutTemplate },
];

const initialLayout: LayoutState = {
  elements: [
    {
      id: 'bg',
      type: 'rectangle',
      name: 'Background',
      x: 0,
      y: 0,
      width: 1920,
      height: 1080,
      rotation: 0,
      opacity: 1,
      fill: '#0a0a0f',
      stroke: '#1f2937',
      strokeWidth: 0,
      locked: true,
      hidden: false,
      dataSource: 'static',
      dataPath: '',
    },
    {
      id: 'score',
      type: 'container',
      name: 'Scorebug',
      x: 64,
      y: 860,
      width: 520,
      height: 160,
      rotation: 0,
      opacity: 0.95,
      fill: '#101827',
      stroke: '#2563eb',
      strokeWidth: 2,
      locked: false,
      hidden: false,
      dataSource: 'supabase',
      dataPath: 'game.score.home',
    },
    {
      id: 'lower-third',
      type: 'text',
      name: 'Lower Third',
      x: 220,
      y: 640,
      width: 1480,
      height: 120,
      rotation: 0,
      opacity: 1,
      fill: '#111827',
      stroke: '#475569',
      strokeWidth: 1,
      locked: false,
      hidden: false,
      dataSource: 'supabase',
      dataPath: 'player.name',
      text: 'Player Name · Position',
    },
    {
      id: 'logo',
      type: 'image',
      name: 'Team Logo',
      x: 1600,
      y: 48,
      width: 240,
      height: 240,
      rotation: 0,
      opacity: 1,
      fill: '#0f172a',
      stroke: '#334155',
      strokeWidth: 1,
      locked: false,
      hidden: false,
      dataSource: 'static',
      dataPath: '',
      src: 'logo.png',
    },
  ],
};

type DragState = {
  id: string;
  startX: number;
  startY: number;
  originX: number;
  originY: number;
  axisLock: 'x' | 'y' | null;
};

export default function StudioBuilder() {
  const [layout, setLayout] = useState<LayoutState>(initialLayout);
  const [selectedElementIds, setSelectedElementIds] = useState<string[]>(['score']);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [draggedLayerId, setDraggedLayerId] = useState<string | null>(null);

  const selectedElements = useMemo(
    () => layout.elements.filter((element) => selectedElementIds.includes(element.id)),
    [layout.elements, selectedElementIds],
  );

  const primarySelection = selectedElements[0];

  const updateElement = useCallback((id: string, updates: Partial<LayoutElement>) => {
    setLayout((prev) => ({
      elements: prev.elements.map((element) =>
        element.id === id ? { ...element, ...updates } : element,
      ),
    }));
  }, []);

  const toggleSelection = (id: string, multi: boolean) => {
    setSelectedElementIds((prev) => {
      if (multi) {
        return prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id];
      }
      return prev.includes(id) && prev.length === 1 ? prev : [id];
    });
  };

  const handleStageMouseDown = () => {
    setSelectedElementIds([]);
  };

  const startDrag = (event: React.MouseEvent, element: LayoutElement) => {
    if (element.locked || element.hidden) {
      return;
    }
    event.stopPropagation();
    const startX = event.clientX;
    const startY = event.clientY;
    setDragState({
      id: element.id,
      startX,
      startY,
      originX: element.x,
      originY: element.y,
      axisLock: null,
    });
  };

  useEffect(() => {
    if (!dragState) {
      return;
    }

    const handleMouseMove = (event: MouseEvent) => {
      const element = layout.elements.find((item) => item.id === dragState.id);
      if (!element) {
        return;
      }

      const deltaX = (event.clientX - dragState.startX) / canvasScale;
      const deltaY = (event.clientY - dragState.startY) / canvasScale;
      let axisLock = dragState.axisLock;
      if (event.shiftKey && !axisLock) {
        axisLock = Math.abs(deltaX) > Math.abs(deltaY) ? 'x' : 'y';
      }
      const nextX = dragState.originX + (axisLock === 'y' ? 0 : deltaX);
      const nextY = dragState.originY + (axisLock === 'x' ? 0 : deltaY);

      setDragState((prev) => (prev ? { ...prev, axisLock } : prev));
      updateElement(dragState.id, { x: Math.round(nextX), y: Math.round(nextY) });
    };

    const handleMouseUp = () => {
      setDragState(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragState, layout.elements, updateElement]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (selectedElementIds.length === 0) {
        return;
      }
      const step = event.shiftKey ? 10 : 1;
      let deltaX = 0;
      let deltaY = 0;

      if (event.key === 'ArrowUp') deltaY = -step;
      if (event.key === 'ArrowDown') deltaY = step;
      if (event.key === 'ArrowLeft') deltaX = -step;
      if (event.key === 'ArrowRight') deltaX = step;

      if (deltaX === 0 && deltaY === 0) {
        return;
      }

      event.preventDefault();

      setLayout((prev) => ({
        elements: prev.elements.map((element) =>
          selectedElementIds.includes(element.id)
            ? {
                ...element,
                x: element.x + deltaX,
                y: element.y + deltaY,
              }
            : element,
        ),
      }));
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedElementIds]);

  const handleLayerDragStart = (id: string) => {
    setDraggedLayerId(id);
  };

  const handleLayerDrop = (targetId: string) => {
    if (!draggedLayerId || draggedLayerId === targetId) {
      return;
    }
    setLayout((prev) => {
      const elements = [...prev.elements];
      const draggedIndex = elements.findIndex((element) => element.id === draggedLayerId);
      const targetIndex = elements.findIndex((element) => element.id === targetId);
      if (draggedIndex === -1 || targetIndex === -1) {
        return prev;
      }
      const [moved] = elements.splice(draggedIndex, 1);
      elements.splice(targetIndex, 0, moved);
      return { elements };
    });
    setDraggedLayerId(null);
  };

  const centerGuides = useMemo(() => {
    if (!primarySelection) {
      return { showVertical: false, showHorizontal: false };
    }
    const threshold = 8;
    const centerX = primarySelection.x + primarySelection.width / 2;
    const centerY = primarySelection.y + primarySelection.height / 2;
    return {
      showVertical: Math.abs(centerX - canvasSize.width / 2) < threshold,
      showHorizontal: Math.abs(centerY - canvasSize.height / 2) < threshold,
    };
  }, [primarySelection]);

  const edgeGuides = useMemo(() => {
    if (!primarySelection) {
      return { showLeft: false, showRight: false, showTop: false, showBottom: false };
    }
    const threshold = 6;
    return {
      showLeft: primarySelection.x < threshold,
      showRight: canvasSize.width - (primarySelection.x + primarySelection.width) < threshold,
      showTop: primarySelection.y < threshold,
      showBottom: canvasSize.height - (primarySelection.y + primarySelection.height) < threshold,
    };
  }, [primarySelection]);

  const axisLockLabel = dragState?.axisLock
    ? `Axis Lock: ${dragState.axisLock.toUpperCase()}`
    : 'Axis Lock: Off';

  return (
    <div className="w-screen h-screen bg-zinc-950 text-white flex">
      <aside className="w-80 border-r border-zinc-800 p-4 flex flex-col gap-6">
        <div>
          <h2 className="text-lg font-semibold">Layer Stack</h2>
          <div className="mt-3 space-y-2">
            {layout.elements.map((layer) => {
              const isSelected = selectedElementIds.includes(layer.id);
              return (
                <div
                  key={layer.id}
                  draggable
                  onDragStart={() => handleLayerDragStart(layer.id)}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={() => handleLayerDrop(layer.id)}
                  className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition ${
                    isSelected
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-zinc-800 bg-zinc-900/70'
                  }`}
                >
                  <button
                    type="button"
                    className="cursor-grab text-zinc-500 hover:text-zinc-200"
                    onClick={() => toggleSelection(layer.id, false)}
                  >
                    <GripVertical className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleSelection(layer.id, false)}
                    className="flex-1 text-left"
                  >
                    <div className="font-medium">{layer.name}</div>
                    <div className="text-xs text-zinc-400">{layer.type}</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => updateElement(layer.id, { hidden: !layer.hidden })}
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
              );
            })}
          </div>
        </div>
        <div>
          <h2 className="text-lg font-semibold">Building Blocks</h2>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {buildingBlocks.map((block) => {
              const Icon = block.icon;
              return (
                <button
                  key={block.id}
                  draggable
                  type="button"
                  className="flex items-center justify-center gap-2 rounded-lg border border-dashed border-zinc-700 bg-zinc-900/70 px-3 py-4 text-xs text-zinc-300"
                >
                  <Icon className="h-4 w-4" />
                  {block.label}
                </button>
              );
            })}
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col">
        <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-2 text-sm">
          <div className="flex items-center gap-3 text-zinc-300">
            <span>Ctrl/⌘ + Click: Multi-select</span>
            <span>Shift + Drag: Axis Lock</span>
            <span>Arrow Keys: Nudge</span>
          </div>
          <div className="text-zinc-400">{axisLockLabel}</div>
        </div>
        <div className="flex-1 flex items-center justify-center bg-zinc-900/40">
          <div className="relative" style={{ width: canvasSize.width * canvasScale, height: canvasSize.height * canvasScale }}>
            <div className="absolute left-0 top-0 h-7 w-full border-b border-zinc-800 bg-zinc-900/80 text-[10px] text-zinc-400">
              {Array.from({ length: 19 }).map((_, index) => {
                const value = index * 100;
                return (
                  <div
                    key={value}
                    className="absolute top-0 h-full"
                    style={{ left: value * canvasScale }}
                  >
                    <div className="h-2 w-px bg-zinc-500" />
                    {index % 2 === 0 && (
                      <div className="mt-1 -translate-x-2">{value}</div>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="absolute left-0 top-0 h-full w-7 border-r border-zinc-800 bg-zinc-900/80 text-[10px] text-zinc-400">
              {Array.from({ length: 11 }).map((_, index) => {
                const value = index * 100;
                return (
                  <div
                    key={value}
                    className="absolute left-0 w-full"
                    style={{ top: value * canvasScale }}
                  >
                    <div className="ml-2 h-px w-2 bg-zinc-500" />
                    {index % 2 === 0 && (
                      <div className="mt-1 ml-1">{value}</div>
                    )}
                  </div>
                );
              })}
            </div>
            <div
              className="absolute left-7 top-7 rounded-lg border border-zinc-700 bg-zinc-950 shadow-xl"
              style={{ width: canvasSize.width * canvasScale, height: canvasSize.height * canvasScale }}
              onMouseDown={handleStageMouseDown}
            >
              {(centerGuides.showVertical || edgeGuides.showLeft || edgeGuides.showRight) && (
                <div className="absolute inset-0">
                  {centerGuides.showVertical && (
                    <div className="absolute left-1/2 top-0 h-full w-px bg-cyan-400/80" />
                  )}
                  {edgeGuides.showLeft && (
                    <div className="absolute left-0 top-0 h-full w-px bg-cyan-400/80" />
                  )}
                  {edgeGuides.showRight && (
                    <div className="absolute right-0 top-0 h-full w-px bg-cyan-400/80" />
                  )}
                </div>
              )}
              {(centerGuides.showHorizontal || edgeGuides.showTop || edgeGuides.showBottom) && (
                <div className="absolute inset-0">
                  {centerGuides.showHorizontal && (
                    <div className="absolute left-0 top-1/2 h-px w-full bg-cyan-400/80" />
                  )}
                  {edgeGuides.showTop && (
                    <div className="absolute left-0 top-0 h-px w-full bg-cyan-400/80" />
                  )}
                  {edgeGuides.showBottom && (
                    <div className="absolute left-0 bottom-0 h-px w-full bg-cyan-400/80" />
                  )}
                </div>
              )}
              {layout.elements.map((element) => {
                if (element.hidden) {
                  return null;
                }
                const isSelected = selectedElementIds.includes(element.id);
                return (
                  <div
                    key={element.id}
                    onMouseDown={(event) => {
                      const isMulti = event.ctrlKey || event.metaKey;
                      toggleSelection(element.id, isMulti);
                      startDrag(event, element);
                    }}
                    className="absolute cursor-move"
                    style={{
                      left: element.x * canvasScale,
                      top: element.y * canvasScale,
                      width: element.width * canvasScale,
                      height: element.height * canvasScale,
                      transform: `rotate(${element.rotation}deg)`,
                      opacity: element.opacity,
                      backgroundColor: element.fill,
                      border: `${element.strokeWidth}px solid ${element.stroke}`,
                      borderRadius: element.type === 'container' ? 16 : 6,
                      zIndex: layout.elements.indexOf(element) + 1,
                    }}
                  >
                    <div className="flex h-full w-full items-center justify-center text-xs text-zinc-200">
                      {element.type === 'text' && element.text}
                      {element.type === 'image' && element.src}
                      {element.type === 'rectangle' && 'Rectangle'}
                      {element.type === 'container' && 'Container'}
                    </div>
                    {isSelected && (
                      <div className="pointer-events-none absolute inset-0 border border-cyan-300">
                        {[
                          'top-0 left-0',
                          'top-0 right-0',
                          'bottom-0 left-0',
                          'bottom-0 right-0',
                          'top-1/2 left-0',
                          'top-1/2 right-0',
                          'left-1/2 top-0',
                          'left-1/2 bottom-0',
                        ].map((position) => (
                          <div
                            key={position}
                            className={`absolute h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-sm bg-cyan-300 ${position}`}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </main>

      <aside className="w-80 border-l border-zinc-800 p-4 flex flex-col gap-6">
        <div>
          <h2 className="text-lg font-semibold">Inspector</h2>
          {!primarySelection && (
            <div className="mt-4 rounded-lg border border-zinc-800 bg-zinc-900/70 p-4 text-sm text-zinc-400">
              Select a layer to edit its properties.
            </div>
          )}
          {primarySelection && (
            <div className="mt-3 space-y-4">
              <div className="rounded-lg border border-zinc-800 bg-zinc-900/70 p-3">
                <h3 className="text-sm font-semibold">Content · {primarySelection.type}</h3>
                <div className="mt-2 text-xs text-zinc-400">
                  {primarySelection.type === 'text' && 'Edit headline and ticker copy.'}
                  {primarySelection.type === 'image' && 'Update image source or placeholder.'}
                  {primarySelection.type === 'rectangle' && 'Adjust shape styling and fills.'}
                  {primarySelection.type === 'container' && 'Control grouped layout.'}
                </div>
              </div>
              <div className="rounded-lg border border-zinc-800 bg-zinc-900/70 p-3">
                <h3 className="text-sm font-semibold">Transform</h3>
                <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-zinc-300">
                  {([
                    { label: 'X', value: primarySelection.x, key: 'x' },
                    { label: 'Y', value: primarySelection.y, key: 'y' },
                    { label: 'W', value: primarySelection.width, key: 'width' },
                    { label: 'H', value: primarySelection.height, key: 'height' },
                  ] as { label: string; value: number; key: keyof LayoutElement }[]).map((field) => (
                    <label key={field.label} className="flex flex-col gap-1">
                      <span>{field.label}</span>
                      <input
                        type="number"
                        className="rounded-md border border-zinc-700 bg-zinc-950/70 px-2 py-1 text-xs"
                        value={field.value}
                        onChange={(event) =>
                          updateElement(primarySelection.id, {
                            [field.key]: Number(event.target.value),
                          })
                        }
                      />
                    </label>
                  ))}
                  <label className="flex flex-col gap-1">
                    <span>Rotation</span>
                    <input
                      type="number"
                      className="rounded-md border border-zinc-700 bg-zinc-950/70 px-2 py-1 text-xs"
                      value={primarySelection.rotation}
                      onChange={(event) =>
                        updateElement(primarySelection.id, {
                          rotation: Number(event.target.value),
                        })
                      }
                    />
                  </label>
                </div>
              </div>
              <div className="rounded-lg border border-zinc-800 bg-zinc-900/70 p-3">
                <h3 className="text-sm font-semibold">Appearance</h3>
                <div className="mt-3 space-y-3 text-xs text-zinc-300">
                  <label className="flex flex-col gap-1">
                    <span>Opacity</span>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={Math.round(primarySelection.opacity * 100)}
                      onChange={(event) =>
                        updateElement(primarySelection.id, {
                          opacity: Number(event.target.value) / 100,
                        })
                      }
                    />
                  </label>
                  <div className="flex items-center justify-between gap-2">
                    <label className="flex flex-col gap-1 flex-1">
                      <span>Fill</span>
                      <input
                        type="text"
                        className="rounded-md border border-zinc-700 bg-zinc-950/70 px-2 py-1 text-xs"
                        value={primarySelection.fill}
                        onChange={(event) =>
                          updateElement(primarySelection.id, { fill: event.target.value })
                        }
                      />
                    </label>
                    <input
                      type="color"
                      value={primarySelection.fill}
                      onChange={(event) =>
                        updateElement(primarySelection.id, { fill: event.target.value })
                      }
                      className="h-9 w-9 rounded-md border border-zinc-700 bg-zinc-950/70"
                    />
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <label className="flex flex-col gap-1 flex-1">
                      <span>Stroke</span>
                      <input
                        type="text"
                        className="rounded-md border border-zinc-700 bg-zinc-950/70 px-2 py-1 text-xs"
                        value={primarySelection.stroke}
                        onChange={(event) =>
                          updateElement(primarySelection.id, { stroke: event.target.value })
                        }
                      />
                    </label>
                    <input
                      type="number"
                      min="0"
                      className="w-16 rounded-md border border-zinc-700 bg-zinc-950/70 px-2 py-1 text-xs"
                      value={primarySelection.strokeWidth}
                      onChange={(event) =>
                        updateElement(primarySelection.id, {
                          strokeWidth: Number(event.target.value),
                        })
                      }
                    />
                  </div>
                </div>
              </div>
              <div className="rounded-lg border border-zinc-800 bg-zinc-900/70 p-3">
                <h3 className="text-sm font-semibold">Data Binding</h3>
                <div className="mt-2 space-y-3 text-xs text-zinc-300">
                  <label className="flex flex-col gap-1">
                    <span>Source</span>
                    <select
                      className="rounded-md border border-zinc-700 bg-zinc-950/70 px-2 py-1 text-xs"
                      value={primarySelection.dataSource}
                      onChange={(event) =>
                        updateElement(primarySelection.id, {
                          dataSource: event.target.value as LayoutElement['dataSource'],
                        })
                      }
                    >
                      <option value="static">Static Text</option>
                      <option value="supabase">Supabase Data</option>
                    </select>
                  </label>
                  {primarySelection.dataSource === 'supabase' && (
                    <label className="flex flex-col gap-1">
                      <span>Path</span>
                      <select
                        className="rounded-md border border-zinc-700 bg-zinc-950/70 px-2 py-1 text-xs"
                        value={primarySelection.dataPath}
                        onChange={(event) =>
                          updateElement(primarySelection.id, { dataPath: event.target.value })
                        }
                      >
                        <optgroup label="Game">
                          <option value="game.score.home">game.score.home</option>
                          <option value="game.score.away">game.score.away</option>
                          <option value="game.inning">game.inning</option>
                          <option value="game.clock">game.clock</option>
                        </optgroup>
                        <optgroup label="Player">
                          <option value="player.name">player.name</option>
                          <option value="player.position">player.position</option>
                        </optgroup>
                      </select>
                    </label>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/70 p-3 text-xs text-zinc-400">
          Selected Elements: {selectedElementIds.length > 0 ? selectedElementIds.join(', ') : 'None'}
        </div>
      </aside>
    </div>
  );
}
