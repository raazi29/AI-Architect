'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Users, Activity, Eye, Edit3 } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface UserPresence {
  id: string;
  user_id: string;
  project_id: string;
  status: 'online' | 'away' | 'offline';
  last_seen: string;
  current_section?: string;
  user_email?: string;
  activity?: 'viewing' | 'editing' | 'typing';
}

interface RealTimePresenceProps {
  projectId: string;
  currentUserId?: string;
  currentSection?: string;
}

export function RealTimePresence({ projectId, currentUserId, currentSection }: RealTimePresenceProps) {
  const [activeUsers, setActiveUsers] = useState<UserPresence[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!projectId) return;

    // Load initial presence data
    loadPresence();

    // Update own presence
    if (currentUserId) {
      updateOwnPresence();
    }

    // Subscribe to presence changes
    const channel = supabase
      .channel(`presence:${projectId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_presence',
          filter: `project_id=eq.${projectId}`,
        },
        (payload) => {
          console.log('Presence change:', payload);
          loadPresence();
        }
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
      });

    // Update presence every 30 seconds
    const presenceInterval = setInterval(() => {
      if (currentUserId) {
        updateOwnPresence();
      }
    }, 30000);

    // Cleanup on unmount
    return () => {
      clearInterval(presenceInterval);
      if (currentUserId) {
        markOffline();
      }
      supabase.removeChannel(channel);
    };
  }, [projectId, currentUserId]);

  // Update presence when section changes
  useEffect(() => {
    if (currentUserId && currentSection) {
      updateOwnPresence();
    }
  }, [currentSection]);

  const loadPresence = async () => {
    try {
      const { data, error } = await supabase
        .from('user_presence')
        .select('*')
        .eq('project_id', projectId)
        .eq('status', 'online')
        .order('last_seen', { ascending: false });

      if (error) throw error;
      setActiveUsers(data || []);
    } catch (error) {
      console.error('Error loading presence:', error);
    }
  };

  const updateOwnPresence = async () => {
    if (!currentUserId) return;

    try {
      const { error } = await supabase.from('user_presence').upsert(
        {
          user_id: currentUserId,
          project_id: projectId,
          status: 'online',
          last_seen: new Date().toISOString(),
          current_section: currentSection || null,
        },
        {
          onConflict: 'user_id,project_id',
        }
      );

      if (error) throw error;
    } catch (error) {
      console.error('Error updating presence:', error);
    }
  };

  const markOffline = async () => {
    if (!currentUserId) return;

    try {
      await supabase
        .from('user_presence')
        .update({ status: 'offline' })
        .eq('user_id', currentUserId)
        .eq('project_id', projectId);
    } catch (error) {
      console.error('Error marking offline:', error);
    }
  };

  const getInitials = (email?: string): string => {
    if (!email) return '?';
    const parts = email.split('@')[0].split('.');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return email.substring(0, 2).toUpperCase();
  };

  const getActivityIcon = (activity?: string) => {
    switch (activity) {
      case 'editing':
        return <Edit3 className="h-3 w-3" />;
      case 'typing':
        return <Activity className="h-3 w-3 animate-pulse" />;
      case 'viewing':
      default:
        return <Eye className="h-3 w-3" />;
    }
  };

  const getActivityColor = (activity?: string) => {
    switch (activity) {
      case 'editing':
        return 'text-orange-500';
      case 'typing':
        return 'text-blue-500';
      case 'viewing':
      default:
        return 'text-green-500';
    }
  };

  if (activeUsers.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-3">
      <TooltipProvider>
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">{activeUsers.length} online</span>
          
          {isConnected && (
            <Badge variant="outline" className="flex items-center gap-1.5">
              <Activity className="h-3 w-3 animate-pulse text-green-500" />
              <span className="text-xs">Live</span>
            </Badge>
          )}
        </div>

        <div className="flex -space-x-2">
          {activeUsers.slice(0, 5).map((user) => (
            <Tooltip key={user.id}>
              <TooltipTrigger>
                <div className="relative">
                  <Avatar className="h-8 w-8 border-2 border-background">
                    <AvatarFallback className="text-xs">
                      {getInitials(user.user_email)}
                    </AvatarFallback>
                  </Avatar>
                  <div
                    className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background ${getActivityColor(
                      user.activity
                    )} bg-current`}
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <div className="space-y-1">
                  <p className="font-medium">{user.user_email || 'Anonymous'}</p>
                  {user.current_section && (
                    <p className="text-xs text-muted-foreground">
                      Viewing: {user.current_section}
                    </p>
                  )}
                  {user.activity && (
                    <div className="flex items-center gap-1 text-xs">
                      {getActivityIcon(user.activity)}
                      <span className="capitalize">{user.activity}</span>
                    </div>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>
          ))}
          
          {activeUsers.length > 5 && (
            <Tooltip>
              <TooltipTrigger>
                <Avatar className="h-8 w-8 border-2 border-background">
                  <AvatarFallback className="text-xs">+{activeUsers.length - 5}</AvatarFallback>
                </Avatar>
              </TooltipTrigger>
              <TooltipContent>
                <p>{activeUsers.length - 5} more users online</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </TooltipProvider>
    </div>
  );
}
