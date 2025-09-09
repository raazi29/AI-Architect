import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const timeRange = searchParams.get("timeRange") || "30d"

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500))

    // Mock analytics data based on time range
    const baseData = {
      totalProjects: 24,
      totalViews: 12847,
      totalLikes: 1923,
      totalCollaborators: 156,
      monthlyGrowth: {
        projects: 12.5,
        views: 23.8,
        likes: 18.2,
        collaborators: 8.7,
      },
    }

    // Adjust data based on time range
    const multiplier = timeRange === "7d" ? 0.25 : timeRange === "90d" ? 3 : timeRange === "1y" ? 12 : 1

    const analyticsData = {
      ...baseData,
      totalProjects: Math.floor(baseData.totalProjects * multiplier),
      totalViews: Math.floor(baseData.totalViews * multiplier),
      totalLikes: Math.floor(baseData.totalLikes * multiplier),
      totalCollaborators: Math.floor(baseData.totalCollaborators * multiplier),
      timeRange,
      generatedAt: new Date().toISOString(),
    }

    return NextResponse.json(analyticsData)
  } catch (error) {
    console.error("Analytics API error:", error)
    return NextResponse.json({ error: "Failed to fetch analytics data" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { event, data } = await request.json()

    // Track analytics events
    console.log(`[Analytics] Event: ${event}`, data)

    // In production, this would save to analytics database
    return NextResponse.json({ success: true, tracked: event })
  } catch (error) {
    console.error("Analytics tracking error:", error)
    return NextResponse.json({ error: "Failed to track event" }, { status: 500 })
  }
}
