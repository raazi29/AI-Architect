"use client"

import { useState, useEffect } from "react"
import dynamic from "next/dynamic"
import { Navigation } from "@/components/navigation"
import { AnalyticsProvider, useAnalytics } from "@/contexts/AnalyticsContext"

// Lazy load heavy chart components
const Recharts = dynamic(() => import("recharts"), {
  loading: () => (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  ),
  ssr: false
})
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BarChart3, TrendingUp, Users, Eye, Heart, Download, RefreshCw, ArrowUp, ArrowDown, Minus, Wifi, WifiOff, AlertCircle } from "lucide-react"

interface AnalyticsData {
  totalProjects: number
  totalViews: number
  totalLikes: number
  totalCollaborators: number
  monthlyGrowth: {
    projects: number
    views: number
    likes: number
    collaborators: number
  }
  projectsByCategory: { name: string; value: number; color: string }[]
  activityData: { date: string; projects: number; views: number; likes: number }[]
  topDesigns: { id: string; title: string; views: number; likes: number; thumbnail: string }[]
  userEngagement: { metric: string; current: number; previous: number; change: number }[]
}

const mockAnalyticsData: AnalyticsData = {
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
  projectsByCategory: [
    { name: "Living Room", value: 35, color: "#3b82f6" },
    { name: "Bedroom", value: 28, color: "#10b981" },
    { name: "Kitchen", value: 20, color: "#f59e0b" },
    { name: "Bathroom", value: 12, color: "#ef4444" },
    { name: "Office", value: 5, color: "#8b5cf6" },
  ],
  activityData: [
    { date: "Jan", projects: 4, views: 1200, likes: 180 },
    { date: "Feb", projects: 6, views: 1800, likes: 250 },
    { date: "Mar", projects: 8, views: 2400, likes: 320 },
    { date: "Apr", projects: 5, views: 1600, likes: 210 },
    { date: "May", projects: 9, views: 2800, likes: 380 },
    { date: "Jun", projects: 12, views: 3200, likes: 450 },
  ],
  topDesigns: [
    {
      id: "1",
      title: "Modern Minimalist Living Room",
      views: 2847,
      likes: 342,
      thumbnail: "/modern-minimalist-living-room.jpg",
    },
    {
      id: "2",
      title: "Scandinavian Bedroom Design",
      views: 2156,
      likes: 298,
      thumbnail: "/scandinavian-bedroom-design.jpg",
    },
    {
      id: "3",
      title: "Industrial Kitchen Concept",
      views: 1923,
      likes: 267,
      thumbnail: "/industrial-kitchen-design.jpg",
    },
  ],
  userEngagement: [
    { metric: "Avg. Session Duration", current: 8.5, previous: 7.2, change: 18.1 },
    { metric: "Pages per Session", current: 4.2, previous: 3.8, change: 10.5 },
    { metric: "Bounce Rate", current: 32.1, previous: 38.7, change: -17.1 },
    { metric: "Return Visitors", current: 68.3, previous: 61.2, change: 11.6 },
  ],
}

