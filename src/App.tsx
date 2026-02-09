import React from 'react';
import Studio from './components/Studio';
import Overlay from './components/Overlay';

export default function App() {
  const isDashboard =
    typeof window !== 'undefined' && window.location.search.includes('view=dashboard');

  if (isDashboard) {
    return <Studio />;
  }

  return <Overlay />;
}
