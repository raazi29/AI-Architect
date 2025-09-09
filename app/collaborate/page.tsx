"use client"

import { useState, useEffect } from "react"
import { Navigation } from "@/components/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Users,
  Plus,
  Search,
  MessageSquare,
  Share2,
  Heart,
  Eye,
  Clock,
  UserPlus,
  Settings,
  Bell,
  Filter,
  Download,
  MoreHorizontal,
  Hammer,
  Star,
  MapPin,
  Phone,
  Mail,
  CheckCircle,
  DollarSign,
  Calendar,
  Award,
  Briefcase,
} from "lucide-react"

interface Project {
  id: string
  title: string
  description: string
  thumbnail: string
  owner: User
  collaborators: User[]
  status: "active" | "completed" | "draft"
  lastActivity: Date
  comments: number
  likes: number
  views: number
  isPublic: boolean
}

interface User {
  id: string
  name: string
  avatar?: string
  role: "owner" | "editor" | "viewer"
  status: "online" | "offline" | "away"
}

interface Comment {
  id: string
  user: User
  content: string
  timestamp: Date
  replies?: Comment[]
}

interface Activity {
  id: string
  user: User
  action: string
  target: string
  timestamp: Date
  type: "comment" | "edit" | "share" | "like"
}

interface Contractor {
  id: string
  name: string
  avatar?: string
  specialty: string
  location: string
  rating: number
  reviewCount: number
  hourlyRate: number
  availability: "available" | "busy" | "booked"
  verified: boolean
  completedProjects: number
  description: string
  skills: string[]
  portfolio: string[]
  phone: string
  email: string
}

interface ProjectBid {
  id: string
  contractorId: string
  projectId: string
  amount: number
  timeline: string
  proposal: string
  status: "pending" | "accepted" | "rejected"
  submittedAt: Date
}

const mockProjects: Project[] = [
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
    lastActivity: new Date(Date.now() - 2 * 60 * 60 * 1000),
    comments: 12,
    likes: 24,
    views: 156,
    isPublic: true,
  },
  {
    id: "2",
    title: "Scandinavian Bedroom Project",
    description: "Team project for creating a cozy Scandinavian-style bedroom",
    thumbnail: "/scandinavian-bedroom-design.jpg",
    owner: { id: "4", name: "Alex Thompson", role: "owner", status: "offline" },
    collaborators: [
      { id: "1", name: "Sarah Chen", role: "editor", status: "online" },
      { id: "5", name: "Lisa Park", role: "editor", status: "online" },
    ],
    status: "active",
    lastActivity: new Date(Date.now() - 5 * 60 * 60 * 1000),
    comments: 8,
    likes: 18,
    views: 89,
    isPublic: false,
  },
  {
    id: "3",
    title: "Office Space Optimization",
    description: "Collaborative workspace design for a tech startup",
    thumbnail: "/modern-office-space.jpg",
    owner: { id: "6", name: "David Kim", role: "owner", status: "online" },
    collaborators: [
      { id: "2", name: "Mike Johnson", role: "editor", status: "online" },
      { id: "7", name: "Rachel Green", role: "viewer", status: "offline" },
    ],
    status: "completed",
    lastActivity: new Date(Date.now() - 24 * 60 * 60 * 1000),
    comments: 15,
    likes: 32,
    views: 203,
    isPublic: true,
  },
]

