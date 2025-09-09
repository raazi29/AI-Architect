"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Navigation } from "@/components/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import {
  PenTool,
  Square,
  Move,
  Trash2,
  Save,
  Share,
  Download,
  Grid3X3,
  Ruler,
  Sofa,
  Bed,
  ChefHat,
  Bath,
  Briefcase,
  Zap,
  Undo,
  Redo,
} from "lucide-react"

interface Room {
  id: string
  type: string
  x: number
  y: number
  width: number
  height: number
  color: string
  label: string
}

interface Wall {
  id: string
  x1: number
  y1: number
  x2: number
  y2: number
  thickness: number
}

interface FloorPlanTemplate {
  id: string
  name: string
  type: string
  rooms: Room[]
  walls: Wall[]
  dimensions: { width: number; height: number }
  thumbnail: string
}

const roomTypes = [
  { type: "living-room", label: "Living Room", icon: Sofa, color: "#E3F2FD" },
  { type: "bedroom", label: "Bedroom", icon: Bed, color: "#F3E5F5" },
  { type: "kitchen", label: "Kitchen", icon: ChefHat, color: "#E8F5E8" },
  { type: "bathroom", label: "Bathroom", icon: Bath, color: "#FFF3E0" },
  { type: "office", label: "Office", icon: Briefcase, color: "#F1F8E9" },
]

const floorPlanTemplates: FloorPlanTemplate[] = [
  {
    id: "studio",
    name: "Studio Apartment",
    type: "Apartment",
    rooms: [
      {
        id: "main",
        type: "living-room",
        x: 50,
        y: 50,
        width: 300,
        height: 200,
        color: "#E3F2FD",
        label: "Main Room",
      },
      {
        id: "kitchen",
        type: "kitchen",
        x: 50,
        y: 250,
        width: 150,
        height: 100,
        color: "#E8F5E8",
        label: "Kitchen",
      },
      {
        id: "bathroom",
        type: "bathroom",
        x: 200,
        y: 250,
        width: 150,
        height: 100,
        color: "#FFF3E0",
        label: "Bathroom",
      },
    ],
    walls: [],
    dimensions: { width: 400, height: 400 },
    thumbnail: "/placeholder.svg?height=120&width=160&text=Studio",
  },
  {
    id: "one-bedroom",
    name: "One Bedroom",
    type: "Apartment",
    rooms: [
      {
        id: "living",
        type: "living-room",
        x: 50,
        y: 50,
        width: 200,
        height: 150,
        color: "#E3F2FD",
        label: "Living Room",
      },
      {
        id: "bedroom",
        type: "bedroom",
        x: 250,
        y: 50,
        width: 150,
        height: 150,
        color: "#F3E5F5",
        label: "Bedroom",
      },
      {
        id: "kitchen",
        type: "kitchen",
        x: 50,
        y: 200,
        width: 150,
        height: 100,
        color: "#E8F5E8",
        label: "Kitchen",
      },
      {
        id: "bathroom",
        type: "bathroom",
        x: 200,
        y: 200,
        width: 100,
        height: 100,
        color: "#FFF3E0",
        label: "Bathroom",
      },
    ],
    walls: [],
    dimensions: { width: 450, height: 350 },
    thumbnail: "/placeholder.svg?height=120&width=160&text=1BR",
  },
  {
    id: "two-bedroom",
    name: "Two Bedroom",
    type: "House",
    rooms: [
      {
        id: "living",
        type: "living-room",
        x: 50,
        y: 50,
        width: 250,
        height: 150,
        color: "#E3F2FD",
        label: "Living Room",
      },
      {
        id: "bedroom1",
        type: "bedroom",
        x: 300,
        y: 50,
        width: 150,
        height: 120,
        color: "#F3E5F5",
        label: "Master Bedroom",
      },
      {
        id: "bedroom2",
        type: "bedroom",
        x: 300,
        y: 170,
        width: 150,
        height: 100,
        color: "#F3E5F5",
        label: "Bedroom 2",
      },
      {
        id: "kitchen",
        type: "kitchen",
        x: 50,
        y: 200,
        width: 150,
        height: 100,
        color: "#E8F5E8",
        label: "Kitchen",
      },
      {
        id: "bathroom",
        type: "bathroom",
        x: 200,
        y: 200,
        width: 100,
        height: 100,
        color: "#FFF3E0",
        label: "Bathroom",
      },
    ],
    walls: [],
    dimensions: { width: 500, height: 350 },
    thumbnail: "/placeholder.svg?height=120&width=160&text=2BR",
  },
]

