import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const style = searchParams.get("style")
  const room = searchParams.get("room")
  const search = searchParams.get("search")
  const sort = searchParams.get("sort") || "trending"
  const page = Number.parseInt(searchParams.get("page") || "1")
  const limit = Number.parseInt(searchParams.get("limit") || "12")

  // In production, this would query a real database
  // For now, return mock data with filtering applied

  const mockDesigns = [
    {
      id: 1,
      title: "Modern Minimalist Living Room",
      style: "Minimalist",
      room: "Living Room",
      likes: 234,
      bookmarks: 45,
      image: "/modern-minimalist-living-room.jpg",
      author: "Sarah Chen",
      tags: ["neutral", "clean", "spacious"],
      createdAt: "2024-01-15T10:00:00Z",
    },
    // Add more mock designs...
  ]

  let filteredDesigns = mockDesigns

  // Apply filters
  if (style && style !== "all") {
    filteredDesigns = filteredDesigns.filter((design) => design.style.toLowerCase() === style.toLowerCase())
  }

  if (room && room !== "all") {
    filteredDesigns = filteredDesigns.filter((design) => design.room.toLowerCase() === room.toLowerCase())
  }

  if (search) {
    filteredDesigns = filteredDesigns.filter(
      (design) =>
        design.title.toLowerCase().includes(search.toLowerCase()) ||
        design.tags.some((tag) => tag.toLowerCase().includes(search.toLowerCase())),
    )
  }

  // Apply sorting
  filteredDesigns.sort((a, b) => {
    switch (sort) {
      case "trending":
        return b.likes - a.likes
      case "recent":
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      case "bookmarked":
        return b.bookmarks - a.bookmarks
      default:
        return 0
    }
  })

  // Apply pagination
  const startIndex = (page - 1) * limit
  const paginatedDesigns = filteredDesigns.slice(startIndex, startIndex + limit)

  return NextResponse.json({
    designs: paginatedDesigns,
    total: filteredDesigns.length,
    page,
    limit,
    hasMore: startIndex + limit < filteredDesigns.length,
  })
}

export async function POST(request: Request) {
  const { action, designId } = await request.json()

  // In production, this would update the database
  // For now, just return success

  console.log(`${action} action for design ${designId}`)

  return NextResponse.json({
    success: true,
    message: `Design ${action}d successfully`,
  })
}
