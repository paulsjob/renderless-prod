import React from 'react';
import ControlRoom from './components/ControlRoom';
import Overlay from './components/Overlay';
import StudioBuilder from './components/StudioBuilder';

type View = 'control' | 'studio' | 'overlay' | null;

const getView = (): View => {
  if (typeof window === 'undefined') return 'overlay';
  const params = new URLSearchParams(window.location.search);
  return (params.get('view') as View) ?? null;
};

const NavigationLanding = () => {
  return (
    <div className="w-screen h-screen bg-zinc-950 text-white flex items-center justify-center">
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-8 text-center space-y-4">
        <h1 className="text-2xl font-semibold">Flowics Control Hub</h1>
        <p className="text-sm text-zinc-400">Choose your workspace to continue.</p>
        <div className="flex flex-col gap-3">
          <a
            className="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold hover:bg-indigo-400"
            href="/?view=control"
          >
            Enter Control Room
          </a>
          <a
            className="rounded-lg border border-zinc-700 px-4 py-2 text-sm hover:border-indigo-400"
            href="/?view=studio"
          >
            Enter Studio Builder
          </a>
          <a
            className="rounded-lg border border-zinc-700 px-4 py-2 text-sm hover:border-indigo-400"
            href="/?view=overlay"
          >
            View Overlay Output
          </a>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const view = getView();

  if (view === 'control') {
    return <ControlRoom />;
  }

  if (view === 'studio') {
    return <StudioBuilder />;
  }

  if (view === 'overlay') {
    return <Overlay />;
  }

  return <NavigationLanding />;
}
