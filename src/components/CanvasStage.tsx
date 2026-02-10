import React, { useEffect, useRef, useState } from 'react';
import type { Element as ElementType } from '../types';

interface CanvasStageProps {
  layout: any;
  updateElement: (id: string, patch: Partial<ElementType>) => void;
  selectedIds?: string[];
  scale?: number;
  snapEnabled?: boolean;
  showGrid?: boolean;
  showSafeZones?: boolean;
  onSelectionChange?: (ids: string[]) => void;
  onLayoutChange?: (layout: any) => void;
}

type DragState = {
  pointerId: number;
  startX: number;
  startY: number;
  initialPositions: Record<string, { x: number; y: number }>;
} | null;

export const CanvasStage: React.FC<CanvasStageProps> = ({
  layout,
  updateElement,
  selectedIds = [],
  scale = 1,
  snapEnabled = false,
  showGrid = false,
  showSafeZones = false,
  onSelectionChange = () => {},
  onLayoutChange = () => {},
}) => {
  const stageRef = useRef<HTMLDivElement>(null);
  const captureRef = useRef<{ pointerId: number; element: HTMLElement } | null>(null);
  const canvasScale = scale > 0 ? scale : 1;
  const elements = layout?.elements ?? [];

  const [dragState, setDragState] = useState<DragState>(null);

  /* POINTER_TO_STAGE */
  const clientToStage = (clientX: number, clientY: number): { x: number; y: number } => {
    const rect = stageRef.current?.getBoundingClientRect();

    if (!rect) {
      return { x: 0, y: 0 };
    }

    return {
      x: (clientX - rect.left) / canvasScale,
      y: (clientY - rect.top) / canvasScale,
    };
  };

  const handlePointerDown = (e: React.PointerEvent, elementId: string) => {
    e.stopPropagation();
    e.preventDefault();

    const captureElement = e.currentTarget as HTMLElement;
    captureElement.setPointerCapture(e.pointerId);
    captureRef.current = { pointerId: e.pointerId, element: captureElement };

    let newSelection = selectedIds;
    if (!selectedIds.includes(elementId)) {
      newSelection = e.shiftKey ? [...selectedIds, elementId] : [elementId];
      onSelectionChange(newSelection);
    }

    const initialPositions: Record<string, { x: number; y: number }> = {};
    elements.forEach((el: any) => {
      if (newSelection.includes(el.id)) {
        initialPositions[el.id] = { x: el.x, y: el.y };
      }
    });

    const startPoint = clientToStage(e.clientX, e.clientY);

    const startPoint = getPointerStageCoords(e);

    setDragState({
      pointerId: e.pointerId,
      startX: startPoint.x,
      startY: startPoint.y,
      initialPositions,
    });
  };

  /* DRAG_WINDOW_LISTENERS */
  useEffect(() => {
    if (!dragState) return;

    const handleWindowPointerMove = (e: PointerEvent) => {
      if (e.pointerId !== dragState.pointerId) return;

      const currentPoint = clientToStage(e.clientX, e.clientY);
      const dx = currentPoint.x - dragState.startX;
      const dy = currentPoint.y - dragState.startY;

      Object.keys(dragState.initialPositions).forEach((id) => {
        const init = dragState.initialPositions[id];
        const nextX = init.x + dx;
        const nextY = init.y + dy;

        updateElement(id, {
          x: Math.round(snapEnabled ? Math.round(nextX / 10) * 10 : nextX),
          y: Math.round(snapEnabled ? Math.round(nextY / 10) * 10 : nextY),
        });
      });
    };

    const cleanupPointerCapture = (pointerId: number) => {
      const captured = captureRef.current;
      if (!captured || captured.pointerId !== pointerId) return;
      if (captured.element.hasPointerCapture(pointerId)) {
        captured.element.releasePointerCapture(pointerId);
      }
      captureRef.current = null;
    };

    const handleWindowPointerUp = (e: PointerEvent) => {
      if (e.pointerId !== dragState.pointerId) return;
      cleanupPointerCapture(e.pointerId);
      setDragState(null);
    };

    window.addEventListener('pointermove', handleWindowPointerMove);
    window.addEventListener('pointerup', handleWindowPointerUp);
    window.addEventListener('pointercancel', handleWindowPointerUp);

    return () => {
      window.removeEventListener('pointermove', handleWindowPointerMove);
      window.removeEventListener('pointerup', handleWindowPointerUp);
      window.removeEventListener('pointercancel', handleWindowPointerUp);
    };
  }, [dragState, snapEnabled, updateElement]);

  const handleStageClick = (e: React.MouseEvent) => {
    if (e.target === stageRef.current) {
      onSelectionChange([]);
    }
  };

  return (
    /* INTEGRATION_WRAPPER */
    <div className="relative select-none">
      <div className="relative rounded border border-zinc-700 overflow-hidden shadow-2xl inline-block">
        {/* STAGE_ELEMENT_OPTION_A */}
        <div
          ref={stageRef}
          className="relative bg-black"
          onClick={handleStageClick}
          style={{
            width: 1920,
            height: 1080,
            transform: `scale(${canvasScale})`,
            transformOrigin: 'top left',
            transition: 'transform 0.1s ease-out',
          }}
        >
          {showGrid && (
            <div
              className="absolute inset-0 z-0 pointer-events-none"
              style={{
                backgroundImage: 'radial-gradient(#333 1px, transparent 1px)',
                backgroundSize: '50px 50px',
              }}
            />
          )}

          {showSafeZones && (
            <>
              <div
                className="absolute inset-0 m-auto border-2 border-yellow-500 opacity-50 z-50 pointer-events-none"
                style={{ width: '80%', height: '80%' }}
              />
              <div
                className="absolute inset-0 m-auto border-2 border-green-500 opacity-50 z-50 pointer-events-none"
                style={{ width: '90%', height: '90%' }}
              />
            </>
          )}

          {elements.map((el: any) => {
            const isSelected = selectedIds.includes(el.id);
            return (
              <div
                key={el.id}
                onPointerDown={(e) => handlePointerDown(e, el.id)}
                className={`absolute group outline-none ${isSelected ? 'cursor-move' : 'cursor-pointer'}`}
                style={{
                  left: el.x,
                  top: el.y,
                  width: el.width,
                  height: el.height,
                  zIndex: 10,
                }}
              >
                {isSelected && (
                  <div className="absolute -inset-[2px] border-2 border-blue-500 pointer-events-none z-50">
                    <div className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-white border border-blue-500" />
                    <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-white border border-blue-500" />
                    <div className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-white border border-blue-500" />
                    <div className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-white border border-blue-500" />
                  </div>
                )}

                {!isSelected && (
                  <div className="absolute inset-0 border border-blue-400 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity" />
                )}

                {el.type === 'text' && (
                  <div
                    style={{
                      color: el.style?.color || 'white',
                      fontSize: el.style?.fontSize || 48,
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      whiteSpace: 'nowrap',
                      pointerEvents: 'none',
                    }}
                  >
                    {el.data?.text || 'Text'}
                  </div>
                )}

                {el.type === 'shape' && (
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      backgroundColor: el.style?.backgroundColor || '#3b82f6',
                      pointerEvents: 'none',
                    }}
                  />
                )}

                {el.type === 'image' && (
                  <img
                    src={el.src}
                    style={{ width: '100%', height: '100%', objectFit: 'fill', pointerEvents: 'none' }}
                    draggable={false}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
