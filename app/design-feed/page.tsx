"use client"

import { useState, useEffect } from "react"
import { Navigation } from "@/components/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ImageIcon, Search, Heart, Bookmark, Share, Filter, Grid3X3, List, Plus, TrendingUp } from "lucide-react"

interface DesignPost {
  id: number
  title: string
  style: string
  room: string
  likes: number
  bookmarks: number
  image: string
  author: string
  isLiked: boolean
  isBookmarked: boolean
  tags: string[]
  createdAt: string
}

const initialDesignPosts: DesignPost[] = [
  {
    id: 1,
    title: "Modern Minimalist Living Room",
    style: "Minimalist",
    room: "Living Room",
    likes: 234,
    bookmarks: 45,
    image: "/modern-minimalist-living-room.jpg",
    author: "Sarah Chen",
    isLiked: false,
    isBookmarked: false,
    tags: ["neutral", "clean", "spacious"],
    createdAt: "2024-01-15",
  },
  {
    id: 2,
    title: "Scandinavian Bedroom Design",
    style: "Scandinavian",
    room: "Bedroom",
    likes: 189,
    bookmarks: 32,
    image: "/scandinavian-bedroom-design.jpg",
    author: "Erik Larsson",
    isLiked: false,
    isBookmarked: false,
    tags: ["cozy", "wood", "hygge"],
    createdAt: "2024-01-14",
  },
  {
    id: 3,
    title: "Industrial Kitchen Concept",
    style: "Industrial",
    room: "Kitchen",
    likes: 156,
    bookmarks: 28,
    image: "/industrial-kitchen-design.jpg",
    author: "Marcus Steel",
    isLiked: false,
    isBookmarked: false,
    tags: ["metal", "exposed", "urban"],
    createdAt: "2024-01-13",
  },
  {
    id: 4,
    title: "Bohemian Home Office",
    style: "Bohemian",
    room: "Office",
    likes: 203,
    bookmarks: 41,
    image: "/bohemian-home-office.jpg",
    author: "Luna Martinez",
    isLiked: false,
    isBookmarked: false,
    tags: ["colorful", "plants", "eclectic"],
    createdAt: "2024-01-12",
  },
  {
    id: 5,
    title: "Contemporary Dining Room",
    style: "Modern",
    room: "Dining Room",
    likes: 178,
    bookmarks: 35,
    image: "/contemporary-dining-room.jpg",
    author: "David Kim",
    isLiked: false,
    isBookmarked: false,
    tags: ["elegant", "lighting", "entertaining"],
    createdAt: "2024-01-11",
  },
  {
    id: 6,
    title: "Luxury Master Bathroom",
    style: "Traditional",
    room: "Bathroom",
    likes: 267,
    bookmarks: 52,
    image: "/luxury-master-bathroom.jpg",
    author: "Isabella Rose",
    isLiked: false,
    isBookmarked: false,
    tags: ["marble", "spa", "luxury"],
    createdAt: "2024-01-10",
  },
]