const mockContractors: Contractor[] = [
  {
    id: "c1",
    name: "John Martinez",
    avatar: "/contractor-1.jpg",
    specialty: "Interior Designer",
    location: "New York, NY",
    rating: 4.9,
    reviewCount: 127,
    hourlyRate: 85,
    availability: "available",
    verified: true,
    completedProjects: 89,
    description: "Specialized in modern and minimalist interior design with 8+ years of experience.",
    skills: ["Interior Design", "Space Planning", "Color Consultation", "3D Visualization"],
    portfolio: ["/portfolio-1.jpg", "/portfolio-2.jpg", "/portfolio-3.jpg"],
    phone: "+1 (555) 123-4567",
    email: "john.martinez@email.com",
  },
  {
    id: "c2",
    name: "Sarah Williams",
    avatar: "/contractor-2.jpg",
    specialty: "General Contractor",
    location: "Los Angeles, CA",
    rating: 4.8,
    reviewCount: 203,
    hourlyRate: 95,
    availability: "busy",
    verified: true,
    completedProjects: 156,
    description: "Full-service contractor specializing in residential renovations and remodeling.",
    skills: ["Construction", "Project Management", "Electrical", "Plumbing"],
    portfolio: ["/portfolio-4.jpg", "/portfolio-5.jpg"],
    phone: "+1 (555) 987-6543",
    email: "sarah.williams@email.com",
  },
  {
    id: "c3",
    name: "Michael Chen",
    avatar: "/contractor-3.jpg",
    specialty: "Architect",
    location: "Chicago, IL",
    rating: 4.7,
    reviewCount: 89,
    hourlyRate: 120,
    availability: "available",
    verified: true,
    completedProjects: 67,
    description: "Licensed architect with expertise in residential and commercial design.",
    skills: ["Architecture", "Structural Design", "Building Codes", "CAD Design"],
    portfolio: ["/portfolio-6.jpg", "/portfolio-7.jpg", "/portfolio-8.jpg"],
    phone: "+1 (555) 456-7890",
    email: "michael.chen@email.com",
  },
]

const mockBids: ProjectBid[] = [
  {
    id: "b1",
    contractorId: "c1",
    projectId: "1",
    amount: 3500,
    timeline: "2-3 weeks",
    proposal:
      "I can help transform your living room with a modern minimalist approach. My proposal includes space planning, furniture selection, and color coordination.",
    status: "pending",
    submittedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
  },
  {
    id: "b2",
    contractorId: "c2",
    projectId: "1",
    amount: 4200,
    timeline: "3-4 weeks",
    proposal:
      "Complete renovation service including construction work, electrical updates, and project management from start to finish.",
    status: "pending",
    submittedAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
  },
]

const mockActivities: Activity[] = [
  {
    id: "1",
    user: { id: "2", name: "Mike Johnson", role: "editor", status: "online" },
    action: "commented on",
    target: "Modern Living Room Redesign",
    timestamp: new Date(Date.now() - 30 * 60 * 1000),
    type: "comment",
  },
  {
    id: "2",
    user: { id: "1", name: "Sarah Chen", role: "owner", status: "online" },
    action: "updated the floor plan in",
    target: "Scandinavian Bedroom Project",
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    type: "edit",
  },
  {
    id: "3",
    user: { id: "5", name: "Lisa Park", role: "editor", status: "online" },
    action: "liked",
    target: "Office Space Optimization",
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
    type: "like",
  },
]

