import React, { useMemo, useState } from 'react';
import { useBroadcastController } from '../hooks/useBroadcastController';

const rundownItems = [
  { id: 'intro', title: 'Intro Open', duration: '00:30' },
  { id: 'lineup', title: 'Starting Lineup', duration: '00:45' },
  { id: 'scorebug', title: 'Scorebug', duration: 'Live' },
  { id: 'lower-third', title: 'Lower Third', duration: '00:20' },
  { id: 'inning', title: 'Inning Change', duration: '00:15' },
  { id: 'break', title: 'Commercial Break', duration: '01:00' },
  { id: 'outro', title: 'Outro Close', duration: '00:20' },
];

const favoriteControls = [
  'Score +1',
  'Score -1',
  'Inning Top',
  'Inning Bottom',
  'Pitch Count',
  'Bases Loaded',
  'Mound Visit',
  'Timeout',
];

export default function ControlRoom() {
  const { previewSource, programSource, take, setPreviewSource, isTaking, lastTakeAt } =
    useBroadcastController();
  const [activeRundownId, setActiveRundownId] = useState('intro');
  const [rundownState, setRundownState] = useState<Record<string, { in: boolean; out: boolean }>>(
    () =>
      rundownItems.reduce((acc, item) => {
        acc[item.id] = { in: false, out: false };
        return acc;
      }, {} as Record<string, { in: boolean; out: boolean }>),
  );
  const [clock, setClock] = useState(() => new Date());

  React.useEffect(() => {
    const timer = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedTime = useMemo(
    () =>
      clock.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }),
    [clock],
  );

  const toggleRundown = (id: string, key: 'in' | 'out') => {
    setRundownState((prev) => ({
      ...prev,
      [id]: { ...prev[id], [key]: !prev[id][key] },
    }));
  };

  const handleRundownSelect = (id: string, title: string) => {
    setActiveRundownId(id);
    setPreviewSource(title);
  };

  return (
    <div className="w-screen h-screen bg-zinc-950 text-white flex">
      <aside className="w-80 border-r border-zinc-800 bg-zinc-900/50 p-4 flex flex-col">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Playlist</h2>
          <span className="text-xs text-zinc-400">Rundown</span>
        </div>
        <div className="mt-4 flex-1 overflow-y-auto space-y-2 pr-1">
          {rundownItems.map((item) => {
            const itemState = rundownState[item.id];
            return (
              <div
                key={item.id}
                className={`rounded-lg border px-3 py-2 transition ${
                  activeRundownId === item.id
                    ? 'border-blue-500 bg-blue-500/20'
                    : 'border-zinc-800 bg-zinc-900/70'
                }`}
              >
                <button
                  type="button"
                  className="w-full text-left"
                  onClick={() => handleRundownSelect(item.id, item.title)}
                >
                  <div className="text-sm font-medium">{item.title}</div>
                  <div className="text-xs text-zinc-400">{item.duration}</div>
                </button>
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    className={`flex-1 rounded-md border px-2 py-1 text-xs font-semibold ${
                      itemState.in
                        ? 'border-emerald-400 bg-emerald-400/20 text-emerald-200'
                        : 'border-zinc-700 text-zinc-300'
                    }`}
                    onClick={() => toggleRundown(item.id, 'in')}
                  >
                    IN
                  </button>
                  <button
                    type="button"
                    className={`flex-1 rounded-md border px-2 py-1 text-xs font-semibold ${
                      itemState.out
                        ? 'border-rose-400 bg-rose-400/20 text-rose-200'
                        : 'border-zinc-700 text-zinc-300'
                    }`}
                    onClick={() => toggleRundown(item.id, 'out')}
                  >
                    OUT
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </aside>

      <main className="flex-1 flex flex-col gap-4 p-4">
        <div className="grid grid-cols-[1fr,1fr,280px] gap-4">
          <div className="col-span-2 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl border border-zinc-700 bg-zinc-900/70 p-4">
                <div className="flex items-center justify-between text-xs text-zinc-400">
                  <span className="font-semibold tracking-[0.2em]">PREVIEW</span>
                  <span>Staged</span>
                </div>
                <div className="mt-3 aspect-[16/9] rounded-lg border border-zinc-600 bg-zinc-950/70 p-4 text-sm text-zinc-300">
                  <div className="h-full w-full rounded-md border border-dashed border-zinc-700 bg-zinc-900/40 p-3">
                    <div className="text-xs text-zinc-500">Graphic in Preview</div>
                    <div className="mt-2 text-base font-semibold text-white">{previewSource}</div>
                  </div>
                </div>
              </div>
              <div className="rounded-xl border border-rose-500/80 bg-zinc-900/70 p-4">
                <div className="flex items-center justify-between text-xs text-zinc-400">
                  <span className="font-semibold tracking-[0.2em] text-rose-300">PROGRAM</span>
                  <span className="text-rose-300">Live</span>
                </div>
                <div className="mt-3 aspect-[16/9] rounded-lg border border-rose-500 bg-zinc-950/70 p-4 text-sm text-zinc-300">
                  <div className="h-full w-full rounded-md border border-dashed border-rose-500/50 bg-zinc-900/40 p-3">
                    <div className="text-xs text-zinc-500">Live Output</div>
                    <div className="mt-2 text-base font-semibold text-white">{programSource}</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-center">
              <button
                type="button"
                onClick={take}
                className="rounded-full bg-rose-600 px-12 py-4 text-lg font-semibold tracking-widest text-white shadow-lg shadow-rose-500/30 transition hover:bg-rose-500"
              >
                {isTaking ? 'TAKING…' : 'TAKE'}
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Live Output Status</h3>
                <span className="flex items-center gap-2 text-xs text-emerald-400">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" /> ONLINE
                </span>
              </div>
              <div className="mt-3 space-y-2 text-xs text-zinc-300">
                <div className="flex items-center justify-between">
                  <span>Encoder</span>
                  <span className="text-emerald-300">Healthy</span>
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
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-4">
              <h3 className="text-sm font-semibold">Global Clock</h3>
              <div className="mt-2 text-2xl font-semibold text-white">{formattedTime}</div>
              <div className="mt-1 text-xs text-zinc-400">UTC+0 · Control Room</div>
              {lastTakeAt && (
                <div className="mt-3 text-xs text-zinc-500">
                  Last Take: {lastTakeAt.toLocaleTimeString()}
                </div>
              )}
            </div>
          </div>
        </div>

        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold">Quick Controls</h3>
            <button
              type="button"
              className="rounded-full border border-zinc-700 px-3 py-1 text-xs text-zinc-300"
            >
              Edit Favorites
            </button>
          </div>
          <div className="mt-4 grid grid-cols-4 gap-3">
            {favoriteControls.map((control) => (
              <button
                key={control}
                type="button"
                className="rounded-lg border border-zinc-700 bg-zinc-950/60 px-3 py-3 text-xs font-semibold text-zinc-200 hover:border-indigo-400"
              >
                {control}
              </button>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
