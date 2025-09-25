"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Users, 
  Circle, 
  CheckCircle, 
  Clock, 
  Eye, 
  MessageSquare 
} from "lucide-react";

interface UserPresence {
  id: string;
  user_id: string;
  project_id: string;
  status: "online" | "away" | "offline";
  last_seen: string;
  cursor_position: {
    x: number;
    y: number;
  } | null;
  user?: {
    id: string;
    username: string;
    avatar_url?: string;
  };
}

interface UserPresenceTrackerProps {
  projectId: string;
}

export default function UserPresenceTracker({ projectId }: UserPresenceTrackerProps) {
  const { user } = useAuth();
  const [presences, setPresences] = useState<UserPresence[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch and subscribe to user presences
  useEffect(() => {
    if (!projectId || !user) return;

    const fetchPresences = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("user_presence")
        .select(`
          *,
          user:profiles(id, username, avatar_url)
        `)
        .eq("project_id", projectId)
        .order("last_seen", { ascending: false });

      if (error) {
        console.error("Error fetching presences:", error);
      } else {
        setPresences(data || []);
      }
      setLoading(false);
    };

    fetchPresences();

    // Subscribe to presence changes
    const channel = supabase
      .channel("presence-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "user_presence",
          filter: `project_id=eq.${projectId}`,
        },
        (payload: any) => {
          fetchPresences();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId, user]);

  // Update user presence when they're active
  useEffect(() => {
    if (!projectId || !user) return;

    const updatePresence = async () => {
      // Update user status to online
      const { error } = await supabase
        .from("user_presence")
        .upsert({
          user_id: user.id,
          project_id: projectId,
          status: "online",
          last_seen: new Date().toISOString(),
        }, {
          onConflict: "user_id,project_id"
        });

      if (error) {
        console.error("Error updating presence:", error);
      }
    };

    updatePresence();

    // Set up interval to update last_seen timestamp
    const interval = setInterval(() => {
      updatePresence();
    }, 60000); // Update every minute

    // Set up timeout to mark user as away after 5 minutes of inactivity
    const awayTimeout = setTimeout(() => {
      updatePresenceStatus("away");
    }, 300000); // 5 minutes

    // Set up timeout to mark user as offline after 30 minutes of inactivity
    const offlineTimeout = setTimeout(() => {
      updatePresenceStatus("offline");
    }, 1800000); // 30 minutes

    return () => {
      clearInterval(interval);
      clearTimeout(awayTimeout);
      clearTimeout(offlineTimeout);
      // Mark user as offline when they leave
      updatePresenceStatus("offline");
    };
  }, [projectId, user]);

  const updatePresenceStatus = async (status: "online" | "away" | "offline") => {
    if (!user) return;

    const { error } = await supabase
      .from("user_presence")
      .upsert({
        user_id: user.id,
        project_id: projectId,
        status,
        last_seen: new Date().toISOString(),
      }, {
        onConflict: "user_id,project_id"
      });

    if (error) {
      console.error("Error updating presence status:", error);
    }
  };

  const getStatusColor = (status: string) => {
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

  const getStatusText = (status: string) => {
    switch (status) {
      case "online":
        return "Online";
      case "away":
        return "Away";
      case "offline":
        return "Offline";
      default:
        return "Offline";
    }
  };

  const formatLastSeen = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  if (loading) {
    return <div className="p-4 text-center">Loading presence...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Team Presence
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {presences.map((presence) => (
            <div key={presence.id} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Avatar className="w-8 h-8">
                    <AvatarImage
                      src={presence.user?.avatar_url || "/placeholder.svg"}
                      alt={presence.user?.username || "User"}
                    />
                    <AvatarFallback className="text-xs">
                      {presence.user?.username?.[0] || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div
                    className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-background ${getStatusColor(presence.status)}`}
                  />
                </div>
                <div>
                  <p className="text-sm font-medium">{presence.user?.username || "Unknown User"}</p>
                  <p className="text-xs text-muted-foreground">
                    {presence.status === "online" ? (
                      "Online now"
                    ) : (
                      `Last seen ${formatLastSeen(presence.last_seen)}`
                    )}
                  </p>
                </div>
              </div>
              <Badge variant="outline" className={`text-xs ${getStatusColor(presence.status)}`}>
                {getStatusText(presence.status)}
              </Badge>
            </div>
          ))}
          {presences.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4" />
              <p>No team members online</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}