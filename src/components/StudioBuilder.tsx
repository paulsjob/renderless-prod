import React, { useEffect, useMemo, useState } from 'react';
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
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
import { CanvasSidebar } from './CanvasSidebar';
import { CanvasStage } from './CanvasStage';
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
  const { layout, setLayout } = useBroadcastController();
  const [selectedIds, setSelectedIds] = useState<string[]>(['headline']);
  const [snapEnabled, setSnapEnabled] = useState(true);
  const [showRulers, setShowRulers] = useState(true);
  const [canvasScale, setCanvasScale] = useState(0.55);
  const [dragLayerId, setDragLayerId] = useState<string | null>(null);

  useEffect(() => {
    if (!layout) {
      setLayout(initialLayout);
    }
  }, [layout, setLayout]);

  const activeLayout = layout ?? initialLayout;
  const elements = activeLayout.elements;
  const selectedElements = useMemo(
    () => elements.filter((element) => selectedIds.includes(element.id)),
    [elements, selectedIds],
  );

  const primarySelection = selectedElements[0];

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

  const addElement = (type: LayoutElement['type']) => {
    const id = `${type}-${Date.now()}`;
    const newElement: LayoutElement = {
      id,
      type,
      name: `${type[0].toUpperCase()}${type.slice(1)} Layer`,
      visible: true,
      hidden: false,
      locked: false,
      x: 240,
      y: 220,
      width: type === 'text' ? 360 : 260,
      height: type === 'text' ? 120 : 180,
      rotation: 0,
      opacity: 100,
      fill: '#111827',
      borderColor: '#38bdf8',
      borderWidth: 2,
      text: type === 'text' ? 'New Text' : undefined,
      dataSource: 'static',
      dataPath: 'static.text',
      maskEnabled: false,
    };
    setLayout((prev) => {
      const current = prev ?? initialLayout;
      return { ...current, elements: [...current.elements, newElement] };
    });
    setSelectedIds([id]);
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

  const handleLayerDrop = (event: React.DragEvent, dropId: string) => {
    event.preventDefault();
    if (!dragLayerId || dragLayerId === dropId) return;
    const sourceIndex = elements.findIndex((item) => item.id === dragLayerId);
    const targetIndex = elements.findIndex((item) => item.id === dropId);
    if (sourceIndex === -1 || targetIndex === -1) return;
    const next = [...elements];
    const [moved] = next.splice(sourceIndex, 1);
    next.splice(targetIndex, 0, moved);
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

  const handleAlign = (mode: 'left' | 'center' | 'right') => {
    if (selectedElements.length < 2) return;
    const minX = Math.min(...selectedElements.map((item) => item.x));
    const maxX = Math.max(...selectedElements.map((item) => item.x + item.width));
    const targetX = mode === 'left' ? minX : mode === 'right' ? maxX : (minX + maxX) / 2;
    setLayout((prev) => {
      const current = prev ?? initialLayout;
      return {
        ...current,
        elements: current.elements.map((element) => {
          if (!selectedIds.includes(element.id)) return element;
          if (mode === 'center') {
            return { ...element, x: targetX - element.width / 2 };
          }
          return { ...element, x: mode === 'left' ? minX : targetX - element.width };
        }),
      };
    });
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
    <div className="h-screen w-screen bg-[#0a0d14] text-white flex overflow-hidden">
      <aside className="w-[280px] border-r border-[#1d2331] bg-[#0f1420] p-4 flex flex-col gap-6">
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
                  onClick={() => addElement(block.id as LayoutElement['type'])}
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
                      onClick={(event) => handleLayerSelect(layer.id, event)}
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

        <div className="rounded-lg border border-[#1f2636] bg-[#141a28] p-3 text-xs text-zinc-400">
          Selected Elements: {selectedIds.length ? selectedIds.join(', ') : 'None'}
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
                checked={snapEnabled}
                onChange={() => setSnapEnabled((prev) => !prev)}
              />
              Snap
            </label>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => handleAlign('left')}
              className="flex items-center gap-1 rounded-md border border-[#1f2636] bg-[#141a28] px-2 py-1 text-[11px] text-zinc-300 hover:text-white"
            >
              <AlignLeft className="h-3 w-3" />
              Left
            </button>
            <button
              type="button"
              onClick={() => handleAlign('center')}
              className="flex items-center gap-1 rounded-md border border-[#1f2636] bg-[#141a28] px-2 py-1 text-[11px] text-zinc-300 hover:text-white"
            >
              <AlignCenter className="h-3 w-3" />
              Center
            </button>
            <button
              type="button"
              onClick={() => handleAlign('right')}
              className="flex items-center gap-1 rounded-md border border-[#1f2636] bg-[#141a28] px-2 py-1 text-[11px] text-zinc-300 hover:text-white"
            >
              <AlignRight className="h-3 w-3" />
              Right
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCanvasScale((prev) => Math.max(0.3, prev - 0.05))}
                className="rounded-md border border-[#1f2636] bg-[#141a28] px-2 py-1 text-[11px] text-zinc-300 hover:text-white"
              >
                -
              </button>
              <span className="text-[11px] text-zinc-400">{Math.round(canvasScale * 100)}%</span>
              <button
                type="button"
                onClick={() => setCanvasScale((prev) => Math.min(1, prev + 0.05))}
                className="rounded-md border border-[#1f2636] bg-[#141a28] px-2 py-1 text-[11px] text-zinc-300 hover:text-white"
              >
                +
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 bg-[#0b0f1a] p-6">
          <div className="relative h-full w-full overflow-auto rounded-2xl border border-[#1f2636] bg-[#0a0d14] p-6">
            <div
              className="relative"
              style={{
                width: canvasSize.width * canvasScale + (showRulers ? rulerSize : 0),
                height: canvasSize.height * canvasScale + (showRulers ? rulerSize : 0),
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
                className="absolute left-[24px] top-[24px] origin-top-left rounded-xl border border-[#2a3346] bg-[#0a0d14] shadow-2xl"
                style={{
                  width: canvasSize.width * canvasScale,
                  height: canvasSize.height * canvasScale,
                }}
              >
                <div
                  className="relative h-full w-full"
                  style={{ transform: `scale(${canvasScale})`, transformOrigin: 'top left' }}
                >
                  <CanvasStage
                    layout={activeLayout}
                    selectedIds={selectedIds}
                    snapEnabled={snapEnabled}
                    onSelectionChange={setSelectedIds}
                    onLayoutChange={setLayout}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <aside className="w-[300px] border-l border-[#1d2331] bg-[#0f1420] p-4 flex flex-col gap-6">
        <CanvasSidebar
          layout={activeLayout}
          selectedIds={selectedIds}
          onUpdateElement={updateElement}
          onSelectionChange={setSelectedIds}
        />
      </aside>
    </div>
  );
}
