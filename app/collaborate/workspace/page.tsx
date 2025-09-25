"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  File,
  Image,
  Video,
  Music,
  Archive,
  Code,
  FileText,
  Presentation,
  Database,
  Globe,
  Edit,
  Trash2,
  User,
  FolderOpen,
  CheckSquare,
  MessageCircle,
  FileTextIcon,
  UsersIcon,
  Cog,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import ChatComponent from "@/components/chat/ChatComponent";
import TaskManagement from "@/components/tasks/TaskManagement";
import FileSharing from "@/components/files/FileSharing";
import UserPresenceTracker from "@/components/presence/UserPresenceTracker";

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
    username: string;
    avatar_url: string;
  };
  members?: {
    user_id: string;
    role: string;
    profiles?: {
      username: string;
      avatar_url: string;
    };
  }[];
}

interface WorkspaceProps {
  params: {
    projectId: string;
  };
}

export default function CollaborativeWorkspace({ params }: WorkspaceProps) {
  const { user, profile } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("documents");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [documentContent, setDocumentContent] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [connected, setConnected] = useState(false);
  const [latency, setLatency] = useState<number | null>(null);

  // Fetch project details
  useEffect(() => {
    if (!params.projectId || !user) return;

    const fetchProject = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("projects")
        .select(`
          *,
          owner:profiles(username, avatar_url),
          members:project_members(user_id, role, profiles(username, avatar_url))
        `)
        .eq("id", params.projectId)
        .single();

      if (error) {
        console.error("Error fetching project:", error);
      } else {
        setProject(data);
      }
      setLoading(false);
    };

    fetchProject();

    // Subscribe to project changes
    const channel = supabase
      .channel("project-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "projects",
          filter: `id=eq.${params.projectId}`,
        },
        (payload: any) => {
          fetchProject();
        }
      )
      .subscribe((status: 'SUBSCRIBED' | 'TIMED_OUT' | 'CHANNEL_ERROR' | 'CLOSED') => {
          if (status === "SUBSCRIBED") {
            setConnected(true);
            // TODO: Implement proper latency measurement
            setLatency(0); // Placeholder
          } else {
            setConnected(false);
            setLatency(null);
          }
        }
      );

    return () => {
      supabase.removeChannel(channel);
    };
  }, [params.projectId, user]);

  // Fetch document content
  useEffect(() => {
    if (!params.projectId || !user) return;

    const fetchDocument = async () => {
      const { data, error } = await supabase
        .from("documents")
        .select("content")
        .eq("project_id", params.projectId)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Error fetching document:", error);
      } else if (data) {
        setDocumentContent(data.content || "");
      }
    };

    fetchDocument();
  }, [params.projectId, user]);

  // Save document content
  const saveDocument = useCallback(async () => {
    if (!params.projectId || !user) return;

    try {
      const { data, error } = await supabase
        .from("documents")
        .upsert({
          project_id: params.projectId,
          name: `${project?.name || "Untitled"} Document`,
          content: documentContent,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: "project_id"
        })
        .select();

      if (error) {
        console.error("Error saving document:", error);
      } else if (data) {
        setIsEditing(false);
      }
    } catch (error) {
      console.error("Error saving document:", error);
    }
  }, [params.projectId, user, project, documentContent, profile]);

  // Toggle sidebar
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading workspace...</div>;
  }

  if (!project) {
    return <div className="min-h-screen flex items-center justify-center">Project not found</div>;
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <div className={`bg-muted/10 border-r transition-all duration-300 ${sidebarOpen ? "w-64" : "w-16"}`}>
        <div className="p-4 border-b">
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10">
              <AvatarImage src={profile?.avatar_url || "/placeholder.svg"} />
              <AvatarFallback className="text-lg">{profile?.username?.[0] || "U"}</AvatarFallback>
            </Avatar>
            {sidebarOpen && (
              <div>
                <p className="font-medium">{profile?.username || "User"}</p>
                <p className="text-xs text-muted-foreground">
                  {connected ? `Online | Latency: ${latency}ms` : "Offline"}
                </p>
              </div>
            )}
          </div>
        </div>

        <nav className="p-2">
          <ul className="space-y-1">
            <li>
              <Button
                variant={activeTab === "documents" ? "secondary" : "ghost"}
                className="w-full justify-start"
                onClick={() => setActiveTab("documents")}
              >
                <FileText className="h-5 w-5" />
                {sidebarOpen && <span className="ml-3">Documents</span>}
              </Button>
            </li>
            <li>
              <Button
                variant={activeTab === "chat" ? "secondary" : "ghost"}
                className="w-full justify-start"
                onClick={() => setActiveTab("chat")}
              >
                <MessageSquare className="h-5 w-5" />
                {sidebarOpen && <span className="ml-3">Chat</span>}
              </Button>
            </li>
            <li>
              <Button
                variant={activeTab === "tasks" ? "secondary" : "ghost"}
                className="w-full justify-start"
                onClick={() => setActiveTab("tasks")}
              >
                <CheckSquare className="h-5 w-5" />
                {sidebarOpen && <span className="ml-3">Tasks</span>}
              </Button>
            </li>
            <li>
              <Button
                variant={activeTab === "files" ? "secondary" : "ghost"}
                className="w-full justify-start"
                onClick={() => setActiveTab("files")}
              >
                <FolderOpen className="h-5 w-5" />
                {sidebarOpen && <span className="ml-3">Files</span>}
              </Button>
            </li>
            <li>
              <Button
                variant={activeTab === "members" ? "secondary" : "ghost"}
                className="w-full justify-start"
                onClick={() => setActiveTab("members")}
              >
                <Users className="h-5 w-5" />
                {sidebarOpen && <span className="ml-3">Members</span>}
              </Button>
            </li>
            <li>
              <Button
                variant={activeTab === "settings" ? "secondary" : "ghost"}
                className="w-full justify-start"
                onClick={() => setActiveTab("settings")}
              >
                <Cog className="h-5 w-5" />
                {sidebarOpen && <span className="ml-3">Settings</span>}
              </Button>
            </li>
          </ul>
        </nav>

        <div className="absolute bottom-4 left-4">
          <Button variant="ghost" size="sm" onClick={toggleSidebar}>
            {sidebarOpen ? (
              <ChevronLeft className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="border-b p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold">{project.name}</h1>
            <Badge variant="outline" className="bg-blue-100 text-blue-800">
              {project.status || "Active"}
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
            <Button variant="outline" size="sm">
              <Bell className="h-4 w-4 mr-2" />
              Notifications
            </Button>
          </div>
        </header>

        {/* Tab Content */}
        <main className="flex-1 p-6 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
            <TabsContent value="documents" className="mt-0 h-full">
              <Card className="h-full flex flex-col">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Project Documents</CardTitle>
                  <div className="flex gap-2">
                    {isEditing ? (
                      <>
                        <Button variant="outline" onClick={() => setIsEditing(false)}>
                          Cancel
                        </Button>
                        <Button onClick={saveDocument}>Save</Button>
                      </>
                    ) : (
                      <Button onClick={() => setIsEditing(true)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Document
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="flex-1 overflow-hidden">
                  {isEditing ? (
                    <Textarea
                      value={documentContent}
                      onChange={(e) => setDocumentContent(e.target.value)}
                      className="h-full resize-none"
                      placeholder="Start writing your collaborative document..."
                    />
                  ) : (
                    <ScrollArea className="h-full">
                      <div className="prose max-w-none">
                        {documentContent ? (
                          <div dangerouslySetInnerHTML={{ __html: documentContent }} />
                        ) : (
                          <p className="text-muted-foreground">No content yet. Click "Edit Document" to start writing.</p>
                        )}
                      </div>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="chat" className="mt-0 h-full">
              <Card className="h-full flex flex-col">
                <CardHeader>
                  <CardTitle>Project Chat</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 p-0">
                  <ChatComponent projectId={params.projectId} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="tasks" className="mt-0 h-full">
              <Card className="h-full flex flex-col">
                <CardHeader>
                  <CardTitle>Project Tasks</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 p-0 overflow-hidden">
                  <TaskManagement projectId={params.projectId} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="files" className="mt-0 h-full">
              <Card className="h-full flex flex-col">
                <CardHeader>
                  <CardTitle>Project Files</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 p-0 overflow-hidden">
                  <FileSharing projectId={params.projectId} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="members" className="mt-0 h-full">
              <Card className="h-full flex flex-col">
                <CardHeader>
                  <CardTitle>Project Members</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 p-0 overflow-hidden">
                  <UserPresenceTracker projectId={params.projectId} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings" className="mt-0 h-full">
              <Card className="h-full flex flex-col">
                <CardHeader>
                  <CardTitle>Project Settings</CardTitle>
                </CardHeader>
                <CardContent className="flex-1">
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium mb-4">Project Information</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium">Project Name</label>
                          <Input defaultValue={project.name} className="mt-1" />
                        </div>
                        <div>
                          <label className="text-sm font-medium">Description</label>
                          <Textarea defaultValue={project.description} className="mt-1" />
                        </div>
                        <div>
                          <label className="text-sm font-medium">Privacy</label>
                          <Select defaultValue={project.is_public ? "public" : "private"}>
                            <SelectTrigger className="mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="private">Private - Only invited members</SelectItem>
                              <SelectItem value="public">Public - Anyone can view</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-medium mb-4">Members</h3>
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={project.owner?.avatar_url || "/placeholder.svg"} />
                            <AvatarFallback className="text-xs">{project.owner?.username?.[0] || "U"}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="text-sm font-medium">{project.owner?.username || "User"}</p>
                            <p className="text-xs text-muted-foreground">Owner</p>
                          </div>
                          <Button variant="outline" size="sm">
                            Remove
                          </Button>
                        </div>
                        {(project.members || []).map((member) => (
                          <div key={member.user_id} className="flex items-center gap-3">
                            <Avatar className="w-8 h-8">
                              <AvatarImage src={member.profiles?.avatar_url || "/placeholder.svg"} />
                              <AvatarFallback className="text-xs">{member.profiles?.username?.[0] || "U"}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <p className="text-sm font-medium">{member.profiles?.username || "User"}</p>
                              <p className="text-xs text-muted-foreground">{member.role}</p>
                            </div>
                            <Button variant="outline" size="sm">
                              Remove
                            </Button>
                          </div>
                        ))}
                        <Button variant="outline" className="w-full">
                          <UserPlus className="h-4 w-4 mr-2" />
                          Invite Member
                        </Button>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button className="flex-1">Save Changes</Button>
                      <Button variant="outline" className="flex-1">
                        Cancel
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}