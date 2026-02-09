import { useCallback, useMemo, useState } from 'react';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

type BroadcastStateRecord = {
  id: string;
  preview_source: string;
  program_source: string;
  updated_at: string;
};

const getSupabaseClient = (): SupabaseClient | null => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  return createClient(supabaseUrl, supabaseAnonKey);
};

export const useBroadcastController = () => {
  const [previewSource, setPreviewSource] = useState('Intro Open');
  const [programSource, setProgramSource] = useState('Standby');
  const [isTaking, setIsTaking] = useState(false);
  const [lastTakeAt, setLastTakeAt] = useState<Date | null>(null);

  const supabase = useMemo(() => getSupabaseClient(), []);

  const take = useCallback(async () => {
    const nextProgram = previewSource;
    setProgramSource(nextProgram);
    setLastTakeAt(new Date());

    if (!supabase) {
      return;
    }

    setIsTaking(true);
    const payload: BroadcastStateRecord = {
      id: 'control-room',
      preview_source: previewSource,
      program_source: nextProgram,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('broadcast_state').upsert(payload);

    if (error) {
      console.error('Failed to update program output in Supabase', error);
    }

    setIsTaking(false);
  }, [previewSource, supabase]);

  return {
    previewSource,
    programSource,
    take,
    setPreviewSource,
    isTaking,
    lastTakeAt,
  };
};
