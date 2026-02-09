import React, { useRef, useState, useEffect } from 'react';
import { CanvasStage } from './CanvasStage';

export const CanvasStageMonitor = ({ layout, game }: any) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const updateScale = () => {
      if (containerRef.current) {
        const parentWidth = containerRef.current.offsetWidth;
        const baseWidth = layout.aspect_ratio === '9:16' ? 1080 : 1920;
        setScale(parentWidth / baseWidth);
      }
    };
    updateScale();
    const observer = new ResizeObserver(updateScale);
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [layout.aspect_ratio]);

  const baseWidth = layout.aspect_ratio === '9:16' ? 1080 : 1920;
  const baseHeight = layout.aspect_ratio === '9:16' ? 1920 : 1080;

  return (
    <div
      ref={containerRef}
      className="w-full h-full relative overflow-hidden flex items-center justify-center bg-zinc-900"
    >
      <div
        style={{
          width: baseWidth,
          height: baseHeight,
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
          position: 'absolute',
          pointerEvents: 'none',
        }}
      >
        <CanvasStage
          layout={layout}
          updateElement={() => {}}
        />
      </div>
    </div>
  );
};
