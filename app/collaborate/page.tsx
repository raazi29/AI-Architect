"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { Navigation } from "@/components/navigation";

interface Project {
  id: string;
  name: string;
  description: string;
  owner_id: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  status?: string;
  owner?: {
    id: string;
    username: string;
  };
  members?: {
    user_id: string;
    role: string;
    profiles?: {
      username: string;
    };
  }[];
}

interface Contractor {
  id: string;
  name: string;
 avatar_url?: string;
  specialty: string;
  location: string;
  rating: number;
  review_count: number;
  hourly_rate: number;
  availability: "available" | "busy" | "booked";
  verified: boolean;
  completed_projects: number;
  description: string;
  skills: string[];
  portfolio: string[];
  phone: string;
  email: string;
}

interface ProjectBid {
  id: string;
  contractor_id: string;
  project_id: string;
  amount: number;
  timeline: string;
  proposal: string;
  status: "pending" | "accepted" | "rejected";
  submitted_at: string;
  contractor?: Contractor;
  project?: {
    name: string;
  };
}

interface Activity {
  id: string;
  user_id: string;
  action: string;
  target: string;
 timestamp: string;
  type: "comment" | "edit" | "share" | "like";
  user?: {
    username: string;
  };
}

export default function Collaborate() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [contractors] = useState<Contractor[]>([]);
  const [bids, setBids] = useState<ProjectBid[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedContractor, setSelectedContractor] = useState<Contractor | null>(null);
  const [activeTab, setActiveTab] = useState("projects");
  const [filterStatus, setFilterStatus] = useState("all");
  const [contractorFilter, setContractorFilter] = useState("all");
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [showContractorDetails, setShowContractorDetails] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [activities, setActivities] = useState<Activity[]>([]);

 // Redirect to sign in if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/signin");
    }
  }, [user, loading, router]);

  // Fetch projects
  useEffect(() => {
    if (!user) return;
    
    const fetchProjects = async () => {
      // Fetch projects where user is owner
      const { data: ownedProjects, error: ownedError } = await supabase
        .from('projects')
        .select(`
          *,
          owner:profiles(username),
          members:project_members(user_id, role, profiles(username))
        `)
        .eq('owner_id', user.id);
      
      // Fetch projects where user is member
      const { data: memberProjects, error: memberError } = await supabase
        .from('projects')
        .select(`
          *,
          owner:profiles(username),
          members:project_members(user_id, role, profiles(username))
        `)
        .in('id',
          (await supabase
            .from('project_members')
            .select('project_id')
            .eq('user_id', user.id)
          ).data?.map((pm: any) => pm.project_id) || []
        );
      
      if (ownedError) console.error('Error fetching owned projects:', ownedError);
      if (memberError) console.error('Error fetching member projects:', memberError);
      
      // Combine and deduplicate projects
      const allProjects = [...(ownedProjects || []), ...(memberProjects || [])];
      const uniqueProjects = Array.from(
        new Map(allProjects.map(project => [project.id, project])).values()
      );
      
      setProjects(uniqueProjects);
    };
    
    fetchProjects();
    
    // Subscribe to project changes
    const projectChannel = supabase
      .channel('project-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'projects',
        },
        (payload: any) => {
          fetchProjects();
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(projectChannel);
    };
  }, [user]);

  // Fetch activities
  useEffect(() => {
    if (!user) return;
    
    const fetchActivities = async () => {
      const { data, error } = await supabase
        .from('chat_messages')
        .select(`
          *,
          user:profiles(username)
        `)
        .in('project_id',
          (await supabase
            .from('project_members')
            .select('project_id')
            .eq('user_id', user.id)
          ).data?.map((pm: any) => pm.project_id) || []
        )
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (error) {
        console.error('Error fetching activities:', error);
      } else {
        setActivities(data.map((msg: any) => ({
          id: msg.id,
          user_id: msg.user_id,
          action: 'commented on',
          target: 'a project',
          timestamp: msg.created_at,
          type: 'comment',
          user: msg.user
        })));
      }
    };
    
    fetchActivities();
  }, [user]);

  // Fetch bids
  useEffect(() => {
    if (!user) return;
    
    const fetchBids = async () => {
      const { data, error } = await supabase
        .from('projects')
        .select(`
          id,
          name,
          bids (
            *,
            contractor:profiles(username)
          )
        `)
        .eq('owner_id', user.id);
      
      if (error) {
        console.error('Error fetching bids:', error);
      } else {
        const allBids: ProjectBid[] = [];
        data.forEach((project: any) => {
          if (project.bids) {
            project.bids.forEach((bid: any) => {
              allBids.push({
                ...bid,
                project: {
                  name: project.name
                }
              });
            });
          }
        });
        setBids(allBids);
      }
    };
    
    fetchBids();
  }, [user]);

  const filteredProjects = projects.filter((project) => {
    const matchesSearch =
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === "all" || project.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const filteredContractors = contractors.filter((contractor) => {
    const matchesSearch =
      contractor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contractor.specialty.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contractor.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter =
      contractorFilter === "all" ||
      (contractorFilter === "available" && contractor.availability === "available") ||
      (contractorFilter === "verified" && contractor.verified);
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500";
      case "completed":
        return "bg-blue-500";
      case "draft":
        return "bg-yellow-500";
      default:
        return "bg-gray-500";
    }
  };

  const getAvailabilityColor = (availability: string) => {
    switch (availability) {
      case "available":
        return "bg-green-500";
      case "busy":
        return "bg-yellow-500";
      case "booked":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getUserStatusColor = (status: string) => {
    switch (status) {
      case "online":
        return "bg-green-500";
      case "away":
        return "bg-yellow-500";
      case "offline":
        return "bg-gray-400";
      default:
        return "bg-gray-400";
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return `${Math.floor(diffInHours / 24)}d ago`;
  };

  const handleCreateProject = async () => {
    if (!user) return;
    
    const projectName = (document.getElementById("project-name") as HTMLInputElement)?.value || "New Collaboration Project";
    const projectDescription = (document.getElementById("project-description") as HTMLTextAreaElement)?.value || "A new collaborative project";
    const projectPrivacy = (document.getElementById("project-privacy") as HTMLSelectElement)?.value || "private";
    
    const { data, error } = await supabase
      .from('projects')
      .insert([
        {
          name: projectName,
          description: projectDescription,
          owner_id: user.id,
          is_public: projectPrivacy === "public"
        }
      ])
      .select();
    
    if (error) {
      console.error('Error creating project:', error);
    } else if (data) {
      setProjects([data[0], ...projects]);
      setShowCreateProject(false);
    }
  };

  const handleInviteCollaborator = (projectId: string) => {
    // In production, this would open an invite modal
    alert("Invite collaborator functionality would open here");
  };

  const handleHireContractor = (contractorId: string) => {
    alert(`Hire contractor functionality would open here for contractor ${contractorId}`);
  };

  const handleContactContractor = (contractor: Contractor) => {
    setSelectedContractor(contractor);
    setShowContractorDetails(true);
  };

  const handleAcceptBid = async (bidId: string) => {
    const { error } = await supabase
      .from('bids')
      .update({ status: 'accepted' })
      .eq('id', bidId);
    
    if (error) {
      console.error('Error accepting bid:', error);
    } else {
      setBids(bids.map((bid) => (bid.id === bidId ? { ...bid, status: "accepted" } : bid)));
    }
  };

  const handleRejectBid = async (bidId: string) => {
    const { error } = await supabase
      .from('bids')
      .update({ status: 'rejected' })
      .eq('id', bidId);
    
    if (error) {
      console.error('Error rejecting bid:', error);
    } else {
      setBids(bids.map((bid) => (bid.id === bidId ? { ...bid, status: "rejected" } : bid)));
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="ml-64 p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <header className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Users className="h-6 w-6 text-primary" />
                  <h1 className="text-3xl font-bold text-foreground">Social Collaboration</h1>
                </div>
                <p className="text-lg text-muted-foreground max-w-2xl">
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
          </header>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-1">
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredProjects.map((project) => (
                    <Card key={project.id} className="group hover:shadow-lg transition-shadow cursor-pointer">
                      <div className="relative">
                        <div className="w-full h-48 bg-muted rounded-t-lg flex items-center justify-center">
                          <span className="text-muted-foreground">Project Thumbnail</span>
                        </div>
                        <div className="absolute top-3 right-3 flex gap-2">
                          <Badge variant="secondary" className={`${getStatusColor("active")} text-white`}>
                            active
                          </Badge>
                          {!project.is_public && (
                            <Badge variant="outline" className="bg-white/90">
                              Private
                            </Badge>
                          )}
                        </div>
                      </div>

                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-lg line-clamp-1">{project.name}</CardTitle>
                            <CardDescription className="line-clamp-2 mt-1">{project.description}</CardDescription>
                          </div>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="flex items-center gap-2 mt-3">
                          <Avatar className="w-6 h-6">
                            <AvatarFallback className="text-xs">
                              {project.owner?.username?.[0] || "U"}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm text-muted-foreground">
                            {project.owner?.username || "Unknown"}
                          </span>
                          <div className="flex -space-x-2 ml-auto">
                            {project.members?.slice(0, 3).map((member) => (
                              <Avatar key={member.user_id} className="w-6 h-6 border-2 border-background">
                                <AvatarFallback className="text-xs">
                                  {member.profiles?.username?.[0] || "U"}
                                </AvatarFallback>
                              </Avatar>
                            ))}
                            {project.members && project.members.length > 3 && (
                              <div className="w-6 h-6 rounded-full bg-muted border-2 border-background flex items-center justify-center">
                                <span className="text-xs text-muted-foreground">
                                  +{project.members.length - 3}
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
                              <span>0</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Heart className="h-4 w-4" />
                              <span>0</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Eye className="h-4 w-4" />
                              <span>0</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            <span>{formatTimeAgo(project.updated_at)}</span>
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredProjects
                    .filter((p) => p.owner_id !== user.id)
                    .map((project) => (
                      <Card key={project.id} className="group hover:shadow-lg transition-shadow">
                        <div className="relative">
                          <div className="w-full h-48 bg-muted rounded-t-lg flex items-center justify-center">
                            <span className="text-muted-foreground">Project Thumbnail</span>
                          </div>
                          <div className="absolute top-3 left-3">
                            <Badge variant="secondary" className="bg-blue-500 text-white">
                              Shared
                            </Badge>
                          </div>
                        </div>

                        <CardHeader>
                          <CardTitle className="text-lg">{project.name}</CardTitle>
                          <CardDescription>{project.description}</CardDescription>
                          <div className="flex items-center gap-2 mt-2">
                            <Avatar className="w-6 h-6">
                              <AvatarFallback className="text-xs">
                                {project.owner?.username?.[0] || "U"}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm text-muted-foreground">
                              by {project.owner?.username || "Unknown"}
                            </span>
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
                <div className="text-center py-12">
                  <Hammer className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Contractor Network</h3>
                  <p className="text-muted-foreground mb-4">
                    Connect with professionals for your projects
                  </p>
                  <Button disabled>
                    Browse Contractors
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="bids" className="mt-6">
                <div className="space-y-6">
                  {bids.map((bid) => (
                    <Card key={bid.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <Avatar className="w-10 h-10">
                              <AvatarFallback>
                                {bid.contractor?.name?.[0] || "C"}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <CardTitle className="text-lg">
                                {bid.contractor?.name || "Contractor"}
                              </CardTitle>
                              <p className="text-sm text-muted-foreground">Interior Designer</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                Bid for: {bid.project?.name || "Project"}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-primary">
                              ${bid.amount.toLocaleString()}
                            </p>
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
                                <span>4.8</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Briefcase className="h-4 w-4" />
                                <span>42 projects</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                <span>{formatTimeAgo(bid.submitted_at)}</span>
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
                  ))}
                </div>

                {bids.length === 0 && (
                  <div className="text-center py-12">
                    <DollarSign className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No bids yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Contractors will submit bids for your projects here
                    </p>
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
                            {activities.map((activity) => (
                              <div
                                key={activity.id}
                                className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50"
                              >
                                <Avatar className="w-8 h-8">
                                  <AvatarFallback className="text-xs">
                                    {activity.user?.username?.[0] || "U"}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                  <p className="text-sm">
                                    <span className="font-medium">
                                      {activity.user?.username || "User"}
                                    </span>{" "}
                                    {activity.action} <span className="font-medium">{activity.target}</span>
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
                          {projects.flatMap(project => 
                            project.members?.map(member => ({
                              name: member.profiles?.username || "User",
                              role: member.role,
                              status: "online"
                            })) || []
                          ).slice(0, 4).map((member, index) => (
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
      </main>

      {showCreateProject && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 ml-64">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>Create New Project</CardTitle>
              <CardDescription>Start a new collaborative interior design project</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Project Name</label>
                <Input id="project-name" placeholder="Enter project name..." className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <Textarea id="project-description" placeholder="Describe your project..." className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium">Privacy</label>
                <Select defaultValue="private">
                  <SelectTrigger id="project-privacy" className="mt-1">
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 ml-64 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-start gap-4">
                <div className="relative">
                  <Avatar className="w-16 h-16">
                    <AvatarImage src={selectedContractor.avatar_url || "/placeholder.svg"} />
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
                  <p className="text-xs text-muted-foreground">{selectedContractor.review_count} reviews</p>
                </div>
                <div className="text-center p-3 border rounded-lg">
                  <DollarSign className="h-6 w-6 text-green-500 mx-auto mb-1" />
                  <p className="text-lg font-bold">${selectedContractor.hourly_rate}</p>
                  <p className="text-xs text-muted-foreground">per hour</p>
                </div>
                <div className="text-center p-3 border rounded-lg">
                  <Award className="h-6 w-6 text-blue-500 mx-auto mb-1" />
                  <p className="text-lg font-bold">{selectedContractor.completed_projects}</p>
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
                  {selectedContractor.skills.slice(0, 3).map((skill: string, index: number) => (
                    <Badge key={index} variant="outline">
                      {skill}
                    </Badge>
                  ))}
                  {selectedContractor.skills.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{selectedContractor.skills.length - 3}
                    </Badge>
                  )}
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
  );
}
