import React, { useState, useRef } from 'react';
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
  
  const [dragState, setDragState] = useState<{
    isDragging: boolean;
    startX: number;
    startY: number;
    initialPositions: Record<string, { x: number; y: number }>;
  } | null>(null);

  // --- MOUSE HANDLERS ---

  const handlePointerDown = (e: React.PointerEvent, elementId: string) => {
    e.stopPropagation();
    e.preventDefault();
    
    // 1. Capture Pointer (Prevents mouse slipping off element)
    (e.target as Element).setPointerCapture(e.pointerId);

    // 2. Handle Selection
    let newSelection = selectedIds;
    if (!selectedIds.includes(elementId)) {
        newSelection = e.shiftKey ? [...selectedIds, elementId] : [elementId];
        onSelectionChange(newSelection);
    }

    // 3. Store Initial Positions (Snapshot for Drag)
    const initialPositions: Record<string, { x: number; y: number }> = {};
    if (layout && layout.elements) {
        layout.elements.forEach((el: any) => {
        if (newSelection.includes(el.id)) {
            initialPositions[el.id] = { x: el.x, y: el.y };
        }
        });
    }

    setDragState({
      isDragging: true,
      startX: e.clientX,
      startY: e.clientY,
      initialPositions,
    });
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragState || !dragState.isDragging) return;

    // THE MATH FIX: Calculate delta divided by scale
    // This ensures 100px mouse move = 100px element move, regardless of zoom
    const dx = (e.clientX - dragState.startX) / scale;
    const dy = (e.clientY - dragState.startY) / scale;

    Object.keys(dragState.initialPositions).forEach((id) => {
      const init = dragState.initialPositions[id];
      updateElement(id, {
        x: Math.round(init.x + dx),
        y: Math.round(init.y + dy),
      });
    });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (dragState) {
        setDragState(null);
        (e.target as Element).releasePointerCapture(e.pointerId);
    }
  };

  const handleStageClick = (e: React.MouseEvent) => {
    if (e.target === stageRef.current) {
      onSelectionChange([]);
    }
  };

  if (!layout) return <div className="flex-1 bg-zinc-950" />;

  return (
    <div 
      className="flex-1 bg-zinc-950 overflow-hidden relative flex items-center justify-center select-none"
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      

      {/* ZOOM CONTAINER */}
      <div 
        ref={stageRef}
        className="relative bg-black shadow-2xl"
        onClick={handleStageClick}
        style={{
          width: 1920,
          height: 1080,
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
          transition: 'transform 0.1s ease-out'
        }}
      >
        {/* GRID (Inside Zoom) */}
        {showGrid && (
            <div 
                className="absolute inset-0 z-0 pointer-events-none" 
                style={{ 
                    backgroundImage: 'radial-gradient(#333 1px, transparent 1px)', 
                    backgroundSize: '50px 50px' 
                }} 
            />
        )}

        {/* SAFE ZONES (Inside Zoom) */}
        {showSafeZones && (
            <>
                <div className="absolute inset-0 m-auto border-2 border-yellow-500 opacity-50 z-50 pointer-events-none" style={{ width: '80%', height: '80%' }} />
                <div className="absolute inset-0 m-auto border-2 border-green-500 opacity-50 z-50 pointer-events-none" style={{ width: '90%', height: '90%' }} />
            </>
        )}

        {/* LAYOUT ELEMENTS */}
        {layout.elements && layout.elements.map((el: any) => {
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
                        zIndex: 10
                    }}
                >
                    {/* SELECTION BOX */}
                    {isSelected && (
                        <div className="absolute -inset-[2px] border-2 border-blue-500 pointer-events-none z-50">
                            {/* Visual Corners */}
                            <div className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-white border border-blue-500" />
                            <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-white border border-blue-500" />
                            <div className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-white border border-blue-500" />
                            <div className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-white border border-blue-500" />
                        </div>
                    )}
                    
                    {/* Hover Outline (Only when not selected) */}
                    {!isSelected && (
                         <div className="absolute inset-0 border border-blue-400 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity" />
                    )}

                    {/* CONTENT */}
                    {el.type === 'text' && (
                        <div 
                            style={{ 
                                color: el.style?.color || 'white', 
                                fontSize: el.style?.fontSize || 48,
                                width: '100%', height: '100%',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                whiteSpace: 'nowrap',
                                pointerEvents: 'none' // Prevent text selection
                            }}
                        >
                            {el.data?.text || 'Text'}
                        </div>
                    )}
                    {el.type === 'shape' && (
                         <div style={{ width: '100%', height: '100%', backgroundColor: el.style?.backgroundColor || '#3b82f6', pointerEvents: 'none' }} />
                    )}
                    {el.type === 'image' && (
                         <img src={el.src} style={{ width: '100%', height: '100%', objectFit: 'fill', pointerEvents: 'none' }} draggable={false} />
                    )}
                </div>
            );
        })}
      </div>
    </div>
  );
};