export default function DesignFeed() {
  const [designPosts, setDesignPosts] = useState<DesignPost[]>(initialDesignPosts)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedStyle, setSelectedStyle] = useState("all")
  const [selectedRoom, setSelectedRoom] = useState("all")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [activeTab, setActiveTab] = useState("trending")
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    console.log("Design Feed page loaded successfully")
  }, [])

  const filteredPosts = designPosts.filter((post) => {
    const matchesSearch =
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesStyle = selectedStyle === "all" || post.style.toLowerCase() === selectedStyle.toLowerCase()
    const matchesRoom = selectedRoom === "all" || post.room.toLowerCase() === selectedRoom.toLowerCase()

    return matchesSearch && matchesStyle && matchesRoom
  })

  const sortedPosts = [...filteredPosts].sort((a, b) => {
    switch (activeTab) {
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

  const handleLike = (postId: number) => {
    setDesignPosts((posts) =>
      posts.map((post) =>
        post.id === postId
          ? { ...post, isLiked: !post.isLiked, likes: post.isLiked ? post.likes - 1 : post.likes + 1 }
          : post,
      ),
    )
  }

  const handleBookmark = (postId: number) => {
    setDesignPosts((posts) =>
      posts.map((post) =>
        post.id === postId
          ? {
              ...post,
              isBookmarked: !post.isBookmarked,
              bookmarks: post.isBookmarked ? post.bookmarks - 1 : post.bookmarks + 1,
            }
          : post,
      ),
    )
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
                  <ImageIcon className="h-6 w-6 text-primary" />
                  <h1 className="text-3xl font-bold text-foreground">Design Feed</h1>
                </div>
                <p className="text-lg text-muted-foreground">
                  Discover inspiring interior designs from our curated collection and community.
                </p>
              </div>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Upload Design
              </Button>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center mb-6">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search designs, styles, rooms..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowFilters(!showFilters)} className="gap-2">
                  <Filter className="h-4 w-4" />
                  Filters
                </Button>

                <div className="flex border border-border rounded-lg">
                  <Button
                    variant={viewMode === "grid" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("grid")}
                    className="rounded-r-none"
                  >
                    <Grid3X3 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === "list" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("list")}
                    className="rounded-l-none"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {showFilters && (
              <div className="bg-card border border-border rounded-lg p-4 mb-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">Style</label>
                    <Select value={selectedStyle} onValueChange={setSelectedStyle}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Styles</SelectItem>
                        <SelectItem value="modern">Modern</SelectItem>
                        <SelectItem value="minimalist">Minimalist</SelectItem>
                        <SelectItem value="scandinavian">Scandinavian</SelectItem>
                        <SelectItem value="industrial">Industrial</SelectItem>
                        <SelectItem value="bohemian">Bohemian</SelectItem>
                        <SelectItem value="traditional">Traditional</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">Room Type</label>
                    <Select value={selectedRoom} onValueChange={setSelectedRoom}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Rooms</SelectItem>
                        <SelectItem value="living room">Living Room</SelectItem>
                        <SelectItem value="bedroom">Bedroom</SelectItem>
                        <SelectItem value="kitchen">Kitchen</SelectItem>
                        <SelectItem value="bathroom">Bathroom</SelectItem>
                        <SelectItem value="dining room">Dining Room</SelectItem>
                        <SelectItem value="office">Office</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="sm:col-span-2 flex items-end">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSelectedStyle("all")
                        setSelectedRoom("all")
                        setSearchQuery("")
                      }}
                      className="w-full"
                    >
                      Clear Filters
                    </Button>
                  </div>
                </div>
              </div>
            )}

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full max-w-md grid-cols-3">
                <TabsTrigger value="trending" className="gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Trending
                </TabsTrigger>
                <TabsTrigger value="recent">Recent</TabsTrigger>
                <TabsTrigger value="bookmarked">Most Saved</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div
            className={
              viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" : "space-y-4"
            }
          >
            {sortedPosts.map((post) => (
              <Card
                key={post.id}
                className={`group overflow-hidden hover:shadow-lg transition-all duration-300 ${
                  viewMode === "list" ? "flex flex-row" : ""
                }`}
              >
                <div className={`relative ${viewMode === "list" ? "w-48 flex-shrink-0" : ""}`}>
                  <img
                    src={post.image || "/placeholder.svg"}
                    alt={post.title}
                    className={`object-cover group-hover:scale-105 transition-transform duration-300 ${
                      viewMode === "list" ? "w-full h-32" : "w-full h-64"
                    }`}
                  />
                  <div className="absolute top-3 right-3 flex gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      className={`h-8 w-8 p-0 bg-white/90 hover:bg-white transition-colors ${
                        post.isLiked ? "text-red-500" : ""
                      }`}
                      onClick={() => handleLike(post.id)}
                    >
                      <Heart className={`h-4 w-4 ${post.isLiked ? "fill-current" : ""}`} />
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      className={`h-8 w-8 p-0 bg-white/90 hover:bg-white transition-colors ${
                        post.isBookmarked ? "text-primary" : ""
                      }`}
                      onClick={() => handleBookmark(post.id)}
                    >
                      <Bookmark className={`h-4 w-4 ${post.isBookmarked ? "fill-current" : ""}`} />
                    </Button>
                  </div>
                </div>

                <CardContent className={`${viewMode === "list" ? "flex-1 p-4" : "p-4"}`}>
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-foreground line-clamp-2">{post.title}</h3>
                  </div>

                  <p className="text-sm text-muted-foreground mb-3">by {post.author}</p>

                  <div className="flex flex-wrap gap-2 mb-3">
                    <Badge variant="secondary">{post.style}</Badge>
                    <Badge variant="outline">{post.room}</Badge>
                    {post.tags.slice(0, 2).map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Heart className="h-4 w-4" />
                        <span>{post.likes}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Bookmark className="h-4 w-4" />
                        <span>{post.bookmarks}</span>
                      </div>
                    </div>
                    <Button size="sm" variant="ghost" className="gap-1">
                      <Share className="h-4 w-4" />
                      Share
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-12">
            <p className="text-sm text-muted-foreground mb-4">
              Showing {sortedPosts.length} of {designPosts.length} designs
            </p>
            <Button variant="outline" size="lg">
              Load More Designs
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}
