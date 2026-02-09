import React, { useState, useRef } from 'react';
import { useBroadcastController } from '../hooks/useBroadcastController';

interface CanvasStageProps {
  layout: any;
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
  selectedIds = [],
  scale = 1,
  snapEnabled = false,
  showGrid = false,
  showSafeZones = false,
  onSelectionChange = () => {},
  onLayoutChange = () => {},
}) => {
  // FIX: Destructure setLayout instead of the missing updateElement
  const { setLayout } = useBroadcastController(); 
  const stageRef = useRef<HTMLDivElement>(null);
  const [dragState, setDragState] = useState<{
    isDragging: boolean;
    startX: number;
    startY: number;
    initialPositions: Record<string, { x: number; y: number }>;
  } | null>(null);

  // --- LOCAL HELPER ---
  const updateElement = (id: string, updates: any) => {
    setLayout((prev: any) => {
      if (!prev) return prev;
      return {
        ...prev,
        elements: prev.elements.map((el: any) => 
          el.id === id ? { ...el, ...updates } : el
        )
      };
    });
  };

  // --- MOUSE HANDLERS ---

  const handlePointerDown = (e: React.PointerEvent, elementId: string) => {
    e.stopPropagation();
    e.preventDefault();
    
    (e.target as Element).setPointerCapture(e.pointerId);

    let newSelection = selectedIds;
    if (!selectedIds.includes(elementId)) {
        newSelection = e.shiftKey ? [...selectedIds, elementId] : [elementId];
        onSelectionChange(newSelection);
    }

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

  // Safe Guard: If layout is null, render nothing
  if (!layout) return <div className="flex-1 bg-zinc-950" />;

  return (
    <div 
      className="flex-1 bg-zinc-950 overflow-hidden relative flex items-center justify-center select-none"
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {/* RULERS */}
      <div className="absolute top-0 left-0 w-full h-6 bg-zinc-900 border-b border-zinc-800 z-50 flex select-none text-[10px] text-zinc-500 overflow-hidden">
        {Array.from({ length: 20 }).map((_, i) => (
             <div key={i} className="flex-shrink-0 w-[100px] border-l border-zinc-700 pl-1">{i * 100}</div>
        ))}
      </div>
      <div className="absolute top-6 left-0 w-6 h-full bg-zinc-900 border-r border-zinc-800 z-50 flex flex-col select-none text-[10px] text-zinc-500 overflow-hidden">
        {Array.from({ length: 12 }).map((_, i) => (
             <div key={i} className="flex-shrink-0 h-[100px] border-t border-zinc-700 pt-1">{i * 100}</div>
        ))}
      </div>

      {/* STAGE */}
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
        {/* GRID */}
        {showGrid && (
            <div 
                className="absolute inset-0 z-0 pointer-events-none" 
                style={{ 
                    backgroundImage: 'radial-gradient(#333 1px, transparent 1px)', 
                    backgroundSize: '50px 50px' 
                }} 
            />
        )}

        {/* SAFE ZONES */}
        {showSafeZones && (
            <>
                <div className="absolute inset-0 m-auto border-2 border-yellow-500 opacity-50 z-50 pointer-events-none" style={{ width: '80%', height: '80%' }} />
                <div className="absolute inset-0 m-auto border-2 border-green-500 opacity-50 z-50 pointer-events-none" style={{ width: '90%', height: '90%' }} />
            </>
        )}

        {/* ELEMENTS */}
        {layout.elements && layout.elements.map((el: any) => {
            const isSelected = selectedIds.includes(el.id);
            return (
                <div
                    key={el.id}
                    onPointerDown={(e) => handlePointerDown(e, el.id)}
                    className={`absolute group hover:outline hover:outline-1 hover:outline-blue-400 ${isSelected ? 'cursor-move' : 'cursor-pointer'}`}
                    style={{
                        left: el.x,
                        top: el.y,
                        width: el.width,
                        height: el.height,
                        zIndex: 10
                    }}
                >
                    {/* SELECTION UI */}
                    {isSelected && (
                        <div className="absolute -inset-[2px] border-2 border-blue-500 pointer-events-none z-50">
                            <div className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-white border border-blue-500" />
                            <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-white border border-blue-500" />
                            <div className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-white border border-blue-500" />
                            <div className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-white border border-blue-500" />
                        </div>
                    )}

                    {/* CONTENT TYPES */}
                    {el.type === 'text' && (
                        <div 
                            style={{ 
                                color: el.style?.color || 'white', 
                                fontSize: el.style?.fontSize || 48,
                                width: '100%', height: '100%',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                whiteSpace: 'nowrap'
                            }}
                        >
                            {el.data?.text || 'Text'}
                        </div>
                    )}
                    {el.type === 'shape' && (
                         <div style={{ width: '100%', height: '100%', backgroundColor: el.style?.backgroundColor || '#3b82f6' }} />
                    )}
                    {el.type === 'image' && (
                         <img src={el.src} style={{ width: '100%', height: '100%', objectFit: 'fill' }} draggable={false} />
                    )}
                </div>
            );
        })}
      </div>
    </div>
  );
};
