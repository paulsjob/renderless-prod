import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { Layout } from '../types';

type DragState = {
  startX: number;
  startY: number;
  origin: Record<string, { x: number; y: number }>;
  axis: 'x' | 'y' | null;
};

type SnapGuides = {
  centerX: boolean;
  centerY: boolean;
  left: boolean;
  right: boolean;
  top: boolean;
  bottom: boolean;
};

type CanvasStageProps = {
  layout: Layout;
  selectedIds: string[];
  snapEnabled: boolean;
  onSelectionChange: (ids: string[]) => void;
  onLayoutChange: (layout: Layout) => void;
};

const CANVAS_WIDTH = 1920;
const CANVAS_HEIGHT = 1080;
const GRID_SIZE = 10;

export const CanvasStage = ({
  layout,
  selectedIds,
  snapEnabled,
  onSelectionChange,
  onLayoutChange,
}: CanvasStageProps) => {
  const dragStateRef = useRef<DragState | null>(null);
  const [snapGuides, setSnapGuides] = useState<SnapGuides>({
    centerX: false,
    centerY: false,
    left: false,
    right: false,
    top: false,
    bottom: false,
  });

  const elements = layout.elements;
  const selectedElements = useMemo(
    () => elements.filter((element) => selectedIds.includes(element.id)),
    [elements, selectedIds],
  );

  const resizeHandles = useMemo(
    () => [
      { key: 'nw', x: 0, y: 0, cursor: 'cursor-nw-resize' },
      { key: 'n', x: 50, y: 0, cursor: 'cursor-n-resize' },
      { key: 'ne', x: 100, y: 0, cursor: 'cursor-ne-resize' },
      { key: 'w', x: 0, y: 50, cursor: 'cursor-w-resize' },
      { key: 'e', x: 100, y: 50, cursor: 'cursor-e-resize' },
      { key: 'sw', x: 0, y: 100, cursor: 'cursor-sw-resize' },
      { key: 's', x: 50, y: 100, cursor: 'cursor-s-resize' },
      { key: 'se', x: 100, y: 100, cursor: 'cursor-se-resize' },
    ],
    [],
  );

  const applySnap = (value: number, gridSize: number) =>
    Math.round(value / gridSize) * gridSize;

  const handleMouseDown = (event: React.MouseEvent, id?: string) => {
    event.stopPropagation();
    const targetId = id ?? null;
    if (!targetId) {
      onSelectionChange([]);
      return;
    }
    const element = elements.find((item) => item.id === targetId);
    if (!element || element.locked) return;
    const isMulti = event.ctrlKey || event.metaKey;
    const nextSelected = isMulti
      ? selectedIds.includes(targetId)
        ? selectedIds.filter((item) => item !== targetId)
        : [...selectedIds, targetId]
      : [targetId];
    onSelectionChange(nextSelected);
    if (!nextSelected.includes(targetId)) return;

    const origin: DragState['origin'] = {};
    nextSelected.forEach((selectedId) => {
      const selected = elements.find((item) => item.id === selectedId);
      if (selected) {
        origin[selected.id] = { x: selected.x, y: selected.y };
      }
    });

    dragStateRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      origin,
      axis: null,
    };
  };

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      const dragState = dragStateRef.current;
      if (!dragState) return;
      const dx = event.clientX - dragState.startX;
      const dy = event.clientY - dragState.startY;
      let nextDx = dx;
      let nextDy = dy;

      if (event.shiftKey) {
        if (!dragState.axis) {
          dragState.axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
        }
        if (dragState.axis === 'x') {
          nextDy = 0;
        }
        if (dragState.axis === 'y') {
          nextDx = 0;
        }
      } else {
        dragState.axis = null;
      }

      const active = selectedElements[0];
      if (snapEnabled && active) {
        const origin = dragState.origin[active.id];
        if (origin) {
          let snappedX = applySnap(origin.x + nextDx, GRID_SIZE);
          let snappedY = applySnap(origin.y + nextDy, GRID_SIZE);
          const centerX = snappedX + active.width / 2;
          const centerY = snappedY + active.height / 2;
          const threshold = 6;
          if (Math.abs(centerX - CANVAS_WIDTH / 2) < threshold) {
            snappedX = CANVAS_WIDTH / 2 - active.width / 2;
          }
          if (Math.abs(centerY - CANVAS_HEIGHT / 2) < threshold) {
            snappedY = CANVAS_HEIGHT / 2 - active.height / 2;
          }
          nextDx = snappedX - origin.x;
          nextDy = snappedY - origin.y;
        }
      }

      onLayoutChange({
        ...layout,
        elements: layout.elements.map((element) => {
          const origin = dragState.origin[element.id];
          if (!origin) return element;
          return {
            ...element,
            x: origin.x + nextDx,
            y: origin.y + nextDy,
          };
        }),
      });

      if (snapEnabled && selectedElements[0]) {
        const activeGuide = selectedElements[0];
        const centerX = activeGuide.x + activeGuide.width / 2 + nextDx;
        const centerY = activeGuide.y + activeGuide.height / 2 + nextDy;
        const threshold = 6;
        setSnapGuides({
          centerX: Math.abs(centerX - CANVAS_WIDTH / 2) < threshold,
          centerY: Math.abs(centerY - CANVAS_HEIGHT / 2) < threshold,
          left: Math.abs(activeGuide.x + nextDx) < threshold,
          right:
            Math.abs(activeGuide.x + activeGuide.width + nextDx - CANVAS_WIDTH) < threshold,
          top: Math.abs(activeGuide.y + nextDy) < threshold,
          bottom:
            Math.abs(activeGuide.y + activeGuide.height + nextDy - CANVAS_HEIGHT) < threshold,
        });
      }
    };

    const handleMouseUp = () => {
      if (dragStateRef.current) {
        dragStateRef.current = null;
        setSnapGuides({
          centerX: false,
          centerY: false,
          left: false,
          right: false,
          top: false,
          bottom: false,
        });
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [layout, onLayoutChange, selectedElements, snapEnabled]);

  return (
    <div
      className="relative h-full w-full"
      onMouseDown={(event) => handleMouseDown(event)}
      role="presentation"
    >
      {snapGuides.centerX && (
        <div className="absolute left-1/2 top-0 h-full w-px bg-cyan-400/80" />
      )}
      {snapGuides.centerY && (
        <div className="absolute left-0 top-1/2 h-px w-full bg-cyan-400/80" />
      )}
      {snapGuides.left && <div className="absolute left-0 top-0 h-full w-px bg-cyan-400/80" />}
      {snapGuides.right && <div className="absolute right-0 top-0 h-full w-px bg-cyan-400/80" />}
      {snapGuides.top && <div className="absolute left-0 top-0 h-px w-full bg-cyan-400/80" />}
      {snapGuides.bottom && (
        <div className="absolute left-0 bottom-0 h-px w-full bg-cyan-400/80" />
      )}

      {elements.map((element) => {
        if (element.hidden || !element.visible) return null;
        const isSelected = selectedIds.includes(element.id);
        const backgroundColor =
          element.type === 'text'
            ? 'transparent'
            : element.fill ?? (element.type === 'shape' ? '#2563eb' : '#111827');
        const textColor = element.type === 'text' ? element.fill ?? '#ffffff' : '#ffffff';

        return (
          <div
            key={element.id}
            onMouseDown={(event) => handleMouseDown(event, element.id)}
            className="absolute cursor-move"
            style={{
              left: element.x,
              top: element.y,
              width: element.width,
              height: element.height,
              transform: `rotate(${element.rotation}deg)`,
              opacity: element.opacity / 100,
            }}
          >
            <div
              className="flex h-full w-full items-center justify-center text-xs"
              style={{
                backgroundColor,
                color: textColor,
                border: `${element.borderWidth ?? 0}px solid ${element.borderColor ?? 'transparent'}`,
                fontSize: element.type === 'text' ? element.fontSize ?? 48 : undefined,
              }}
            >
              {element.type === 'text' && element.text}
              {element.type === 'image' && element.src ? (
                <img
                  src={element.src}
                  alt={element.name}
                  className="h-full w-full object-cover"
                />
              ) : null}
              {element.type !== 'text' && (element.type !== 'image' || !element.src) && element.name}
            </div>
            {isSelected && (
              <div
                className="pointer-events-none absolute inset-[-4px]"
                style={{ outline: '2px solid #3b82f6', outlineOffset: '2px' }}
              >
                {resizeHandles.map((handle) => (
                  <div
                    key={handle.key}
                    className={`pointer-events-auto absolute h-1.5 w-1.5 bg-white ${handle.cursor}`}
                    style={{
                      left: `${handle.x}%`,
                      top: `${handle.y}%`,
                      transform: 'translate(-50%, -50%)',
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
