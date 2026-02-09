import { useCallback, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import type { Layout } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

const supabaseClient =
  supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

export const useBroadcastController = () => {
  const [previewSource, setPreviewSource] = useState('Intro Open');
  const [programSource, setProgramSource] = useState('Standby');
  const [layout, setLayout] = useState<Layout | null>(null);

  const take = useCallback(() => {
    const nextSource = previewSource;
    setProgramSource(nextSource);

    if (!supabaseClient) return;

    void supabaseClient.from('broadcast_state').upsert(
      {
        id: 'primary',
        preview: previewSource,
        program: nextSource,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' },
    );
  }, [previewSource]);

  return {
    previewSource,
    programSource,
    take,
    setPreviewSource,
    layout,
    setLayout,
  };
};
