import React from 'react';
import { BroadcastMonitor } from './BroadcastMonitor';
import { QuickControl } from './QuickControl';
import { useBroadcastController } from '../hooks/useBroadcastController';

const playlistItems = [
  { id: 'intro', title: 'Intro Open', duration: '00:30' },
  { id: 'segment-1', title: 'Segment 1', duration: '04:15' },
  { id: 'break', title: 'Commercial Break', duration: '01:00' },
  { id: 'segment-2', title: 'Segment 2', duration: '05:00' },
];

const overlayInstances = [
  { id: 'scorebug', name: 'Scorebug' },
  { id: 'lower-third', name: 'Lower Third' },
  { id: 'ticker', name: 'Ticker' },
];

const providers = [
  { id: 'supabase', name: 'Supabase', status: 'Connected' },
  { id: 'stats', name: 'Stats Provider', status: 'Syncing' },
  { id: 'media', name: 'Media Library', status: 'Online' },
];

export default function ControlRoom() {
  const { previewSource, programSource, take, setPreviewSource } = useBroadcastController();

  return (
    <div className="w-screen h-screen bg-zinc-950 text-white flex">
      <aside className="w-72 border-r border-zinc-800 p-4 flex flex-col gap-6">
        <div>
          <h2 className="text-lg font-semibold">Playlist</h2>
          <div className="mt-3 space-y-2">
            {playlistItems.map((item) => (
              <button
                key={item.id}
                type="button"
                className="w-full rounded-lg border border-zinc-800 bg-zinc-900/70 px-3 py-2 text-left hover:border-indigo-400"
                onClick={() => setPreviewSource(item.title)}
              >
                <div className="text-sm font-medium">{item.title}</div>
                <div className="text-xs text-zinc-400">{item.duration}</div>
              </button>
            ))}
          </div>
        </div>
        <div>
          <h2 className="text-lg font-semibold">Rundown Control</h2>
          <div className="mt-3 space-y-2 text-sm text-zinc-300">
            <div className="rounded-lg border border-zinc-800 bg-zinc-900/70 px-3 py-2">
              On-Air: {programSource}
            </div>
            <div className="rounded-lg border border-zinc-800 bg-zinc-900/70 px-3 py-2">
              Next: {previewSource}
            </div>
            <button
              type="button"
              onClick={take}
              className="w-full rounded-lg bg-indigo-500 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-400"
            >
              Take
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col gap-4 p-4">
        <section className="grid grid-cols-2 gap-4 h-1/2">
          <BroadcastMonitor label="Preview" source={previewSource} status="Standby" />
          <BroadcastMonitor label="Program" source={programSource} status="Live" />
        </section>

        <section className="grid grid-cols-3 gap-4 h-1/2">
          <div className="col-span-2 flex flex-col gap-4">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold">Quick Controls</h3>
                <button
                  type="button"
                  className="rounded-full border border-zinc-700 px-3 py-1 text-xs text-zinc-300"
                >
                  Edit Favorites
                </button>
              </div>
              <QuickControl
                items={[
                  'Lower Third',
                  'Scorebug',
                  'Full Screen',
                  'Sponsor Bug',
                  'Break Animation',
                  'Segment Timer',
                ]}
              />
            </div>
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
              <h3 className="text-base font-semibold">Overlay Instances</h3>
              <div className="mt-3 space-y-2">
                {overlayInstances.map((overlay) => (
                  <div
                    key={overlay.id}
                    className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/70 px-3 py-2 text-sm"
                  >
                    <span>{overlay.name}</span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="rounded-md border border-zinc-700 px-2 py-1 text-xs text-zinc-300"
                      >
                        Update
                      </button>
                      <button
                        type="button"
                        className="rounded-md bg-emerald-500/80 px-2 py-1 text-xs"
                      >
                        Take
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-4">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
              <h3 className="text-base font-semibold">Live Output Status</h3>
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
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
              <h3 className="text-base font-semibold">Global Providers</h3>
              <div className="mt-3 space-y-2">
                {providers.map((provider) => (
                  <div
                    key={provider.id}
                    className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/70 px-3 py-2 text-sm"
                  >
                    <span>{provider.name}</span>
                    <span className="text-xs text-zinc-400">{provider.status}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
