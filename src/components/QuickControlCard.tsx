import React from 'react';

type QuickControlCardProps = {
  label: string;
};

export const QuickControlCard = ({ label }: QuickControlCardProps) => {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/70 px-3 py-2 text-sm text-zinc-200">
      {label}
    </div>
  );
};
