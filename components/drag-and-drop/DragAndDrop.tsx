"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { 
  Download,
  Lock,
  Move,
  Plus,
  Trash2,
  Unlock,
  X,
} from "lucide-react";

interface DraggableItem {
  id: string;
  project_id: string;
  created_by: string;
  type: string;
  content: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  zIndex: number;
  rotation: number;
  opacity: number;
  locked: boolean;
  created_at: string;
  updated_at: string;
}

interface DragAndDropProps {
  projectId: string;
}

export default function DragAndDrop({ projectId }: DragAndDropProps) {
  const { user } = useAuth();
  const [items, setItems] = useState<DraggableItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<DraggableItem | null>(null);
  const [draggingItem, setDraggingItem] = useState<DraggableItem | null>(null);
  const [resizingItem, setResizingItem] = useState<DraggableItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newItem, setNewItem] = useState({
    type: "text",
    content: "",
  });
  const canvasRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });

  // Fetch items
  useEffect(() => {
    if (!projectId || !user) return;

    const fetchItems = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("draggable_items")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching items:", error);
      } else {
        setItems(data || []);
      }
      setLoading(false);
    };

    fetchItems();

    // Subscribe to item changes
    const channel = supabase
      .channel("draggable-items-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "draggable_items",
          filter: `project_id=eq.${projectId}`,
        },
        (payload: any) => {
          fetchItems();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId, user]);

  // Update canvas size on resize
  useEffect(() => {
    const updateCanvasSize = () => {
      if (canvasRef.current) {
        setCanvasSize({
          width: canvasRef.current.clientWidth,
          height: canvasRef.current.clientHeight,
        });
      }
    };

    updateCanvasSize();
    window.addEventListener("resize", updateCanvasSize);

    return () => {
      window.removeEventListener("resize", updateCanvasSize);
    };
  }, []);

  // Create new item
  const handleCreateItem = async () => {
    if (!newItem.content.trim() || !user) return;

    try {
      const { data, error } = await supabase
        .from("draggable_items")
        .insert([
          {
            project_id: projectId,
            type: newItem.type,
            content: newItem.content,
            position: { x: canvasSize.width / 2 - 50, y: canvasSize.height / 2 - 25 },
            size: { width: 100, height: 50 },
            zIndex: items.length + 1,
            rotation: 0,
            opacity: 1,
            locked: false,
            created_by: user.id,
          },
        ])
        .select();

      if (error) {
        console.error("Error creating item:", error);
      } else if (data) {
        setItems([data[0], ...items]);
        setNewItem({
          type: "text",
          content: "",
        });
        setShowCreateForm(false);
      }
    } catch (error) {
      console.error("Error creating item:", error);
    }
  };

  // Update item position
  const updateItemPosition = async (itemId: string, position: { x: number; y: number }) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("draggable_items")
        .update({
          position,
          updated_at: new Date().toISOString(),
        })
        .eq("id", itemId)
        .select();

      if (error) {
        console.error("Error updating item position:", error);
      } else if (data) {
        setItems(items.map(item => item.id === itemId ? { ...item, ...data[0] } : item));
      }
    } catch (error) {
      console.error("Error updating item position:", error);
    }
  };

  // Update item size
  const updateItemSize = async (itemId: string, size: { width: number; height: number }) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("draggable_items")
        .update({
          size,
          updated_at: new Date().toISOString(),
        })
        .eq("id", itemId)
        .select();

      if (error) {
        console.error("Error updating item size:", error);
      } else if (data) {
        setItems(items.map(item => item.id === itemId ? { ...item, ...data[0] } : item));
      }
    } catch (error) {
      console.error("Error updating item size:", error);
    }
  };

  // Update item properties
  const updateItemProperties = async (itemId: string, updates: Partial<DraggableItem>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("draggable_items")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("id", itemId)
        .select();

      if (error) {
        console.error("Error updating item properties:", error);
      } else if (data) {
        setItems(items.map(item => item.id === itemId ? { ...item, ...data[0] } : item));
        if (selectedItem && selectedItem.id === itemId) {
          setSelectedItem({ ...selectedItem, ...data[0] });
        }
      }
    } catch (error) {
      console.error("Error updating item properties:", error);
    }
  };

  // Delete item
  const handleDeleteItem = async (itemId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("draggable_items")
        .delete()
        .eq("id", itemId);

      if (error) {
        console.error("Error deleting item:", error);
      } else {
        setItems(items.filter(item => item.id !== itemId));
        if (selectedItem && selectedItem.id === itemId) {
          setSelectedItem(null);
        }
      }
    } catch (error) {
      console.error("Error deleting item:", error);
    }
  };

  // Handle drag start
  const handleDragStart = (e: React.DragEvent, item: DraggableItem) => {
    e.dataTransfer.setData("item-id", item.id);
    setDraggingItem(item);
    setSelectedItem(item);
  };

  // Handle drag over
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  // Handle drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const itemId = e.dataTransfer.getData("item-id");
    if (!itemId || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    updateItemPosition(itemId, { x, y });
    setDraggingItem(null);
  };

  // Handle resize start
  const handleResizeStart = (e: React.MouseEvent, item: DraggableItem) => {
    e.stopPropagation();
    setResizingItem(item);
    setSelectedItem(item);
  };

  // Handle mouse move for resizing
  const handleMouseMove = (e: MouseEvent) => {
    if (!resizingItem || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newWidth = Math.max(50, x - resizingItem.position.x);
    const newHeight = Math.max(50, y - resizingItem.position.y);

    updateItemSize(resizingItem.id, { width: newWidth, height: newHeight });
  };

  // Handle mouse up for resizing
  const handleMouseUp = () => {
    setResizingItem(null);
  };

  // Add event listeners for resizing
  useEffect(() => {
    if (resizingItem) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [resizingItem]);

  // Render item based on type
  const renderItem = (item: DraggableItem) => {
    switch (item.type) {
      case "text":
        return (
          <div className="w-full h-full p-2 bg-white border rounded">
            <p className="text-sm">{item.content}</p>
          </div>
        );
      case "image":
        return (
          <div className="w-full h-full bg-white border rounded overflow-hidden">
            <img 
              src={item.content} 
              alt="Draggable item" 
              className="w-full h-full object-contain"
            />
          </div>
        );
      case "shape":
        return (
          <div className="w-full h-full bg-blue-200 border border-blue-300 rounded flex items-center justify-center">
            <div className="w-8 h-8 bg-blue-500 rounded-full"></div>
          </div>
        );
      default:
        return (
          <div className="w-full h-full p-2 bg-white border rounded">
            <p className="text-sm">{item.content}</p>
          </div>
        );
    }
  };

  if (loading) {
    return <div className="p-4 text-center">Loading drag-and-drop workspace...</div>;
  }

  return (
    <div className="h-full flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="flex items-center gap-2">
          <Move className="h-5 w-5" />
          Drag-and-Drop Workspace
        </CardTitle>
        <div className="flex gap-2">
          <Button onClick={() => setShowCreateForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Item
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </CardHeader>

      {showCreateForm && (
        <Card className="mb-4">
          <CardHeader>
            <CardTitle>Add New Item</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Item Type</label>
              <Select
                value={newItem.type}
                onValueChange={(value) => setNewItem({ ...newItem, type: value })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Text</SelectItem>
                  <SelectItem value="image">Image</SelectItem>
                  <SelectItem value="shape">Shape</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">
                {newItem.type === "text" ? "Text Content" : 
                 newItem.type === "image" ? "Image URL" : "Shape Properties"}
              </label>
              <Input
                value={newItem.content}
                onChange={(e) => setNewItem({ ...newItem, content: e.target.value })}
                placeholder={
                  newItem.type === "text" ? "Enter text..." : 
                  newItem.type === "image" ? "Enter image URL..." : "Enter shape properties..."
                }
                className="mt-1"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleCreateItem} className="flex-1">
                Add Item
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowCreateForm(false)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <CardContent className="flex-1 p-0 overflow-hidden">
        <div 
          ref={canvasRef}
          className="relative w-full h-full bg-muted/10 border rounded-lg overflow-hidden"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          {items.map((item) => (
            <div
              key={item.id}
              className={`absolute cursor-move ${
                selectedItem?.id === item.id ? "ring-2 ring-blue-500" : ""
              } ${item.locked ? "cursor-not-allowed" : ""}`}
              style={{
                left: `${item.position.x}px`,
                top: `${item.position.y}px`,
                width: `${item.size.width}px`,
                height: `${item.size.height}px`,
                zIndex: item.zIndex,
                transform: `rotate(${item.rotation}deg)`,
                opacity: item.opacity,
              }}
              draggable={!item.locked}
              onDragStart={(e) => handleDragStart(e, item)}
              onClick={() => setSelectedItem(item)}
            >
              {renderItem(item)}
              
              {/* Resize handle */}
              {!item.locked && (
                <div
                  className="absolute bottom-0 right-0 w-3 h-3 bg-blue-500 cursor-se-resize"
                  onMouseDown={(e) => handleResizeStart(e, item)}
                />
              )}
              
              {/* Lock indicator */}
              {item.locked && (
                <div className="absolute top-1 right-1">
                  <Lock className="h-4 w-4 text-muted-foreground" />
                </div>
              )}
            </div>
          ))}
          
          {items.length === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
              <Move className="h-16 w-16 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Drag-and-Drop Workspace</h3>
              <p className="mb-4 text-center max-w-md">
                Add items to the workspace and drag them around to create your design
              </p>
              <Button onClick={() => setShowCreateForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Item
              </Button>
            </div>
          )}
        </div>
      </CardContent>

      {selectedItem && (
        <Card className="mt-4">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Item Properties</CardTitle>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => updateItemProperties(selectedItem.id, { locked: !selectedItem.locked })}
                >
                  {selectedItem.locked ? (
                    <Unlock className="h-4 w-4" />
                  ) : (
                    <Lock className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => handleDeleteItem(selectedItem.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => setSelectedItem(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Position X</label>
                <Input
                  type="number"
                  value={Math.round(selectedItem.position.x)}
                  onChange={(e) => updateItemProperties(selectedItem.id, { 
                    position: { ...selectedItem.position, x: parseInt(e.target.value) || 0 } 
                  })}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Position Y</label>
                <Input
                  type="number"
                  value={Math.round(selectedItem.position.y)}
                  onChange={(e) => updateItemProperties(selectedItem.id, { 
                    position: { ...selectedItem.position, y: parseInt(e.target.value) || 0 } 
                  })}
                  className="mt-1"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Width</label>
                <Input
                  type="number"
                  value={Math.round(selectedItem.size.width)}
                  onChange={(e) => updateItemProperties(selectedItem.id, { 
                    size: { ...selectedItem.size, width: parseInt(e.target.value) || 50 } 
                  })}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Height</label>
                <Input
                  type="number"
                  value={Math.round(selectedItem.size.height)}
                  onChange={(e) => updateItemProperties(selectedItem.id, { 
                    size: { ...selectedItem.size, height: parseInt(e.target.value) || 50 } 
                  })}
                  className="mt-1"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Rotation</label>
                <Input
                  type="number"
                  value={selectedItem.rotation}
                  onChange={(e) => updateItemProperties(selectedItem.id, { 
                    rotation: parseInt(e.target.value) || 0 
                  })}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Opacity</label>
                <Input
                  type="number"
                  min="0"
                  max="1"
                  step="0.1"
                  value={selectedItem.opacity}
                  onChange={(e) => updateItemProperties(selectedItem.id, { 
                    opacity: parseFloat(e.target.value) || 0 
                  })}
                  className="mt-1"
                />
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium">Z-Index</label>
              <Input
                type="number"
                value={selectedItem.zIndex}
                onChange={(e) => updateItemProperties(selectedItem.id, { 
                  zIndex: parseInt(e.target.value) || 0 
                })}
                className="mt-1"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium">Content</label>
              <Textarea
                value={selectedItem.content}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => updateItemProperties(selectedItem.id, { 
                  content: e.target.value 
                })}
                className="mt-1"
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}