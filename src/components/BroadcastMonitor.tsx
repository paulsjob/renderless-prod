import React from 'react';

type BroadcastMonitorProps = {
  label: string;
  source: string;
  status: string;
};

export const BroadcastMonitor = ({ label, source, status }: BroadcastMonitorProps) => {
  return (
    <div className="flex flex-col rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4">
      <div className="flex items-center justify-between text-sm">
        <span className="font-semibold">{label}</span>
        <span className="text-xs text-zinc-400">{status}</span>
      </div>
      <div className="mt-3 flex-1 rounded-lg border border-dashed border-zinc-700 bg-zinc-950/60 p-4 text-sm text-zinc-400">
        {source}
      </div>
      <div className="mt-3 text-xs text-zinc-500">BroadcastMonitor component</div>
    </div>
  );
};
