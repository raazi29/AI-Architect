'use client';

import React, { useState, useRef, DragEvent, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { Sofa, Lamp, Table, Armchair, Bed, Tv, Maximize, Minimize, RotateCcw, Trash2, Save, Share, Bot, Square, Circle, Triangle, Plus, Minus, Eraser, FolderOpen } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Furniture {
  id: number;
  name: string;
  icon: React.ReactNode;
  width: number;
  height: number;
  type: 'furniture' | 'wall' | 'element' | 'window' | 'door';
  defaultColor: string;
}

const furnitureList: Furniture[] = [
  { id: 1, name: 'Sofa', icon: <Sofa className="w-8 h-8" />, width: 200, height: 90, type: 'furniture', defaultColor: '#a3a3a3' },
  { id: 2, name: 'Armchair', icon: <Armchair className="w-8 h-8" />, width: 100, height: 90, type: 'furniture', defaultColor: '#a3a3a3' },
  { id: 3, name: 'Coffee Table', icon: <Table className="w-8 h-8" />, width: 120, height: 60, type: 'furniture', defaultColor: '#eab308' },
  { id: 4, name: 'TV Stand', icon: <Tv className="w-8 h-8" />, width: 180, height: 40, type: 'furniture', defaultColor: '#eab308' },
  { id: 5, name: 'Bed', icon: <Bed className="w-8 h-8" />, width: 160, height: 200, type: 'furniture', defaultColor: '#a3a3a3' },
  { id: 6, name: 'Side Table', icon: <Table className="w-8 h-8" />, width: 50, height: 50, type: 'furniture', defaultColor: '#eab308' },
  { id: 7, name: 'Floor Lamp', icon: <Lamp className="w-8 h-8" />, width: 40, height: 40, type: 'element', defaultColor: '#fde047' },
  { id: 8, name: 'Wall', icon: <Square className="w-8 h-8" />, width: 200, height: 10, type: 'wall', defaultColor: '#404040' },
  { id: 9, name: 'Round Table', icon: <Circle className="w-8 h-8" />, width: 100, height: 100, type: 'furniture', defaultColor: '#eab308' },
  { id: 10, name: 'Plant', icon: <Triangle className="w-8 h-8" />, width: 50, height: 50, type: 'element', defaultColor: '#22c55e' },
  { id: 11, name: 'Window', icon: <Square className="w-8 h-8" />, width: 120, height: 10, type: 'window', defaultColor: '#38bdf8' },
  { id: 12, name: 'Door', icon: <Square className="w-8 h-8" />, width: 90, height: 10, type: 'door', defaultColor: '#f97316' },
  { id: 13, name: 'Rug', icon: <Square className="w-8 h-8" />, width: 240, height: 160, type: 'element', defaultColor: '#ec4899' },
];

interface PlacedFurniture {
  instanceId: number;
  id: number;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  color: string;
  type: 'furniture' | 'wall' | 'element' | 'window' | 'door';
}

const InteractiveLayoutDesigner = () => {
  const [placedFurniture, setPlacedFurniture] = useState<PlacedFurniture[]>([]);
  const [selectedFurnitureId, setSelectedFurnitureId] = useState<number | null>(null);
  const [zoom, setZoom] = useState(1);
  const canvasRef = useRef<HTMLDivElement>(null);
  const nextInstanceId = useRef(0);

  useEffect(() => {
    loadLayout();
  }, []);

  const handleDragStart = (e: DragEvent<HTMLDivElement>, furniture: Furniture) => {
    e.dataTransfer.setData('furnitureId', furniture.id.toString());
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const furnitureId = parseInt(e.dataTransfer.getData('furnitureId'), 10);
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;

    const furniture = furnitureList.find(f => f.id === furnitureId);
    if (furniture) {
      setPlacedFurniture([
        ...placedFurniture,
        {
          instanceId: nextInstanceId.current++,
          id: furniture.id,
          name: furniture.name,
          x: x - furniture.width / 2,
          y: y - furniture.height / 2,
          width: furniture.width,
          height: furniture.height,
          rotation: 0,
          color: furniture.defaultColor,
          type: furniture.type,
        },
      ]);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleSelectFurniture = (instanceId: number) => {
    setSelectedFurnitureId(instanceId);
  };

  const handleUpdateFurniture = (instanceId: number, updates: Partial<PlacedFurniture>) => {
    setPlacedFurniture(placedFurniture.map(f => f.instanceId === instanceId ? { ...f, ...updates } : f));
  };
  
  const handleDeleteFurniture = (instanceId: number) => {
    setPlacedFurniture(placedFurniture.filter(f => f.instanceId !== instanceId));
    setSelectedFurnitureId(null);
  };

  const saveLayout = () => {
    try {
      localStorage.setItem('interactiveLayout', JSON.stringify(placedFurniture));
      toast({ title: "Layout Saved!", description: "Your layout has been saved to local storage." });
    } catch (error) {
      toast({ title: "Error", description: "Could not save layout.", variant: "destructive" });
    }
  };

  const loadLayout = () => {
    try {
      const savedLayout = localStorage.getItem('interactiveLayout');
      if (savedLayout) {
        const parsedLayout = JSON.parse(savedLayout);
        setPlacedFurniture(parsedLayout);
        nextInstanceId.current = parsedLayout.length > 0 ? Math.max(...parsedLayout.map((f: PlacedFurniture) => f.instanceId)) + 1 : 0;
        toast({ title: "Layout Loaded!", description: "Your saved layout has been loaded." });
      }
    } catch (error) {
      toast({ title: "Error", description: "Could not load layout.", variant: "destructive" });
    }
  };

  const clearLayout = () => {
    setPlacedFurniture([]);
    setSelectedFurnitureId(null);
    nextInstanceId.current = 0;
    toast({ title: "Layout Cleared!", description: "The canvas has been cleared." });
  };

  const selectedFurniture = placedFurniture.find(f => f.instanceId === selectedFurnitureId);

  const getElementStyle = (furniture: PlacedFurniture) => {
    const baseStyle: React.CSSProperties = {
      left: furniture.x,
      top: furniture.y,
      width: furniture.width,
      height: furniture.height,
      transform: `rotate(${furniture.rotation}deg)`,
      border: `2px solid ${selectedFurnitureId === furniture.instanceId ? '#4f46e5' : 'transparent'}`,
      backgroundColor: furniture.color,
    };

    switch (furniture.type) {
      case 'wall':
        return { ...baseStyle, borderRadius: '0' };
      case 'window':
        return { ...baseStyle, border: '4px solid #38bdf8', backgroundColor: 'rgba(56, 189, 248, 0.3)' };
      case 'door':
        return { ...baseStyle, border: '4px solid #f97316', backgroundColor: 'rgba(249, 115, 22, 0.3)' };
      case 'element':
        return { ...baseStyle, borderRadius: '50%' };
      default:
        return { ...baseStyle, borderRadius: '4px' };
    }
  };

  return (
    <Card className="w-full h-[700px] shadow-lg border-0">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Maximize className="h-6 w-6 text-indigo-500" />
            Interactive Layout Designer
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="h-[calc(100%-78px)] p-0">
        <ResizablePanelGroup direction="horizontal" className="h-full">
          <ResizablePanel defaultSize={20} minSize={15} className="p-4 bg-gray-50/50 flex flex-col">
            <h3 className="font-semibold mb-4">Elements</h3>
            <div className="grid grid-cols-2 gap-4 overflow-y-auto">
              {furnitureList.map(furniture => (
                <div
                  key={furniture.id}
                  draggable
                  onDragStart={e => handleDragStart(e, furniture)}
                  className="flex flex-col items-center justify-center p-4 border rounded-lg cursor-grab bg-white hover:shadow-md transition-shadow"
                >
                  {furniture.icon}
                  <span className="text-xs mt-2">{furniture.name}</span>
                </div>
              ))}
            </div>
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={80}>
            <div className="relative w-full h-full bg-gray-100 overflow-hidden flex flex-col">
              <div className="p-2 bg-gray-200 border-b border-gray-300 flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={saveLayout}><Save className="w-4 h-4 mr-2" /> Save</Button>
                <Button variant="outline" size="sm" onClick={loadLayout}><FolderOpen className="w-4 h-4 mr-2" /> Load</Button>
                <Button variant="destructive" size="sm" onClick={clearLayout}><Eraser className="w-4 h-4 mr-2" /> Clear</Button>
                <div className="flex-grow" />
                <Button variant="outline" size="sm" onClick={() => setZoom(z => Math.max(0.2, z - 0.1))}><Minus className="w-4 h-4" /></Button>
                <span className="text-sm font-medium w-12 text-center">{(zoom * 100).toFixed(0)}%</span>
                <Button variant="outline" size="sm" onClick={() => setZoom(z => Math.min(2, z + 0.1))}><Plus className="w-4 h-4" /></Button>
              </div>
              <div
                ref={canvasRef}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                className="relative flex-grow"
                style={{
                  backgroundImage: 'linear-gradient(rgba(0,0,0,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.05) 1px, transparent 1px)',
                  backgroundSize: `${20 * zoom}px ${20 * zoom}px`,
                  transform: `scale(${zoom})`,
                  transformOrigin: 'top left',
                }}
              >
                {placedFurniture.map(furniture => (
                  <div
                    key={furniture.instanceId}
                    onClick={() => handleSelectFurniture(furniture.instanceId)}
                    className="absolute cursor-move"
                    style={getElementStyle(furniture)}
                  >
                    <div className="w-full h-full flex items-center justify-center text-center p-2">
                      <span className="text-xs text-black/60 font-semibold">{furniture.name}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </ResizablePanel>
          {selectedFurniture && (
            <ResizablePanel defaultSize={20} minSize={15} className="p-4 bg-gray-50/50">
              <h3 className="font-semibold mb-4">Properties</h3>
              <div className="space-y-4">
                <div>
                  <Label>Width (px)</Label>
                  <Input
                    type="number"
                    value={selectedFurniture.width}
                    onChange={e => handleUpdateFurniture(selectedFurniture.instanceId, { width: parseInt(e.target.value) })}
                  />
                </div>
                <div>
                  <Label>Height (px)</Label>
                  <Input
                    type="number"
                    value={selectedFurniture.height}
                    onChange={e => handleUpdateFurniture(selectedFurniture.instanceId, { height: parseInt(e.target.value) })}
                  />
                </div>
                <div>
                  <Label>Rotation</Label>
                  <Input
                    type="number"
                    value={selectedFurniture.rotation}
                    onChange={e => handleUpdateFurniture(selectedFurniture.instanceId, { rotation: parseInt(e.target.value) })}
                  />
                </div>
                <div>
                  <Label>Color</Label>
                  <Input
                    type="color"
                    value={selectedFurniture.color}
                    onChange={e => handleUpdateFurniture(selectedFurniture.instanceId, { color: e.target.value })}
                  />
                </div>
                <Button variant="outline" size="sm" onClick={() => handleUpdateFurniture(selectedFurniture.instanceId, { rotation: selectedFurniture.rotation + 90 })}>
                  <RotateCcw className="w-4 h-4 mr-2" /> Rotate 90°
                </Button>
                <Button variant="destructive" size="sm" onClick={() => handleDeleteFurniture(selectedFurniture.instanceId)}>
                  <Trash2 className="w-4 h-4 mr-2" /> Delete
                </Button>
              </div>
            </ResizablePanel>
          )}
        </ResizablePanelGroup>
      </CardContent>
    </Card>
  );
};

export default InteractiveLayoutDesigner;
