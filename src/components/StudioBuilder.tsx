import React, { useState } from 'react';

const layerStack = [
  { id: 'bg', name: 'Background', locked: true, visible: true },
  { id: 'frame', name: 'Frame', locked: false, visible: true },
  { id: 'score', name: 'Scorebug', locked: false, visible: true },
  { id: 'lower-third', name: 'Lower Third', locked: false, visible: false },
];

const buildingBlocks = [
  { id: 'text', label: 'Text' },
  { id: 'image', label: 'Image' },
  { id: 'container', label: 'Container' },
  { id: 'shape', label: 'Shape' },
];

export default function StudioBuilder() {
  const [selectedElementIds, setSelectedElementIds] = useState<string[]>(['score']);
  const [snapEnabled, setSnapEnabled] = useState(true);
  const [showRulers, setShowRulers] = useState(true);
  const [showGuides, setShowGuides] = useState(true);

  const toggleSelected = (id: string) => {
    setSelectedElementIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  return (
    <div className="w-screen h-screen bg-zinc-950 text-white flex">
      <aside className="w-72 border-r border-zinc-800 p-4 flex flex-col gap-6">
        <div>
          <h2 className="text-lg font-semibold">Layer Stack</h2>
          <div className="mt-3 space-y-2">
            {layerStack.map((layer) => {
              const isSelected = selectedElementIds.includes(layer.id);
              return (
                <button
                  key={layer.id}
                  type="button"
                  onClick={() => toggleSelected(layer.id)}
                  className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition ${
                    isSelected
                      ? 'border-indigo-400 bg-indigo-500/10'
                      : 'border-zinc-800 bg-zinc-900/70'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>{layer.name}</span>
                    <span className="text-xs text-zinc-400">
                      {layer.visible ? 'Visible' : 'Hidden'} · {layer.locked ? 'Locked' : 'Unlocked'}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
        <div>
          <h2 className="text-lg font-semibold">Building Blocks</h2>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {buildingBlocks.map((block) => (
              <div
                key={block.id}
                className="rounded-lg border border-dashed border-zinc-700 bg-zinc-900/70 px-3 py-4 text-center text-xs text-zinc-300"
              >
                {block.label}
              </div>
            ))}
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col">
        <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-2 text-sm">
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={showRulers}
                onChange={() => setShowRulers((prev) => !prev)}
              />
              Show Rulers
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={showGuides}
                onChange={() => setShowGuides((prev) => !prev)}
              />
              Show Guides
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={snapEnabled}
                onChange={() => setSnapEnabled((prev) => !prev)}
              />
              Snap to Grid
            </label>
          </div>
          <div className="text-zinc-400">Ctrl+Click: Multi-select · Shift+Drag: Axis Lock</div>
        </div>
        <div className="flex-1 flex items-center justify-center bg-zinc-900/40">
          <div className="relative h-[540px] w-[960px] rounded-2xl border border-zinc-700 bg-zinc-950 shadow-xl">
            {showRulers && (
              <div className="absolute left-0 top-0 h-6 w-full border-b border-zinc-800 bg-zinc-900/80 text-xs text-zinc-400 flex items-center px-2">
                Horizontal Ruler
              </div>
            )}
            {showRulers && (
              <div className="absolute left-0 top-0 h-full w-6 border-r border-zinc-800 bg-zinc-900/80 text-xs text-zinc-400 flex items-start justify-center pt-8">
                Vertical
              </div>
            )}
            {showGuides && (
              <div className="absolute inset-0">
                <div className="absolute left-1/2 top-0 h-full w-px bg-indigo-400/40" />
                <div className="absolute left-0 top-1/2 h-px w-full bg-indigo-400/40" />
              </div>
            )}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="rounded-lg border border-dashed border-zinc-700 bg-zinc-900/60 px-6 py-4 text-center text-sm text-zinc-400">
                Main Canvas
                <div className="mt-2 text-xs text-zinc-500">
                  Selection handles · Multi-select · Snap Enabled: {snapEnabled ? 'On' : 'Off'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <aside className="w-80 border-l border-zinc-800 p-4 flex flex-col gap-6">
        <div>
          <h2 className="text-lg font-semibold">Inspector</h2>
          <div className="mt-3 space-y-4">
            <div className="rounded-lg border border-zinc-800 bg-zinc-900/70 p-3">
              <h3 className="text-sm font-semibold">Content</h3>
              <div className="mt-2 text-xs text-zinc-400">Data Binding Source</div>
              <div className="mt-2 flex gap-2">
                <button className="rounded-md border border-zinc-700 px-2 py-1 text-xs">Supabase</button>
                <button className="rounded-md border border-zinc-700 px-2 py-1 text-xs">Manual</button>
              </div>
            </div>
            <div className="rounded-lg border border-zinc-800 bg-zinc-900/70 p-3">
              <h3 className="text-sm font-semibold">Transform</h3>
              <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-zinc-400">
                <div>X: 120</div>
                <div>Y: 84</div>
                <div>W: 640</div>
                <div>H: 120</div>
                <div>Rotation: 0°</div>
              </div>
            </div>
            <div className="rounded-lg border border-zinc-800 bg-zinc-900/70 p-3">
              <h3 className="text-sm font-semibold">Appearance</h3>
              <div className="mt-2 space-y-2 text-xs text-zinc-400">
                <div>Opacity: 92%</div>
                <div>Masks: None</div>
                <div>CSS Filters: Drop Shadow</div>
              </div>
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/70 p-3 text-xs text-zinc-400">
          Selected Elements: {selectedElementIds.join(', ')}
        </div>
      </aside>
    </div>
  );
}