function Analytics() {
  const { analyticsData, isLoading, error, connectionStatus, refreshData } = useAnalytics()
  const [timeRange, setTimeRange] = useState("30d")
  const [selectedMetric, setSelectedMetric] = useState("all")

  useEffect(() => {
    console.log("Analytics page loaded successfully")
  }, [])

  const exportReport = () => {
    const reportData = {
      generatedAt: new Date().toISOString(),
      timeRange,
      data: analyticsData,
    }

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `analytics-report-${timeRange}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const getChangeIcon = (change: number) => {
    if (change > 0) return <ArrowUp className="h-4 w-4 text-green-500" />
    if (change < 0) return <ArrowDown className="h-4 w-4 text-red-500" />
    return <Minus className="h-4 w-4 text-gray-500" />
  }

  const getChangeColor = (change: number) => {
    if (change > 0) return "text-green-500"
    if (change < 0) return "text-red-500"
    return "text-gray-500"
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="ml-64 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <BarChart3 className="h-6 w-6 text-primary" />
                  <h1 className="text-3xl font-bold text-foreground">Analytics Dashboard</h1>
                </div>
                <p className="text-lg text-muted-foreground">
                  Track your design projects, user engagement, and platform performance.
                </p>
              </div>

              <div className="flex gap-2">
                <Select value={timeRange} onValueChange={setTimeRange}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7d">Last 7 days</SelectItem>
                    <SelectItem value="30d">Last 30 days</SelectItem>
                    <SelectItem value="90d">Last 90 days</SelectItem>
                    <SelectItem value="1y">Last year</SelectItem>
                  </SelectContent>
                </Select>

                <Button variant="outline" onClick={refreshData} disabled={isLoading}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
                  Refresh
                </Button>

                <Button variant="outline" onClick={exportReport}>
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>

            {/* Key Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analyticsData.totalProjects}</div>
                  <div className="flex items-center text-xs text-muted-foreground">
                    {getChangeIcon(analyticsData.monthlyGrowth.projects)}
                    <span className={`ml-1 ${getChangeColor(analyticsData.monthlyGrowth.projects)}`}>
                      {analyticsData.monthlyGrowth.projects > 0 ? "+" : ""}
                      {analyticsData.monthlyGrowth.projects}%
                    </span>
                    <span className="ml-1">from last month</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Views</CardTitle>
                  <Eye className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analyticsData.totalViews.toLocaleString()}</div>
                  <div className="flex items-center text-xs text-muted-foreground">
                    {getChangeIcon(analyticsData.monthlyGrowth.views)}
                    <span className={`ml-1 ${getChangeColor(analyticsData.monthlyGrowth.views)}`}>
                      {analyticsData.monthlyGrowth.views > 0 ? "+" : ""}
                      {analyticsData.monthlyGrowth.views}%
                    </span>
                    <span className="ml-1">from last month</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Likes</CardTitle>
                  <Heart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analyticsData.totalLikes.toLocaleString()}</div>
                  <div className="flex items-center text-xs text-muted-foreground">
                    {getChangeIcon(analyticsData.monthlyGrowth.likes)}
                    <span className={`ml-1 ${getChangeColor(analyticsData.monthlyGrowth.likes)}`}>
                      {analyticsData.monthlyGrowth.likes > 0 ? "+" : ""}
                      {analyticsData.monthlyGrowth.likes}%
                    </span>
                    <span className="ml-1">from last month</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Collaborators</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analyticsData.totalCollaborators}</div>
                  <div className="flex items-center text-xs text-muted-foreground">
                    {getChangeIcon(analyticsData.monthlyGrowth.collaborators)}
                    <span className={`ml-1 ${getChangeColor(analyticsData.monthlyGrowth.collaborators)}`}>
                      {analyticsData.monthlyGrowth.collaborators > 0 ? "+" : ""}
                      {analyticsData.monthlyGrowth.collaborators}%
                    </span>
                    <span className="ml-1">from last month</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList className="grid w-full max-w-md grid-cols-3">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="projects">Projects</TabsTrigger>
                <TabsTrigger value="engagement">Engagement</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Activity Chart */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        Activity Trends
                      </CardTitle>
                      <CardDescription>Monthly activity across all metrics</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-64 flex items-end justify-between gap-2 px-4">
                        {analyticsData.activityData.map((data, index) => (
                          <div key={index} className="flex flex-col items-center gap-2 flex-1">
                            <div className="flex flex-col items-center gap-1 w-full">
                              <div
                                className="w-full bg-primary rounded-t-sm"
                                style={{
                                  height: `${(data.projects / Math.max(...analyticsData.activityData.map((d) => d.projects))) * 100}px`,
                                }}
                              />
                              <div
                                className="w-full bg-accent rounded-t-sm"
                                style={{
                                  height: `${(data.views / Math.max(...analyticsData.activityData.map((d) => d.views))) * 50}px`,
                                }}
                              />
                              <div
                                className="w-full bg-muted rounded-t-sm"
                                style={{
                                  height: `${(data.likes / Math.max(...analyticsData.activityData.map((d) => d.likes))) * 30}px`,
                                }}
                              />
                            </div>
                            <span className="text-xs text-muted-foreground">{data.date}</span>
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-center gap-6 mt-4">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-primary rounded" />
                          <span className="text-xs">Projects</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-accent rounded" />
                          <span className="text-xs">Views</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-muted rounded" />
                          <span className="text-xs">Likes</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Project Categories */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Projects by Category</CardTitle>
                      <CardDescription>Distribution of your design projects</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {analyticsData.projectsByCategory.map((category, index) => (
                          <div key={index} className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: category.color }} />
                              <span className="text-sm font-medium">{category.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full"
                                  style={{
                                    backgroundColor: category.color,
                                    width: `${category.value}%`,
                                  }}
                                />
                              </div>
                              <span className="text-sm text-muted-foreground w-8">{category.value}%</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* User Engagement Metrics */}
                <Card>
                  <CardHeader>
                    <CardTitle>User Engagement</CardTitle>
                    <CardDescription>Key metrics showing how users interact with your content</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      {analyticsData.userEngagement.map((metric, index) => (
                        <div key={index} className="text-center">
                          <div className="text-2xl font-bold">{metric.current}%</div>
                          <div className="text-sm text-muted-foreground mb-2">{metric.metric}</div>
                          <div className="flex items-center justify-center gap-1">
                            {getChangeIcon(metric.change)}
                            <span className={`text-xs ${getChangeColor(metric.change)}`}>
                              {metric.change > 0 ? "+" : ""}
                              {metric.change}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="projects" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Top Performing Designs</CardTitle>
                    <CardDescription>Your most viewed and liked design projects</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {analyticsData.topDesigns.map((design, index) => (
                        <div key={design.id} className="flex items-center gap-4 p-4 border rounded-lg">
                          <div className="text-lg font-bold text-muted-foreground w-8">#{index + 1}</div>
                          <img
                            src={design.thumbnail || "/placeholder.svg"}
                            alt={design.title}
                            className="w-16 h-16 object-cover rounded-lg"
                          />
                          <div className="flex-1">
                            <h4 className="font-medium">{design.title}</h4>
                            <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Eye className="h-4 w-4" />
                                <span>{design.views.toLocaleString()} views</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Heart className="h-4 w-4" />
                                <span>{design.likes} likes</span>
                              </div>
                            </div>
                          </div>
                          <Button variant="outline" size="sm">
                            View Details
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="engagement" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Engagement Rate</CardTitle>
                      <CardDescription>How users interact with your designs</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Likes per View</span>
                          <span className="text-sm font-medium">15.2%</span>
                        </div>
                        <div className="w-full h-2 bg-muted rounded-full">
                          <div className="w-[15.2%] h-full bg-primary rounded-full" />
                        </div>

                        <div className="flex justify-between items-center">
                          <span className="text-sm">Comments per View</span>
                          <span className="text-sm font-medium">8.7%</span>
                        </div>
                        <div className="w-full h-2 bg-muted rounded-full">
                          <div className="w-[8.7%] h-full bg-primary rounded-full" />
                        </div>

                        <div className="flex justify-between items-center">
                          <span className="text-sm">Shares per View</span>
                          <span className="text-sm font-medium">3.1%</span>
                        </div>
                        <div className="w-full h-2 bg-muted rounded-full">
                          <div className="w-[3.1%] h-full bg-primary rounded-full" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>User Demographics</CardTitle>
                      <CardDescription>Age and location breakdown of your audience</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-sm">18-24</span>
                          <span className="text-sm font-medium">30%</span>
                        </div>
                        <div className="w-full h-2 bg-muted rounded-full">
                          <div className="w-[30%] h-full bg-primary rounded-full" />
                        </div>

                        <div className="flex justify-between items-center">
                          <span className="text-sm">25-34</span>
                          <span className="text-sm font-medium">45%</span>
                        </div>
                        <div className="w-full h-2 bg-muted rounded-full">
                          <div className="w-[45%] h-full bg-primary rounded-full" />
                        </div>

                        <div className="flex justify-between items-center">
                          <span className="text-sm">35-44</span>
                          <span className="text-sm font-medium">15%</span>
                        </div>
                        <div className="w-full h-2 bg-muted rounded-full">
                          <div className="w-[15%] h-full bg-primary rounded-full" />
                        </div>

                        <div className="flex justify-between items-center">
                          <span className="text-sm">45+</span>
                          <span className="text-sm font-medium">10%</span>
                        </div>
                        <div className="w-full h-2 bg-muted rounded-full">
                          <div className="w-[10%] h-full bg-primary rounded-full" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
    </div>
  )
}

export default function AnalyticsPage() {
  return (
    <AnalyticsProvider>
      <Analytics />
    </AnalyticsProvider>
  )
}