export default function FloorPlanGenerator() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<FloorPlanTemplate | null>(null)
  const [rooms, setRooms] = useState<Room[]>([])
  const [walls, setWalls] = useState<Wall[]>([])
  const [selectedTool, setSelectedTool] = useState<"select" | "room" | "wall">("select")
  const [selectedRoomType, setSelectedRoomType] = useState("living-room")
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null)
  const [showGrid, setShowGrid] = useState(true)
  const [showMeasurements, setShowMeasurements] = useState(false)
  const [planName, setPlanName] = useState("My Floor Plan")
  const [scale, setScale] = useState(1)
  const [canvasSize, setCanvasSize] = useState({ width: 600, height: 400 })

  useEffect(() => {
    drawCanvas()
  }, [rooms, walls, showGrid, selectedRoom, scale])

  const drawCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw grid
    if (showGrid) {
      ctx.strokeStyle = "#e5e7eb"
      ctx.lineWidth = 1
      const gridSize = 20 * scale

      for (let x = 0; x <= canvas.width; x += gridSize) {
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, canvas.height)
        ctx.stroke()
      }

      for (let y = 0; y <= canvas.height; y += gridSize) {
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(canvas.width, y)
        ctx.stroke()
      }
    }

    // Draw walls
    walls.forEach((wall) => {
      ctx.strokeStyle = "#374151"
      ctx.lineWidth = wall.thickness * scale
      ctx.beginPath()
      ctx.moveTo(wall.x1 * scale, wall.y1 * scale)
      ctx.lineTo(wall.x2 * scale, wall.y2 * scale)
      ctx.stroke()
    })

    // Draw rooms
    rooms.forEach((room) => {
      const x = room.x * scale
      const y = room.y * scale
      const width = room.width * scale
      const height = room.height * scale

      // Fill room
      ctx.fillStyle = room.color
      ctx.fillRect(x, y, width, height)

      // Draw room border
      ctx.strokeStyle = selectedRoom?.id === room.id ? "#0891b2" : "#9ca3af"
      ctx.lineWidth = selectedRoom?.id === room.id ? 3 : 1
      ctx.strokeRect(x, y, width, height)

      // Draw room label
      ctx.fillStyle = "#374151"
      ctx.font = `${12 * scale}px sans-serif`
      ctx.textAlign = "center"
      ctx.fillText(room.label, x + width / 2, y + height / 2)

      // Draw measurements if enabled
      if (showMeasurements) {
        ctx.fillStyle = "#6b7280"
        ctx.font = `${10 * scale}px sans-serif`
        ctx.textAlign = "center"
        ctx.fillText(`${room.width}cm`, x + width / 2, y - 5)
        ctx.save()
        ctx.translate(x - 15, y + height / 2)
        ctx.rotate(-Math.PI / 2)
        ctx.fillText(`${room.height}cm`, 0, 0)
        ctx.restore()
      }
    })
  }

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = (event.clientX - rect.left) / scale
    const y = (event.clientY - rect.top) / scale

    if (selectedTool === "room") {
      const roomType = roomTypes.find((type) => type.type === selectedRoomType)
      if (roomType) {
        const newRoom: Room = {
          id: `room-${Date.now()}`,
          type: selectedRoomType,
          x: x - 50,
          y: y - 50,
          width: 100,
          height: 100,
          color: roomType.color,
          label: roomType.label,
        }
        setRooms((prev) => [...prev, newRoom])
      }
    } else if (selectedTool === "select") {
      // Find clicked room
      const clickedRoom = rooms.find(
        (room) => x >= room.x && x <= room.x + room.width && y >= room.y && y <= room.y + room.height,
      )
      setSelectedRoom(clickedRoom || null)
    }
  }

  const loadTemplate = (template: FloorPlanTemplate) => {
    setSelectedTemplate(template)
    setRooms(template.rooms)
    setWalls(template.walls)
    setCanvasSize(template.dimensions)
    setPlanName(template.name)
    setSelectedRoom(null)
  }

  const updateSelectedRoom = (updates: Partial<Room>) => {
    if (!selectedRoom) return

    const updatedRoom = { ...selectedRoom, ...updates }
    setSelectedRoom(updatedRoom)
    setRooms((prev) => prev.map((room) => (room.id === selectedRoom.id ? updatedRoom : room)))
  }

  const deleteSelectedRoom = () => {
    if (!selectedRoom) return

    setRooms((prev) => prev.filter((room) => room.id !== selectedRoom.id))
    setSelectedRoom(null)
  }

  const generateAILayout = async () => {
    // Simulate AI processing
    console.log("Generating AI-optimized floor plan layout...")

    // In production, this would call an AI service to optimize the layout
    // For now, we'll just rearrange rooms in a more optimal way
    const optimizedRooms = rooms.map((room, index) => ({
      ...room,
      x: 50 + (index % 2) * 200,
      y: 50 + Math.floor(index / 2) * 150,
    }))

    setRooms(optimizedRooms)
  }

  const saveFloorPlan = () => {
    const floorPlanData = {
      name: planName,
      rooms,
      walls,
      dimensions: canvasSize,
      scale,
      timestamp: new Date().toISOString(),
    }

    console.log("Saving floor plan:", floorPlanData)
    // In production, this would save to a database
    alert("Floor plan saved successfully!")
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="ml-64 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <PenTool className="h-6 w-6 text-primary" />
                  <h1 className="text-3xl font-bold text-foreground">Floor Plan Generator</h1>
                </div>
                <p className="text-lg text-muted-foreground">
                  Create and modify floor plans with AI assistance and professional tools.
                </p>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={generateAILayout} disabled={rooms.length === 0}>
                  <Zap className="h-4 w-4 mr-2" />
                  AI Optimize
                </Button>
                <Button variant="outline" onClick={saveFloorPlan} disabled={rooms.length === 0}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Plan
                </Button>
                <Button variant="outline">
                  <Share className="h-4 w-4 mr-2" />
                  Share
                </Button>
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-4 mb-6">
              <div className="flex-1 max-w-md">
                <Label htmlFor="plan-name" className="text-sm font-medium">
                  Plan Name
                </Label>
                <Input id="plan-name" value={planName} onChange={(e) => setPlanName(e.target.value)} className="mt-1" />
              </div>

              <div className="flex items-center gap-2">
                <Button variant={showGrid ? "default" : "outline"} size="sm" onClick={() => setShowGrid(!showGrid)}>
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={showMeasurements ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowMeasurements(!showMeasurements)}
                >
                  <Ruler className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-3">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Floor Plan Canvas</span>
                    <div className="flex items-center gap-2">
                      <Label className="text-sm">Scale:</Label>
                      <Slider
                        value={[scale]}
                        onValueChange={([value]) => setScale(value)}
                        min={0.5}
                        max={2}
                        step={0.1}
                        className="w-20"
                      />
                      <span className="text-sm text-muted-foreground">{Math.round(scale * 100)}%</span>
                    </div>
                  </CardTitle>
                  <CardDescription>Click and drag to create your floor plan</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="border border-border rounded-lg overflow-hidden">
                    <canvas
                      ref={canvasRef}
                      width={canvasSize.width * scale}
                      height={canvasSize.height * scale}
                      className="cursor-crosshair bg-white"
                      onClick={handleCanvasClick}
                    />
                  </div>

                  <div className="flex items-center justify-between mt-4">
                    <div className="flex gap-2">
                      <Button
                        variant={selectedTool === "select" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedTool("select")}
                      >
                        <Move className="h-4 w-4" />
                      </Button>
                      <Button
                        variant={selectedTool === "room" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedTool("room")}
                      >
                        <Square className="h-4 w-4" />
                      </Button>
                      <Button
                        variant={selectedTool === "wall" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedTool("wall")}
                      >
                        <PenTool className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Undo className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Redo className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setRooms([])}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Templates</CardTitle>
                  <CardDescription>Start with a pre-built layout</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {floorPlanTemplates.map((template) => (
                      <div
                        key={template.id}
                        className="flex items-center gap-3 p-3 border border-border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                        onClick={() => loadTemplate(template)}
                      >
                        <img
                          src={template.thumbnail || "/placeholder.svg"}
                          alt={template.name}
                          className="w-12 h-12 object-cover rounded-md"
                        />
                        <div className="flex-1">
                          <h4 className="font-medium text-foreground text-sm">{template.name}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {template.type}
                            </Badge>
                            <span className="text-xs text-muted-foreground">{template.rooms.length} rooms</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Room Tools</CardTitle>
                  <CardDescription>Add rooms to your floor plan</CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs value={selectedRoomType} onValueChange={setSelectedRoomType}>
                    <TabsList className="grid grid-cols-2 w-full mb-4">
                      <TabsTrigger value="living-room">
                        <Sofa className="h-4 w-4 mr-1" />
                        Living
                      </TabsTrigger>
                      <TabsTrigger value="bedroom">
                        <Bed className="h-4 w-4 mr-1" />
                        Bedroom
                      </TabsTrigger>
                    </TabsList>
                    <TabsList className="grid grid-cols-2 w-full mb-4">
                      <TabsTrigger value="kitchen">
                        <ChefHat className="h-4 w-4 mr-1" />
                        Kitchen
                      </TabsTrigger>
                      <TabsTrigger value="bathroom">
                        <Bath className="h-4 w-4 mr-1" />
                        Bathroom
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>

                  <div className="text-sm text-muted-foreground mb-4">
                    Select a room type above, then click on the canvas to add it.
                  </div>

                  {selectedRoom && (
                    <div className="space-y-4 p-4 bg-muted rounded-lg">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">Edit Room</h4>
                        <Button size="sm" variant="destructive" onClick={deleteSelectedRoom}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <div>
                        <Label className="text-sm">Room Name</Label>
                        <Input
                          value={selectedRoom.label}
                          onChange={(e) => updateSelectedRoom({ label: e.target.value })}
                          className="mt-1"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-sm">Width (cm)</Label>
                          <Slider
                            value={[selectedRoom.width]}
                            onValueChange={([value]) => updateSelectedRoom({ width: value })}
                            min={50}
                            max={500}
                            step={10}
                            className="mt-2"
                          />
                          <span className="text-xs text-muted-foreground">{selectedRoom.width}cm</span>
                        </div>

                        <div>
                          <Label className="text-sm">Height (cm)</Label>
                          <Slider
                            value={[selectedRoom.height]}
                            onValueChange={([value]) => updateSelectedRoom({ height: value })}
                            min={50}
                            max={500}
                            step={10}
                            className="mt-2"
                          />
                          <span className="text-xs text-muted-foreground">{selectedRoom.height}cm</span>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Plan Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Rooms:</span>
                      <span className="font-medium">{rooms.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Area:</span>
                      <span className="font-medium">
                        {Math.round(rooms.reduce((sum, room) => sum + (room.width * room.height) / 10000, 0))} m²
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Plan Dimensions:</span>
                      <span className="font-medium">
                        {canvasSize.width} × {canvasSize.height} cm
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
