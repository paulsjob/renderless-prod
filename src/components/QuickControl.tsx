import React from 'react';
import { QuickControlCard } from './QuickControlCard';

type QuickControlProps = {
  items: string[];
};

export const QuickControl = ({ items }: QuickControlProps) => {
  return (
    <div className="mt-4 grid grid-cols-3 gap-3">
      {items.map((item) => (
        <QuickControlCard key={item} label={item} />
      ))}
    </div>
  );
};
