"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "@/hooks/use-toast";

interface RealtimeSyncProps {
  projectId: string;
}

interface RealtimeEvent {
  id: string;
  project_id: string;
  user_id: string;
  event_type: string;
  payload: any;
  created_at: string;
  user?: {
    id: string;
    username: string;
    avatar_url?: string;
  };
}

export default function RealtimeSync({ projectId }: RealtimeSyncProps) {
  const { user, profile } = useAuth();
  const [events, setEvents] = useState<RealtimeEvent[]>([]);
  const [connected, setConnected] = useState(false);
  const [latency, setLatency] = useState<number | null>(null);

  // Subscribe to real-time events
  useEffect(() => {
    if (!projectId || !user) return;

    // Subscribe to project changes
    const projectChannel = supabase
      .channel(`project-${projectId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "projects",
          filter: `id=eq.${projectId}`,
        },
        (payload: any) => {
          handleRealtimeEvent({
            event_type: "project_update",
            payload: payload.new,
          });
        }
      )
      .subscribe((status: any) => {
        if (status === "SUBSCRIBED") {
          setConnected(true);
          console.log("Connected to project channel");
        }
      });

    // Subscribe to document changes
    const documentChannel = supabase
      .channel(`documents-${projectId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "documents",
          filter: `project_id=eq.${projectId}`,
        },
        (payload: any) => {
          handleRealtimeEvent({
            event_type: "document_update",
            payload: payload.new,
          });
        }
      )
      .subscribe((status: any) => {
        if (status === "SUBSCRIBED") {
          setConnected(true);
          console.log("Connected to documents channel");
        }
      });

    // Subscribe to chat messages
    const chatChannel = supabase
      .channel(`chat-${projectId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `project_id=eq.${projectId}`,
        },
        (payload: any) => {
          handleRealtimeEvent({
            event_type: "chat_message",
            payload: payload.new,
          });
        }
      )
      .subscribe((status: any) => {
        if (status === "SUBSCRIBED") {
          setConnected(true);
          console.log("Connected to chat channel");
        }
      });

    // Subscribe to task changes
    const taskChannel = supabase
      .channel(`tasks-${projectId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tasks",
          filter: `project_id=eq.${projectId}`,
        },
        (payload: any) => {
          handleRealtimeEvent({
            event_type: "task_update",
            payload: payload.new,
          });
        }
      )
      .subscribe((status: any) => {
        if (status === "SUBSCRIBED") {
          setConnected(true);
          console.log("Connected to tasks channel");
        }
      });

    // Subscribe to file changes
    const fileChannel = supabase
      .channel(`files-${projectId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "project_files",
          filter: `project_id=eq.${projectId}`,
        },
        (payload: any) => {
          handleRealtimeEvent({
            event_type: "file_update",
            payload: payload.new,
          });
        }
      )
      .subscribe((status: any) => {
        if (status === "SUBSCRIBED") {
          setConnected(true);
          console.log("Connected to files channel");
        }
      });

    // Subscribe to presence changes
    const presenceChannel = supabase
      .channel(`presence-${projectId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "user_presence",
          filter: `project_id=eq.${projectId}`,
        },
        (payload: any) => {
          handleRealtimeEvent({
            event_type: "presence_update",
            payload: payload.new,
          });
        }
      )
      .subscribe((status: any) => {
        if (status === "SUBSCRIBED") {
          setConnected(true);
          console.log("Connected to presence channel");
        }
      });

    return () => {
      supabase.removeChannel(projectChannel);
      supabase.removeChannel(documentChannel);
      supabase.removeChannel(chatChannel);
      supabase.removeChannel(taskChannel);
      supabase.removeChannel(fileChannel);
      supabase.removeChannel(presenceChannel);
    };
  }, [projectId, user]);

  // Handle real-time events
  const handleRealtimeEvent = useCallback(
    (eventData: { event_type: string; payload: any }) => {
      const newEvent: RealtimeEvent = {
        id: Date.now().toString(),
        project_id: projectId,
        user_id: user?.id || "",
        event_type: eventData.event_type,
        payload: eventData.payload,
        created_at: new Date().toISOString(),
        user: {
          id: user?.id || "",
          username: profile?.username || "User",
          avatar_url: profile?.avatar_url || "/placeholder.svg",
        },
      };

      setEvents((prev) => [newEvent, ...prev.slice(0, 99)]); // Keep only last 100 events

      // Show toast notifications for important events
      switch (eventData.event_type) {
        case "chat_message":
          toast({
            title: "New Message",
            description: `${eventData.payload.user?.username || "User"} sent a message`,
          });
          break;
        case "task_update":
          toast({
            title: "Task Updated",
            description: `Task "${eventData.payload.title}" was updated`,
          });
          break;
        case "document_update":
          toast({
            title: "Document Updated",
            description: "A document was updated in the project",
          });
          break;
        case "file_update":
          toast({
            title: "File Added",
            description: `File "${eventData.payload.name}" was added to the project`,
          });
          break;
        case "presence_update":
          if (eventData.payload.status === "online") {
            toast({
              title: "User Online",
              description: `${eventData.payload.user?.username || "User"} is now online`,
            });
          }
          break;
      }
    },
    [projectId, user]
  );

  // Measure latency
  useEffect(() => {
    if (!connected) return;

    const measureLatency = async () => {
      const startTime = Date.now();
      try {
        await supabase.from("projects").select("id").eq("id", projectId).single();
        const endTime = Date.now();
        setLatency(endTime - startTime);
      } catch (error) {
        console.error("Error measuring latency:", error);
      }
    };

    // Measure latency every 30 seconds
    const interval = setInterval(measureLatency, 30000);
    // Measure immediately
    measureLatency();

    return () => clearInterval(interval);
  }, [connected, projectId]);

  // Send custom event
  const sendEvent = async (eventType: string, payload: any) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("realtime_events")
        .insert([
          {
            project_id: projectId,
            user_id: user.id,
            event_type: eventType,
            payload,
          },
        ]);

      if (error) {
        console.error("Error sending event:", error);
      }
    } catch (error) {
      console.error("Error sending event:", error);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="flex items-center gap-2 bg-background border rounded-full px-3 py-2 shadow-lg">
        <div className={`w-3 h-3 rounded-full ${connected ? "bg-green-500" : "bg-red-500"}`}></div>
        <span className="text-sm font-medium">
          {connected ? "Connected" : "Disconnected"}
        </span>
        {latency && (
          <span className="text-xs text-muted-foreground">
            ({latency}ms)
          </span>
        )}
      </div>
    </div>
  );
}