export default function Collaborate() {
  const [projects, setProjects] = useState<Project[]>(mockProjects)
  const [contractors, setContractors] = useState<Contractor[]>(mockContractors)
  const [bids, setBids] = useState<ProjectBid[]>(mockBids)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [selectedContractor, setSelectedContractor] = useState<Contractor | null>(null)
  const [activeTab, setActiveTab] = useState("projects")
  const [filterStatus, setFilterStatus] = useState("all")
  const [contractorFilter, setContractorFilter] = useState("all")
  const [showCreateProject, setShowCreateProject] = useState(false)
  const [showContractorDetails, setShowContractorDetails] = useState(false)
  const [newComment, setNewComment] = useState("")

  useEffect(() => {
    console.log("Collaborate page loaded successfully")
  }, [])

  const filteredProjects = projects.filter((project) => {
    const matchesSearch =
      project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = filterStatus === "all" || project.status === filterStatus
    return matchesSearch && matchesStatus
  })

  const filteredContractors = contractors.filter((contractor) => {
    const matchesSearch =
      contractor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contractor.specialty.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contractor.location.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFilter =
      contractorFilter === "all" ||
      (contractorFilter === "available" && contractor.availability === "available") ||
      (contractorFilter === "verified" && contractor.verified)
    return matchesSearch && matchesFilter
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500"
      case "completed":
        return "bg-blue-500"
      case "draft":
        return "bg-yellow-500"
      default:
        return "bg-gray-500"
    }
  }

  const getAvailabilityColor = (availability: string) => {
    switch (availability) {
      case "available":
        return "bg-green-500"
      case "busy":
        return "bg-yellow-500"
      case "booked":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  const getUserStatusColor = (status: string) => {
    switch (status) {
      case "online":
        return "bg-green-500"
      case "away":
        return "bg-yellow-500"
      case "offline":
        return "bg-gray-400"
      default:
        return "bg-gray-400"
    }
  }

  const formatTimeAgo = (date: Date) => {
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

    if (diffInHours < 1) return "Just now"
    if (diffInHours < 24) return `${diffInHours}h ago`
    return `${Math.floor(diffInHours / 24)}d ago`
  }

  const handleCreateProject = () => {
    const newProject: Project = {
      id: Date.now().toString(),
      title: "New Collaboration Project",
      description: "A new collaborative interior design project",
      thumbnail: "/modern-room-design.jpg",
      owner: { id: "current", name: "You", role: "owner", status: "online" },
      collaborators: [],
      status: "draft",
      lastActivity: new Date(),
      comments: 0,
      likes: 0,
      views: 0,
      isPublic: false,
    }

    setProjects([newProject, ...projects])
    setShowCreateProject(false)
  }

  const handleInviteCollaborator = (projectId: string) => {
    // In production, this would open an invite modal
    alert("Invite collaborator functionality would open here")
  }

  const handleHireContractor = (contractorId: string) => {
    alert(`Hire contractor functionality would open here for contractor ${contractorId}`)
  }

  const handleContactContractor = (contractor: Contractor) => {
    setSelectedContractor(contractor)
    setShowContractorDetails(true)
  }

  const handleAcceptBid = (bidId: string) => {
    setBids(bids.map((bid) => (bid.id === bidId ? { ...bid, status: "accepted" as const } : bid)))
  }

  const handleRejectBid = (bidId: string) => {
    setBids(bids.map((bid) => (bid.id === bidId ? { ...bid, status: "rejected" as const } : bid)))
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
                  <Users className="h-6 w-6 text-primary" />
                  <h1 className="text-3xl font-bold text-foreground">Social Collaboration</h1>
                </div>
                <p className="text-lg text-muted-foreground">
                  Share designs, collaborate with teams, hire contractors, and get feedback from the community.
                </p>
              </div>

              <div className="flex gap-2">
                <Button variant="outline">
                  <Bell className="h-4 w-4 mr-2" />
                  Notifications
                </Button>
                <Button onClick={() => setShowCreateProject(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Project
                </Button>
              </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full max-w-md grid-cols-3 md:grid-cols-5">
               <TabsTrigger value="projects">My Projects</TabsTrigger>
               <TabsTrigger value="shared">Shared with Me</TabsTrigger>
               <TabsTrigger value="contractors">Contractor Network</TabsTrigger>
               <TabsTrigger value="bids">Project Bids</TabsTrigger>
               <TabsTrigger value="activity">Activity</TabsTrigger>
             </TabsList>

              <div className="flex gap-4 items-center mt-6">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={activeTab === "contractors" ? "Search contractors..." : "Search projects..."}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {activeTab === "contractors" ? (
                  <Select value={contractorFilter} onValueChange={setContractorFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Contractors</SelectItem>
                      <SelectItem value="available">Available</SelectItem>
                      <SelectItem value="verified">Verified Only</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                    </SelectContent>
                  </Select>
                )}

                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  More Filters
                </Button>
              </div>

              <TabsContent value="projects" className="mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredProjects.map((project) => (
                    <Card key={project.id} className="group hover:shadow-lg transition-shadow cursor-pointer">
                      <div className="relative">
                        <img
                          src={project.thumbnail || "/placeholder.svg"}
                          alt={project.title}
                          className="w-full h-48 object-cover rounded-t-lg"
                        />
                        <div className="absolute top-3 right-3 flex gap-2">
                          <Badge variant="secondary" className={`${getStatusColor(project.status)} text-white`}>
                            {project.status}
                          </Badge>
                          {!project.isPublic && (
                            <Badge variant="outline" className="bg-white/90">
                              Private
                            </Badge>
                          )}
                        </div>
                      </div>

                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-lg line-clamp-1">{project.title}</CardTitle>
                            <CardDescription className="line-clamp-2 mt-1">{project.description}</CardDescription>
                          </div>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="flex items-center gap-2 mt-3">
                          <Avatar className="w-6 h-6">
                            <AvatarImage src={project.owner.avatar || "/placeholder.svg"} />
                            <AvatarFallback className="text-xs">{project.owner.name[0]}</AvatarFallback>
                          </Avatar>
                          <span className="text-sm text-muted-foreground">{project.owner.name}</span>
                          <div className="flex -space-x-2 ml-auto">
                            {project.collaborators.slice(0, 3).map((collaborator) => (
                              <Avatar key={collaborator.id} className="w-6 h-6 border-2 border-background">
                                <AvatarImage src={collaborator.avatar || "/placeholder.svg"} />
                                <AvatarFallback className="text-xs">{collaborator.name[0]}</AvatarFallback>
                              </Avatar>
                            ))}
                            {project.collaborators.length > 3 && (
                              <div className="w-6 h-6 rounded-full bg-muted border-2 border-background flex items-center justify-center">
                                <span className="text-xs text-muted-foreground">
                                  +{project.collaborators.length - 3}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardHeader>

                      <CardContent className="pt-0">
                        <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1">
                              <MessageSquare className="h-4 w-4" />
                              <span>{project.comments}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Heart className="h-4 w-4" />
                              <span>{project.likes}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Eye className="h-4 w-4" />
                              <span>{project.views}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            <span>{formatTimeAgo(project.lastActivity)}</span>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button size="sm" className="flex-1">
                            Open Project
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleInviteCollaborator(project.id)}>
                            <UserPlus className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline">
                            <Share2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {filteredProjects.length === 0 && (
                  <div className="text-center py-12">
                    <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No projects found</h3>
                    <p className="text-muted-foreground mb-4">
                      {searchQuery ? "Try adjusting your search terms" : "Create your first collaborative project"}
                    </p>
                    <Button onClick={() => setShowCreateProject(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Project
                    </Button>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="shared" className="mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {mockProjects
                    .filter((p) => p.owner.id !== "current")
                    .map((project) => (
                      <Card key={project.id} className="group hover:shadow-lg transition-shadow">
                        <div className="relative">
                          <img
                            src={project.thumbnail || "/placeholder.svg"}
                            alt={project.title}
                            className="w-full h-48 object-cover rounded-t-lg"
                          />
                          <div className="absolute top-3 left-3">
                            <Badge variant="secondary" className="bg-blue-500 text-white">
                              Shared
                            </Badge>
                          </div>
                        </div>

                        <CardHeader>
                          <CardTitle className="text-lg">{project.title}</CardTitle>
                          <CardDescription>{project.description}</CardDescription>
                          <div className="flex items-center gap-2 mt-2">
                            <Avatar className="w-6 h-6">
                              <AvatarFallback className="text-xs">{project.owner.name[0]}</AvatarFallback>
                            </Avatar>
                            <span className="text-sm text-muted-foreground">by {project.owner.name}</span>
                          </div>
                        </CardHeader>

                        <CardContent>
                          <Button size="sm" className="w-full">
                            View Project
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              </TabsContent>

              <TabsContent value="contractors" className="mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredContractors.map((contractor) => (
                    <Card key={contractor.id} className="group hover:shadow-lg transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-start gap-3">
                          <div className="relative">
                            <Avatar className="w-12 h-12">
                              <AvatarImage src={contractor.avatar || "/placeholder.svg"} />
                              <AvatarFallback>{contractor.name[0]}</AvatarFallback>
                            </Avatar>
                            <div
                              className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-background ${getAvailabilityColor(contractor.availability)}`}
                            />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <CardTitle className="text-lg">{contractor.name}</CardTitle>
                              {contractor.verified && <CheckCircle className="h-4 w-4 text-blue-500" />}
                            </div>
                            <p className="text-sm text-muted-foreground">{contractor.specialty}</p>
                            <div className="flex items-center gap-1 mt-1">
                              <MapPin className="h-3 w-3 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">{contractor.location}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 text-yellow-500 fill-current" />
                            <span className="text-sm font-medium">{contractor.rating}</span>
                            <span className="text-xs text-muted-foreground">({contractor.reviewCount})</span>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">${contractor.hourlyRate}/hr</p>
                            <p className="text-xs text-muted-foreground">{contractor.completedProjects} projects</p>
                          </div>
                        </div>
                      </CardHeader>

                      <CardContent className="pt-0">
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{contractor.description}</p>

                        <div className="flex flex-wrap gap-1 mb-4">
                          {contractor.skills.slice(0, 3).map((skill, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                          {contractor.skills.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{contractor.skills.length - 3}
                            </Badge>
                          )}
                        </div>

                        <div className="flex gap-2">
                          <Button size="sm" className="flex-1" onClick={() => handleContactContractor(contractor)}>
                            View Profile
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleHireContractor(contractor.id)}>
                            <Hammer className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {filteredContractors.length === 0 && (
                  <div className="text-center py-12">
                    <Hammer className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No contractors found</h3>
                    <p className="text-muted-foreground mb-4">Try adjusting your search terms or filters</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="bids" className="mt-6">
                <div className="space-y-6">
                  {bids.map((bid) => {
                    const contractor = contractors.find((c) => c.id === bid.contractorId)
                    const project = projects.find((p) => p.id === bid.projectId)

                    return (
                      <Card key={bid.id}>
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3">
                              <Avatar className="w-10 h-10">
                                <AvatarImage src={contractor?.avatar || "/placeholder.svg"} />
                                <AvatarFallback>{contractor?.name[0]}</AvatarFallback>
                              </Avatar>
                              <div>
                                <CardTitle className="text-lg">{contractor?.name}</CardTitle>
                                <p className="text-sm text-muted-foreground">{contractor?.specialty}</p>
                                <p className="text-xs text-muted-foreground mt-1">Bid for: {project?.title}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-2xl font-bold text-primary">${bid.amount.toLocaleString()}</p>
                              <p className="text-sm text-muted-foreground">{bid.timeline}</p>
                              <Badge
                                variant={
                                  bid.status === "pending"
                                    ? "outline"
                                    : bid.status === "accepted"
                                      ? "default"
                                      : "destructive"
                                }
                                className="mt-1"
                              >
                                {bid.status}
                              </Badge>
                            </div>
                          </div>
                        </CardHeader>

                        <CardContent>
                          <div className="space-y-4">
                            <div>
                              <h4 className="font-medium mb-2">Proposal</h4>
                              <p className="text-sm text-muted-foreground">{bid.proposal}</p>
                            </div>

                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <Star className="h-4 w-4 text-yellow-500 fill-current" />
                                  <span>{contractor?.rating}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Briefcase className="h-4 w-4" />
                                  <span>{contractor?.completedProjects} projects</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Clock className="h-4 w-4" />
                                  <span>{formatTimeAgo(bid.submittedAt)}</span>
                                </div>
                              </div>

                              {bid.status === "pending" && (
                                <div className="flex gap-2">
                                  <Button size="sm" variant="outline" onClick={() => handleRejectBid(bid.id)}>
                                    Decline
                                  </Button>
                                  <Button size="sm" onClick={() => handleAcceptBid(bid.id)}>
                                    Accept Bid
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>

                {bids.length === 0 && (
                  <div className="text-center py-12">
                    <DollarSign className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No bids yet</h3>
                    <p className="text-muted-foreground mb-4">Contractors will submit bids for your projects here</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="contractors" className="mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredContractors.map((contractor) => (
                    <Card key={contractor.id} className="group hover:shadow-lg transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-start gap-3">
                          <div className="relative">
                            <Avatar className="w-12 h-12">
                              <AvatarImage src={contractor.avatar || "/placeholder.svg"} />
                              <AvatarFallback>{contractor.name[0]}</AvatarFallback>
                            </Avatar>
                            <div
                              className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-background ${getAvailabilityColor(contractor.availability)}`}
                            />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <CardTitle className="text-lg">{contractor.name}</CardTitle>
                              {contractor.verified && <CheckCircle className="h-4 w-4 text-blue-500" />}
                            </div>
                            <p className="text-sm text-muted-foreground">{contractor.specialty}</p>
                            <div className="flex items-center gap-1 mt-1">
                              <MapPin className="h-3 w-3 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">{contractor.location}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 text-yellow-500 fill-current" />
                            <span className="text-sm font-medium">{contractor.rating}</span>
                            <span className="text-xs text-muted-foreground">({contractor.reviewCount})</span>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">${contractor.hourlyRate}/hr</p>
                            <p className="text-xs text-muted-foreground">{contractor.completedProjects} projects</p>
                          </div>
                        </div>
                      </CardHeader>

                      <CardContent className="pt-0">
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{contractor.description}</p>

                        <div className="flex flex-wrap gap-1 mb-4">
                          {contractor.skills.slice(0, 3).map((skill, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                          {contractor.skills.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{contractor.skills.length - 3}
                            </Badge>
                          )}
                        </div>

                        <div className="flex gap-2">
                          <Button size="sm" className="flex-1" onClick={() => handleContactContractor(contractor)}>
                            View Profile
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleHireContractor(contractor.id)}>
                            <Hammer className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {filteredContractors.length === 0 && (
                  <div className="text-center py-12">
                    <Hammer className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No contractors found</h3>
                    <p className="text-muted-foreground mb-4">Try adjusting your search terms or filters</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="activity" className="mt-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2">
                    <Card>
                      <CardHeader>
                        <CardTitle>Recent Activity</CardTitle>
                        <CardDescription>Stay updated with your team's latest actions</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ScrollArea className="h-96">
                          <div className="space-y-4">
                            {mockActivities.map((activity) => (
                              <div
                                key={activity.id}
                                className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50"
                              >
                                <Avatar className="w-8 h-8">
                                  <AvatarFallback className="text-xs">{activity.user.name[0]}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                  <p className="text-sm">
                                    <span className="font-medium">{activity.user.name}</span> {activity.action}{" "}
                                    <span className="font-medium">{activity.target}</span>
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {formatTimeAgo(activity.timestamp)}
                                  </p>
                                </div>
                                <Badge variant="outline" className="text-xs">
                                  {activity.type}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      </CardContent>
                    </Card>
                  </div>

                  <div>
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Team Members</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {[
                            { name: "Sarah Chen", role: "Design Lead", status: "online" },
                            { name: "Mike Johnson", role: "3D Specialist", status: "online" },
                            { name: "Emma Davis", role: "Color Expert", status: "away" },
                            { name: "Alex Thompson", role: "Space Planner", status: "offline" },
                          ].map((member, index) => (
                            <div key={index} className="flex items-center gap-3">
                              <div className="relative">
                                <Avatar className="w-8 h-8">
                                  <AvatarFallback className="text-xs">{member.name[0]}</AvatarFallback>
                                </Avatar>
                                <div
                                  className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-background ${getUserStatusColor(member.status)}`}
                                />
                              </div>
                              <div className="flex-1">
                                <p className="text-sm font-medium">{member.name}</p>
                                <p className="text-xs text-muted-foreground">{member.role}</p>
                              </div>
                            </div>
                          ))}
                        </div>

                        <Button variant="outline" size="sm" className="w-full mt-4 bg-transparent">
                          <UserPlus className="h-4 w-4 mr-2" />
                          Invite Member
                        </Button>
                      </CardContent>
                    </Card>

                    <Card className="mt-6">
                      <CardHeader>
                        <CardTitle className="text-lg">Quick Actions</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <Button variant="outline" size="sm" className="w-full justify-start bg-transparent">
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Start Discussion
                        </Button>
                        <Button variant="outline" size="sm" className="w-full justify-start bg-transparent">
                          <Share2 className="h-4 w-4 mr-2" />
                          Share Project
                        </Button>
                        <Button variant="outline" size="sm" className="w-full justify-start bg-transparent">
                          <Download className="h-4 w-4 mr-2" />
                          Export Project
                        </Button>
                        <Button variant="outline" size="sm" className="w-full justify-start bg-transparent">
                          <Settings className="h-4 w-4 mr-2" />
                          Project Settings
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>

      {showCreateProject && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>Create New Project</CardTitle>
              <CardDescription>Start a new collaborative interior design project</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Project Name</label>
                <Input placeholder="Enter project name..." className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <Textarea placeholder="Describe your project..." className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium">Privacy</label>
                <Select defaultValue="private">
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="private">Private - Only invited members</SelectItem>
                    <SelectItem value="public">Public - Anyone can view</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
            <div className="flex gap-2 p-6 pt-0">
              <Button variant="outline" onClick={() => setShowCreateProject(false)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleCreateProject} className="flex-1">
                Create Project
              </Button>
            </div>
          </Card>
        </div>
      )}

      {showContractorDetails && selectedContractor && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-start gap-4">
                <div className="relative">
                  <Avatar className="w-16 h-16">
                    <AvatarImage src={selectedContractor.avatar || "/placeholder.svg"} />
                    <AvatarFallback className="text-lg">{selectedContractor.name[0]}</AvatarFallback>
                  </Avatar>
                  <div
                    className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-background ${getAvailabilityColor(selectedContractor.availability)}`}
                  />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-xl">{selectedContractor.name}</CardTitle>
                    {selectedContractor.verified && <CheckCircle className="h-5 w-5 text-blue-500" />}
                  </div>
                  <p className="text-muted-foreground">{selectedContractor.specialty}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">{selectedContractor.location}</span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowContractorDetails(false)}
                  className="h-8 w-8 p-0"
                >
                  ×
                </Button>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 border rounded-lg">
                  <Star className="h-6 w-6 text-yellow-500 fill-current mx-auto mb-1" />
                  <p className="text-lg font-bold">{selectedContractor.rating}</p>
                  <p className="text-xs text-muted-foreground">{selectedContractor.reviewCount} reviews</p>
                </div>
                <div className="text-center p-3 border rounded-lg">
                  <DollarSign className="h-6 w-6 text-green-500 mx-auto mb-1" />
                  <p className="text-lg font-bold">${selectedContractor.hourlyRate}</p>
                  <p className="text-xs text-muted-foreground">per hour</p>
                </div>
                <div className="text-center p-3 border rounded-lg">
                  <Award className="h-6 w-6 text-blue-500 mx-auto mb-1" />
                  <p className="text-lg font-bold">{selectedContractor.completedProjects}</p>
                  <p className="text-xs text-muted-foreground">projects</p>
                </div>
                <div className="text-center p-3 border rounded-lg">
                  <Calendar className="h-6 w-6 text-purple-500 mx-auto mb-1" />
                  <p className="text-lg font-bold capitalize">{selectedContractor.availability}</p>
                  <p className="text-xs text-muted-foreground">status</p>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">About</h4>
                <p className="text-sm text-muted-foreground">{selectedContractor.description}</p>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Skills & Expertise</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedContractor.skills.map((skill, index) => (
                    <Badge key={index} variant="outline">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Contact Information</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{selectedContractor.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{selectedContractor.email}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button className="flex-1">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Send Message
                </Button>
                <Button variant="outline" className="flex-1 bg-transparent">
                  <Hammer className="h-4 w-4 mr-2" />
                  Hire for Project
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
