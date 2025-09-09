import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const floorPlanData = await request.json()

  // In production, this would save to a database
  console.log("Saving floor plan:", floorPlanData)

  const savedPlan = {
    id: `plan-${Date.now()}`,
    ...floorPlanData,
    createdAt: new Date().toISOString(),
  }

  return NextResponse.json({
    success: true,
    plan: savedPlan,
    message: "Floor plan saved successfully",
  })
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get("userId")

  // In production, this would fetch from a database
  const mockPlans = [
    {
      id: "plan-1",
      name: "My Studio Apartment",
      rooms: [],
      walls: [],
      dimensions: { width: 400, height: 400 },
      createdAt: "2024-01-15T10:00:00Z",
    },
  ]

  return NextResponse.json({
    plans: mockPlans,
    total: mockPlans.length,
  })
}
