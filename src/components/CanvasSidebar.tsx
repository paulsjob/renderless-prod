import React from 'react';
import {
  AlignCenter,
  AlignHorizontalDistributeCenter,
  AlignLeft,
  AlignRight,
  AlignVerticalDistributeCenter,
} from 'lucide-react';
import type { Element as LayoutElement, Layout } from '../types';

const dataPaths = [
  'game.score.home',
  'game.score.away',
  'game.inning',
  'game.clock',
  'game.ticker',
];

type CanvasSidebarProps = {
  layout: Layout;
  selectedIds: string[];
  alignContext: 'selection' | 'stage';
  onUpdateElement: (id: string, updates: Partial<LayoutElement>) => void;
  onSelectionChange: (ids: string[]) => void;
};

export const CanvasSidebar = ({
  layout,
  selectedIds,
  alignContext,
  onUpdateElement,
  onSelectionChange,
}: CanvasSidebarProps) => {
  const elements = layout.elements;
  const stageWidth = 1920;
  const primarySelection = elements.find((element) => element.id === selectedIds[0]);
  const hasSelection = selectedIds.length > 0;
  const isMixedSelection = selectedIds.length > 1;

  const alignSelected = (mode: 'left' | 'center' | 'right') => {
    if (selectedIds.length < 2) return;
    const selected = elements.filter((element) => selectedIds.includes(element.id));
    const minX = alignContext === 'stage' ? 0 : Math.min(...selected.map((item) => item.x));
    const maxX =
      alignContext === 'stage'
        ? stageWidth
        : Math.max(...selected.map((item) => item.x + item.width));
    const targetX =
      mode === 'left'
        ? minX
        : mode === 'right'
          ? maxX
          : alignContext === 'stage'
            ? stageWidth / 2
            : (minX + maxX) / 2;
    selected.forEach((element) => {
      if (mode === 'center') {
        onUpdateElement(element.id, { x: targetX - element.width / 2 });
      } else if (mode === 'left') {
        onUpdateElement(element.id, { x: minX });
      } else {
        onUpdateElement(element.id, { x: targetX - element.width });
      }
    });
  };

  const distributeSelected = (axis: 'x' | 'y') => {
    if (selectedIds.length < 3) return;
    const selected = elements.filter((element) => selectedIds.includes(element.id));
    const sorted = [...selected].sort((a, b) => a[axis] - b[axis]);
    const start = sorted[0][axis];
    const end = sorted[sorted.length - 1][axis];
    const step = (end - start) / (sorted.length - 1);
    sorted.forEach((element, index) => {
      if (index === 0 || index === sorted.length - 1) return;
      onUpdateElement(element.id, { [axis]: start + step * index } as Partial<LayoutElement>);
    });
  };

  const handleDataSourceChange = (value: string) => {
    if (!primarySelection) return;
    onUpdateElement(primarySelection.id, { dataSource: value });
    if (value !== 'supabase') {
      onUpdateElement(primarySelection.id, { dataPath: undefined });
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-[0.3em] text-zinc-400">Inspector</h2>
        <p className="mt-2 text-xs text-zinc-500">Edit selection attributes and data bindings.</p>
      </div>

      <div className="rounded-lg border border-[#1f2636] bg-[#141a28] p-4">
        <h3 className="text-xs font-semibold uppercase text-zinc-400">Data Source</h3>
        {primarySelection && !isMixedSelection ? (
          <div className="mt-3 space-y-3 text-xs text-zinc-300">
            <label className="flex flex-col gap-1">
              Source
              <select
                className="rounded-md border border-[#2a3346] bg-[#0f1420] px-2 py-1 text-xs"
                value={primarySelection.dataSource ?? 'static'}
                onChange={(event) => handleDataSourceChange(event.target.value)}
              >
                <option value="static">Manual</option>
                <option value="supabase">Supabase</option>
              </select>
            </label>
            {primarySelection.dataSource === 'supabase' && (
              <label className="flex flex-col gap-1">
                Key
                <select
                  className="rounded-md border border-[#2a3346] bg-[#0f1420] px-2 py-1 text-xs"
                  value={primarySelection.dataPath ?? dataPaths[0]}
                  onChange={(event) =>
                    onUpdateElement(primarySelection.id, { dataPath: event.target.value })
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
            {primarySelection.type === 'text' && (
              <label className="flex flex-col gap-1">
                Text
                <input
                  className="rounded-md border border-[#2a3346] bg-[#0f1420] px-2 py-1 text-xs text-white"
                  value={primarySelection.text ?? ''}
                  onChange={(event) =>
                    onUpdateElement(primarySelection.id, { text: event.target.value })
                  }
                />
              </label>
            )}
            {primarySelection.type === 'image' && (
              <label className="flex flex-col gap-1">
                Image URL
                <input
                  className="rounded-md border border-[#2a3346] bg-[#0f1420] px-2 py-1 text-xs text-white"
                  value={primarySelection.src ?? ''}
                  onChange={(event) =>
                    onUpdateElement(primarySelection.id, { src: event.target.value })
                  }
                />
              </label>
            )}
          </div>
        ) : (
          <div className="mt-3 text-xs text-zinc-500">
            {hasSelection ? 'Mixed Selection' : 'No Selection'}
          </div>
        )}
      </div>

      <div className="rounded-lg border border-[#1f2636] bg-[#141a28] p-4">
        <h3 className="text-xs font-semibold uppercase text-zinc-400">Transform</h3>
        {primarySelection && !isMixedSelection ? (
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
            {[
              { label: 'X', key: 'x', unit: true },
              { label: 'Y', key: 'y', unit: true },
              { label: 'W', key: 'width', unit: true },
              { label: 'H', key: 'height', unit: true },
              { label: 'Rot', key: 'rotation', unit: false },
            ].map((field) => (
              <label key={field.key} className="flex flex-col gap-1 text-zinc-400">
                <span>{field.label}</span>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    className="flex-1 rounded-md border border-[#2a3346] bg-[#0f1420] px-2 py-1 text-xs text-white"
                    value={primarySelection[field.key as keyof LayoutElement] as number}
                    onChange={(event) =>
                      onUpdateElement(primarySelection.id, {
                        [field.key]: Number(event.target.value),
                      } as Partial<LayoutElement>)
                    }
                  />
                  {field.unit && (
                    <div className="flex items-center gap-1 text-[10px] text-zinc-500">
                      <span className="rounded border border-[#2a3346] px-1 py-0.5">px</span>
                      <span className="rounded border border-[#2a3346] px-1 py-0.5">%</span>
                    </div>
                  )}
                </div>
              </label>
            ))}
          </div>
        ) : (
          <div className="mt-3 text-xs text-zinc-500">
            {hasSelection ? 'Mixed Selection' : 'No Selection'}
          </div>
        )}
      </div>

      <div className="rounded-lg border border-[#1f2636] bg-[#141a28] p-4">
        <h3 className="text-xs font-semibold uppercase text-zinc-400">Appearance</h3>
        {primarySelection && !isMixedSelection ? (
          <div className="mt-3 space-y-3 text-xs">
            <label className="flex flex-col gap-1 text-zinc-400">
              Opacity
              <input
                type="range"
                min={0}
                max={100}
                value={primarySelection.opacity}
                onChange={(event) =>
                  onUpdateElement(primarySelection.id, { opacity: Number(event.target.value) })
                }
              />
            </label>
            <label className="flex items-center justify-between gap-2 text-zinc-400">
              Fill
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={primarySelection.fill ?? '#111827'}
                  onChange={(event) =>
                    onUpdateElement(primarySelection.id, { fill: event.target.value })
                  }
                  className="h-6 w-6 rounded border border-[#2a3346] bg-transparent"
                />
                <input
                  className="w-24 rounded-md border border-[#2a3346] bg-[#0f1420] px-2 py-1 text-xs text-white"
                  value={primarySelection.fill ?? '#111827'}
                  onChange={(event) =>
                    onUpdateElement(primarySelection.id, { fill: event.target.value })
                  }
                />
              </div>
            </label>
            <label className="flex items-center justify-between gap-2 text-zinc-400">
              Border
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  className="w-16 rounded-md border border-[#2a3346] bg-[#0f1420] px-2 py-1 text-xs text-white"
                  value={primarySelection.borderWidth ?? 0}
                  onChange={(event) =>
                    onUpdateElement(primarySelection.id, {
                      borderWidth: Number(event.target.value),
                    })
                  }
                />
                <input
                  type="color"
                  value={primarySelection.borderColor ?? '#111827'}
                  onChange={(event) =>
                    onUpdateElement(primarySelection.id, { borderColor: event.target.value })
                  }
                  className="h-6 w-6 rounded border border-[#2a3346] bg-transparent"
                />
              </div>
            </label>
            <label className="flex items-center justify-between gap-2 text-zinc-400">
              Masks
              <input
                type="checkbox"
                checked={primarySelection.maskEnabled ?? false}
                onChange={(event) =>
                  onUpdateElement(primarySelection.id, { maskEnabled: event.target.checked })
                }
              />
            </label>
          </div>
        ) : (
          <div className="mt-3 text-xs text-zinc-500">
            {hasSelection ? 'Mixed Selection' : 'No Selection'}
          </div>
        )}
      </div>

      <div className="rounded-lg border border-[#1f2636] bg-[#141a28] p-4">
        <h3 className="text-xs font-semibold uppercase text-zinc-400">Alignment</h3>
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          <button
            type="button"
            onClick={() => alignSelected('left')}
            className="flex items-center gap-1 rounded-md border border-[#2a3346] bg-[#0f1420] px-2 py-1 text-zinc-300 hover:text-white"
          >
            <AlignLeft className="h-3 w-3" />
            Left
          </button>
          <button
            type="button"
            onClick={() => alignSelected('center')}
            className="flex items-center gap-1 rounded-md border border-[#2a3346] bg-[#0f1420] px-2 py-1 text-zinc-300 hover:text-white"
          >
            <AlignCenter className="h-3 w-3" />
            Center
          </button>
          <button
            type="button"
            onClick={() => alignSelected('right')}
            className="flex items-center gap-1 rounded-md border border-[#2a3346] bg-[#0f1420] px-2 py-1 text-zinc-300 hover:text-white"
          >
            <AlignRight className="h-3 w-3" />
            Right
          </button>
          <button
            type="button"
            onClick={() => distributeSelected('x')}
            className="flex items-center gap-1 rounded-md border border-[#2a3346] bg-[#0f1420] px-2 py-1 text-zinc-300 hover:text-white"
          >
            <AlignHorizontalDistributeCenter className="h-3 w-3" />
            Distribute X
          </button>
          <button
            type="button"
            onClick={() => distributeSelected('y')}
            className="flex items-center gap-1 rounded-md border border-[#2a3346] bg-[#0f1420] px-2 py-1 text-zinc-300 hover:text-white"
          >
            <AlignVerticalDistributeCenter className="h-3 w-3" />
            Distribute Y
          </button>
        </div>
        {selectedIds.length > 1 ? (
          <p className="mt-2 text-[11px] text-zinc-500">
            Align {selectedIds.length} selected layers.
          </p>
        ) : (
          <p className="mt-2 text-[11px] text-zinc-500">Select multiple layers to align.</p>
        )}
      </div>

      <div className="rounded-lg border border-[#1f2636] bg-[#141a28] p-3 text-xs text-zinc-400">
        <div className="flex items-center justify-between">
          <span>Selected</span>
          <span>{selectedIds.length ? selectedIds.join(', ') : 'None'}</span>
        </div>
        {selectedIds.length > 0 && (
          <button
            type="button"
            onClick={() => onSelectionChange([])}
            className="mt-2 w-full rounded-md border border-[#2a3346] bg-[#0f1420] px-2 py-1 text-xs text-zinc-300 hover:text-white"
          >
            Clear Selection
          </button>
        )}
      </div>
    </div>
  );
};
