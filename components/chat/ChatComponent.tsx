"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";

interface Message {
  id: string;
  project_id: string;
  user_id: string;
  content: string;
  created_at: string;
  user?: {
    id: string;
    username: string;
    avatar_url?: string;
  };
}

interface ChatComponentProps {
  projectId: string;
}

export default function ChatComponent({ projectId }: ChatComponentProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Fetch messages
  useEffect(() => {
    if (!projectId || !user) return;

    const fetchMessages = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("chat_messages")
        .select(`
          *,
          user:profiles(id, username, avatar_url)
        `)
        .eq("project_id", projectId)
        .order("created_at", { ascending: true })
        .limit(50);

      if (error) {
        console.error("Error fetching messages:", error);
      } else {
        setMessages(data || []);
      }
      setLoading(false);
    };

    fetchMessages();

    // Subscribe to new messages
    const channel = supabase
      .channel("chat-messages")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `project_id=eq.${projectId}`,
        },
        (payload: any) => {
          const newMessage = payload.new as Message;
          // Fetch user data for the new message
          supabase
            .from("profiles")
            .select("id, username, avatar_url")
            .eq("id", newMessage.user_id)
            .then(({ data }: any) => {
              if (data && data.length > 0) {
                setMessages((prev) => [
                  ...prev,
                  {
                    ...newMessage,
                    user: data[0],
                  },
                ]);
              }
            });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId, user]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollViewport = scrollAreaRef.current.querySelector(
        "[data-radix-scroll-area-viewport]"
      );
      if (scrollViewport) {
        scrollViewport.scrollTop = scrollViewport.scrollHeight;
      }
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user) return;

    const messageContent = newMessage.trim();
    setNewMessage("");

    try {
      const { data, error } = await supabase
        .from("chat_messages")
        .insert([
          {
            project_id: projectId,
            user_id: user.id,
            content: messageContent,
          },
        ])
        .select();

      if (error) {
        console.error("Error sending message:", error);
      }
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (loading) {
    return <div className="p-4 text-center">Loading chat...</div>;
  }

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-grow p-4" ref={scrollAreaRef}>
        <div className="space-y-4">
          {messages.map((message) => (
            <div key={message.id} className="flex gap-3">
              <Avatar className="w-8 h-8">
                <AvatarImage
                  src={message.user?.avatar_url || "/placeholder.svg"}
                  alt={message.user?.username || "User"}
                />
                <AvatarFallback>
                  {message.user?.username?.[0] || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">
                    {message.user?.username || "Unknown User"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(message.created_at), "h:mm a")}
                  </span>
                </div>
                <p className="text-sm mt-1">{message.content}</p>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <Input
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyPress}
            className="flex-1"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
            size="sm"
          >
            Send
          </Button>
        </div>
      </div>
    </div>
  );
}