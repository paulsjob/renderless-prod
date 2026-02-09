import React, { useMemo, useState, useEffect } from 'react';
import { Check, Dot, Pause, Play } from 'lucide-react';
import { useBroadcastController } from '../hooks/useBroadcastController';

const rundownItems = [
  { id: 'intro', title: 'Show Open', duration: '00:30' },
  { id: 'headlines', title: 'Top Headlines', duration: '02:00' },
  { id: 'scorebug', title: 'Scorebug + Clock', duration: 'LIVE' },
  { id: 'lower-third', title: 'Lower Third', duration: '00:15' },
  { id: 'break', title: 'Commercial Break', duration: '01:00' },
  { id: 'segment', title: 'Feature Segment', duration: '04:30' },
  { id: 'outro', title: 'Show Close', duration: '00:20' },
];

const quickControls = [
  'Score +1',
  'Score -1',
  'Inning Top',
  'Inning Bot',
  'Timeout',
  'Replay',
  'Brought to You',
  'Ticker On',
  'Ticker Off',
];

export default function ControlRoom() {
  const { previewSource, programSource, take, setPreviewSource } = useBroadcastController();
  const [activeItemId, setActiveItemId] = useState(rundownItems[0].id);
  const [itemStates, setItemStates] = useState<Record<string, { in: boolean; out: boolean }>>(() =>
    rundownItems.reduce(
      (acc, item) => ({ ...acc, [item.id]: { in: false, out: false } }),
      {} as Record<string, { in: boolean; out: boolean }>,
    ),
  );
  const [clock, setClock] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const activeItem = useMemo(
    () => rundownItems.find((item) => item.id === activeItemId),
    [activeItemId],
  );

  const handleSelectItem = (id: string, title: string) => {
    setActiveItemId(id);
    setPreviewSource(title);
  };

  const toggleItemState = (id: string, key: 'in' | 'out') => {
    setItemStates((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [key]: !prev[id][key],
      },
    }));
  };

  return (
    <div className="h-screen w-screen bg-[#0b0d12] text-white flex overflow-hidden">
      <aside className="w-80 shrink-0 border-r border-[#1d2331] bg-[#101521] p-4 flex flex-col">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-widest text-zinc-400">
              Playlist
            </h2>
            <p className="text-lg font-semibold">Rundown Items</p>
          </div>
          <button className="rounded-md border border-zinc-700 px-2 py-1 text-xs text-zinc-300">
            Take All Out
          </button>
        </div>
        <div className="mt-4 flex-1 space-y-2 overflow-y-auto pr-1">
          {rundownItems.map((item, index) => {
            const isActive = item.id === activeItemId;
            const state = itemStates[item.id];
            return (
              <div
                key={item.id}
                className={`rounded-lg border px-3 py-2 transition ${
                  isActive
                    ? 'border-sky-500 bg-sky-500/10'
                    : 'border-[#1f2636] bg-[#141a28]'
                }`}
              >
                <button
                  type="button"
                  className="w-full text-left"
                  onClick={() => handleSelectItem(item.id, item.title)}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold">{item.title}</span>
                    <span className="text-xs text-zinc-400">{item.duration}</span>
                  </div>
                  <div className="mt-1 text-xs text-zinc-500">Item {index + 1}</div>
                </button>
                <div className="mt-2 flex items-center justify-between">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => toggleItemState(item.id, 'out')}
                      className={`rounded-md px-2 py-1 text-xs font-semibold transition ${
                        state.out ? 'bg-zinc-700 text-white' : 'bg-[#1c2232] text-zinc-400'
                      }`}
                    >
                      OUT
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleItemState(item.id, 'in')}
                      className={`rounded-md px-2 py-1 text-xs font-semibold transition ${
                        state.in ? 'bg-emerald-500/80 text-white' : 'bg-[#1c2232] text-zinc-400'
                      }`}
                    >
                      IN
                    </button>
                  </div>
                  {state.in && <Check className="h-4 w-4 text-emerald-400" />}
                </div>
              </div>
            );
          })}
        </div>
      </aside>

      <main className="flex-1 flex flex-col">
        <header className="flex items-center justify-between border-b border-[#1d2331] bg-[#0f1420] px-6 py-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">Director View</p>
            <h1 className="text-lg font-semibold">Control Room</h1>
          </div>
          <div className="text-xs text-zinc-400">Active Item: {activeItem?.title}</div>
        </header>

        <div className="flex flex-1 gap-4 p-4">
          <section className="flex flex-1 flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-2xl border border-[#2a3144] bg-[#0f1320] p-3">
                <div className="flex items-center justify-between text-xs text-zinc-400">
                  <span className="font-semibold tracking-[0.2em]">PREVIEW</span>
                  <span className="rounded-full border border-zinc-600 px-2 py-0.5">STAGED</span>
                </div>
                <div className="mt-2 aspect-video rounded-xl border border-zinc-600 bg-[#111827] p-4 text-sm text-zinc-400">
                  {previewSource}
                </div>
              </div>
              <div className="rounded-2xl border border-[#3b1f27] bg-[#120b12] p-3">
                <div className="flex items-center justify-between text-xs text-zinc-400">
                  <span className="font-semibold tracking-[0.2em]">PROGRAM</span>
                  <span className="rounded-full border border-red-500 px-2 py-0.5 text-red-400">
                    LIVE
                  </span>
                </div>
                <div className="mt-2 aspect-video rounded-xl border border-red-500 bg-[#140b10] p-4 text-sm text-red-200">
                  {programSource}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center">
              <button
                type="button"
                onClick={take}
                className="flex items-center gap-3 rounded-full bg-red-500 px-10 py-4 text-lg font-semibold tracking-wide text-white shadow-lg shadow-red-500/30 hover:bg-red-400"
              >
                <Play className="h-6 w-6" />
                TAKE
              </button>
            </div>

            <div className="rounded-2xl border border-[#1d2331] bg-[#0f1420] p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold uppercase tracking-widest text-zinc-400">
                  Quick Controls
                </h3>
                <div className="flex items-center gap-2 text-xs text-zinc-500">
                  <Pause className="h-4 w-4" />
                  Auto Hold
                </div>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-3">
                {quickControls.map((control) => (
                  <button
                    key={control}
                    type="button"
                    className="rounded-lg border border-[#1f2636] bg-[#141a28] px-3 py-3 text-left text-xs font-semibold text-zinc-200 hover:border-sky-500"
                  >
                    {control}
                  </button>
                ))}
              </div>
            </div>
          </section>

          <aside className="w-72 shrink-0 space-y-4">
            <div className="rounded-2xl border border-[#1d2331] bg-[#0f1420] p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold uppercase tracking-widest text-zinc-400">
                  Output Status
                </h3>
                <span className="flex items-center gap-1 text-xs text-emerald-400">
                  <Dot className="h-6 w-6" />
                  ONLINE
                </span>
              </div>
              <div className="mt-3 space-y-2 text-sm text-zinc-300">
                <div className="flex items-center justify-between">
                  <span>Encoder</span>
                  <span className="text-emerald-400">Healthy</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Latency</span>
                  <span>1.2s</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Bitrate</span>
                  <span>6.5 Mbps</span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-[#1d2331] bg-[#0f1420] p-4">
              <h3 className="text-sm font-semibold uppercase tracking-widest text-zinc-400">
                Global Timer
              </h3>
              <div className="mt-3 rounded-xl border border-[#1f2636] bg-[#141a28] p-4 text-center">
                <div className="text-xs uppercase tracking-[0.2em] text-zinc-400">On Air</div>
                <div className="mt-2 text-2xl font-semibold">
                  {clock.toLocaleTimeString()}
                </div>
              </div>
              <div className="mt-3 text-xs text-zinc-500">UTC {clock.toUTCString().slice(17, 25)}</div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
