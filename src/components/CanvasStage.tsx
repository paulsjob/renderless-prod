import React, { useRef, useState } from 'react';
import type { Element as ElementType } from '../types';

interface CanvasStageProps {
  layout: any;
  updateElement: (id: string, patch: Partial<ElementType>) => void;
  selectedIds?: string[];
  scale?: number;
  snapEnabled?: boolean;
  showGrid?: boolean;
  showRulers?: boolean;
  showSafeZones?: boolean;
  disableInteraction?: boolean;
  onSelectionChange?: (ids: string[]) => void;
  onLayoutChange?: (layout: any) => void;
}

const RULER_GUTTER = 28;
const STAGE_W = 1920;
const STAGE_H = 1080;

// Snap step and grid steps
const GRID_MINOR = 24;
const GRID_MAJOR = 120;

export const CanvasStage: React.FC<CanvasStageProps> = ({
  layout,
  updateElement,
  selectedIds = [],
  scale = 0.55,
  snapEnabled = false,
  showGrid = false,
  showRulers = true,
  showSafeZones = false,
  disableInteraction = false,
  onSelectionChange,
}) => {
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasScale = scale && scale > 0 ? scale : 1;

  const [dragState, setDragState] = useState<{
    startX: number;
    startY: number;
    initialPositions: Record<string, { x: number; y: number }>;
  } | null>(null);

  const getStageCoords = (clientX: number, clientY: number) => {
    if (!stageRef.current) return { x: 0, y: 0 };
    const rect = stageRef.current.getBoundingClientRect();
    return {
      x: (clientX - rect.left) / canvasScale,
      y: (clientY - rect.top) / canvasScale,
    };
  };

  const handlePointerDown = (e: React.PointerEvent, elementId?: string) => {
    if (disableInteraction) return;

    const coords = getStageCoords(e.clientX, e.clientY);

    // Clicked the empty stage
    if (!elementId) {
      if (!e.shiftKey) onSelectionChange?.([]);
      return;
    }

    e.stopPropagation();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);

    let nextSelected = [...selectedIds];
    if (e.shiftKey) {
      nextSelected = selectedIds.includes(elementId)
        ? selectedIds.filter((id) => id !== elementId)
        : [...selectedIds, elementId];
    } else if (!selectedIds.includes(elementId)) {
      nextSelected = [elementId];
    }
    onSelectionChange?.(nextSelected);

    const initialPositions: Record<string, { x: number; y: number }> = {};
    layout?.elements?.forEach((el: ElementType) => {
      if (nextSelected.includes((el as any).id)) {
        initialPositions[(el as any).id] = { x: (el as any).x, y: (el as any).y };
      }
    });

    setDragState({
      startX: coords.x,
      startY: coords.y,
      initialPositions,
    });
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragState || disableInteraction) return;

    const coords = getStageCoords(e.clientX, e.clientY);
    const dx = coords.x - dragState.startX;
    const dy = coords.y - dragState.startY;

    Object.entries(dragState.initialPositions).forEach(([id, pos]) => {
      let nextX = pos.x + dx;
      let nextY = pos.y + dy;

      if (snapEnabled) {
        nextX = Math.round(nextX / GRID_MINOR) * GRID_MINOR;
        nextY = Math.round(nextY / GRID_MINOR) * GRID_MINOR;
      }

      updateElement(id, { x: nextX, y: nextY } as any);
    });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (dragState) {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      setDragState(null);
    }
  };

  const workbenchW = STAGE_W + RULER_GUTTER;
  const workbenchH = STAGE_H + RULER_GUTTER;

  // Helper: read “your project element shape” without forcing type changes
  const getEl = (el: any) => el as any;

  return (
    <div
      className={`relative inline-block select-none bg-[#0a0a0b] border border-zinc-800 shadow-[0_50px_100px_rgba(0,0,0,1)] ${
        disableInteraction ? 'pointer-events-none' : ''
      }`}
    >
      {/* Outer box is sized in scaled pixels, but internal content stays native 1920x1080 */}
      <div
        className="relative overflow-visible"
        style={{
          width: workbenchW * canvasScale,
          height: workbenchH * canvasScale,
        }}
      >
        {/* Single scale transform for the entire workbench */}
        <div className="absolute inset-0 origin-top-left" style={{ transform: `scale(${canvasScale})` }}>
          {/* STAGE AREA */}
          <div
            ref={stageRef}
            onPointerDown={(e) => handlePointerDown(e)}
            className="absolute bg-black select-none touch-none overflow-hidden"
            style={{
              left: RULER_GUTTER,
              top: RULER_GUTTER,
              width: STAGE_W,
              height: STAGE_H,
            }}
          >
            {/* GRID LAYER */}
            {showGrid && (
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  backgroundImage: `
                    linear-gradient(to right, rgba(255,255,255,0.10) 2px, transparent 2px),
                    linear-gradient(to bottom, rgba(255,255,255,0.10) 2px, transparent 2px),
                    linear-gradient(to right, rgba(255,255,255,0.04) 1px, transparent 1px),
                    linear-gradient(to bottom, rgba(255,255,255,0.04) 1px, transparent 1px)
                  `,
                  backgroundSize: `${GRID_MAJOR}px ${GRID_MAJOR}px, ${GRID_MAJOR}px ${GRID_MAJOR}px, ${GRID_MINOR}px ${GRID_MINOR}px, ${GRID_MINOR}px ${GRID_MINOR}px`,
                }}
              />
            )}

            {/* SAFE ZONES LAYER */}
            {showSafeZones && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="absolute border-2 border-cyan-500/30" style={{ width: 1728, height: 972 }}>
                  <div className="absolute top-2 left-2 text-[10px] uppercase font-black tracking-widest text-cyan-500/80 bg-black/40 px-2 py-0.5 rounded">
                    Action Safe 90%
                  </div>
                </div>
                <div className="absolute border-2 border-yellow-500/40" style={{ width: 1536, height: 864 }}>
                  <div className="absolute top-2 left-2 text-[10px] uppercase font-black tracking-widest text-yellow-500/80 bg-black/40 px-2 py-0.5 rounded">
                    Title Safe 80%
                  </div>
                </div>
              </div>
            )}

            {/* ELEMENTS LAYER */}
            {layout?.elements?.map((raw: any) => {
              const el = getEl(raw);
              const isSelected = selectedIds.includes(el.id);

              const borderWidth = el.borderWidth ?? 0;
              const borderColor = el.borderColor ?? 'transparent';
              const fill = el.fill ?? (el.type === 'container' ? 'transparent' : undefined);
              const opacity = typeof el.opacity === 'number' ? el.opacity / 100 : 1;

              return (
                <div
                  key={el.id}
                  onPointerDown={(e) => handlePointerDown(e, el.id)}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  className={`absolute cursor-move transition-[box-shadow,outline] outline-offset-0 ${
                    isSelected ? 'outline-[4px] outline-blue-500 z-50 shadow-2xl' : 'z-10'
                  }`}
                  style={{
                    left: el.x,
                    top: el.y,
                    width: el.width,
                    height: el.height,
                    opacity,
                    backgroundColor: el.type === 'shape' || el.type === 'container' ? fill : undefined,
                    borderStyle: borderWidth > 0 ? 'solid' : undefined,
                    borderWidth: borderWidth > 0 ? borderWidth : undefined,
                    borderColor: borderWidth > 0 ? borderColor : undefined,
                    pointerEvents: disableInteraction ? 'none' : 'auto',
                  }}
                >
                  {el.type === 'text' && (
                    <div
                      className="w-full h-full flex items-center justify-center pointer-events-none px-6 text-center select-none font-sans font-black tracking-tight leading-tight uppercase"
                      style={{
                        color: el.fill ?? '#ffffff',
                        fontSize: el.fontSize ?? 48,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                      }}
                    >
                      {el.text ?? el.data?.text ?? ''}
                    </div>
                  )}

                  {el.type === 'image' && el.src && (
                    <img
                      src={el.src}
                      alt=""
                      className="w-full h-full object-fill pointer-events-none"
                      draggable={false}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* RULERS */}
          <div className={`transition-opacity duration-300 ${showRulers ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            {/* TOP RULER */}
            <div
              className="absolute top-0 bg-zinc-900 border-b border-zinc-800 z-40 overflow-hidden"
              style={{ left: RULER_GUTTER, width: STAGE_W, height: RULER_GUTTER }}
            >
              <div className="relative h-full" style={{ width: STAGE_W }}>
                {Array.from({ length: Math.ceil(STAGE_W / GRID_MAJOR) + 1 }).map((_, i) => (
                  <div
                    key={i}
                    className="absolute bottom-0 h-full border-l border-zinc-800"
                    style={{ left: i * GRID_MAJOR }}
                  >
                    <span className="absolute left-1 top-1 text-[9px] text-zinc-600 font-mono font-bold">
                      {i * GRID_MAJOR}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* LEFT RULER */}
            <div
              className="absolute left-0 bg-zinc-900 border-r border-zinc-800 z-40 overflow-hidden"
              style={{ top: RULER_GUTTER, height: STAGE_H, width: RULER_GUTTER }}
            >
              <div className="relative w-full h-full">
                {Array.from({ length: Math.ceil(STAGE_H / GRID_MAJOR) + 1 }).map((_, i) => (
                  <div
                    key={i}
                    className="absolute right-0 w-full border-t border-zinc-800"
                    style={{ top: i * GRID_MAJOR }}
                  >
                    <span className="absolute left-1 top-1 text-[9px] text-zinc-600 font-mono font-bold">
                      {i * GRID_MAJOR}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* CORNER BLOCK */}
            <div
              className="absolute top-0 left-0 bg-zinc-800 z-50 border-b border-r border-zinc-700"
              style={{ width: RULER_GUTTER, height: RULER_GUTTER }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
