import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const sceneData = await request.json()

  // In production, this would save to a database
  console.log("Saving AR scene:", sceneData)

  const savedScene = {
    id: `scene-${Date.now()}`,
    ...sceneData,
    createdAt: new Date().toISOString(),
  }

  return NextResponse.json({
    success: true,
    scene: savedScene,
    message: "AR scene saved successfully",
  })
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get("userId")

  // In production, this would fetch from a database
  const mockScenes = [
    {
      id: "scene-1",
      name: "Living Room Setup",
      items: [],
      roomDimensions: { width: 400, length: 500 },
      createdAt: "2024-01-15T10:00:00Z",
    },
  ]

  return NextResponse.json({
    scenes: mockScenes,
    total: mockScenes.length,
  })
}
