import { useCallback, useState } from 'react';

export const useBroadcastController = () => {
  const [previewSource, setPreviewSource] = useState('Intro Open');
  const [programSource, setProgramSource] = useState('Standby');

  const take = useCallback(() => {
    setProgramSource(previewSource);
  }, [previewSource]);

  return {
    previewSource,
    programSource,
    take,
    setPreviewSource,
  };
};
