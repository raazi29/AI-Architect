import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500))

    // Mock collaboration data
    const projects = [
      {
        id: "1",
        title: "Modern Living Room Redesign",
        description: "Collaborative redesign of a 400 sq ft living room with minimalist aesthetic",
        thumbnail: "/modern-minimalist-living-room.jpg",
        owner: { id: "1", name: "Sarah Chen", role: "owner", status: "online" },
        collaborators: [
          { id: "2", name: "Mike Johnson", role: "editor", status: "online" },
          { id: "3", name: "Emma Davis", role: "viewer", status: "away" },
        ],
        status: "active",
        lastActivity: new Date().toISOString(),
        comments: 12,
        likes: 24,
        views: 156,
        isPublic: true,
      },
    ]

    return NextResponse.json({ projects })
  } catch (error) {
    console.error("Collaborate API error:", error)
    return NextResponse.json({ error: "Failed to fetch collaboration data" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { title, description, isPublic } = await request.json()

    // Simulate project creation
    const newProject = {
      id: Date.now().toString(),
      title,
      description,
      thumbnail: "/modern-room-design.jpg",
      owner: { id: "current", name: "You", role: "owner", status: "online" },
      collaborators: [],
      status: "draft",
      lastActivity: new Date().toISOString(),
      comments: 0,
      likes: 0,
      views: 0,
      isPublic,
    }

    return NextResponse.json({ project: newProject })
  } catch (error) {
    console.error("Create project API error:", error)
    return NextResponse.json({ error: "Failed to create project" }, { status: 500 })
  }
}
