"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { 
  Plus, 
  Calendar, 
  User, 
  MessageSquare, 
  CheckCircle, 
  Circle, 
  MoreHorizontal,
  Edit,
  Trash2,
  UserPlus
} from "lucide-react";

interface Task {
  id: string;
  project_id: string;
  title: string;
  description: string;
  status: "todo" | "in_progress" | "done";
  priority: "low" | "medium" | "high";
  assigned_to: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  due_date: string | null;
  assignee?: {
    id: string;
    username: string;
    avatar_url?: string;
  };
  creator?: {
    id: string;
    username: string;
    avatar_url?: string;
  };
}

interface TaskManagementProps {
  projectId: string;
}

export default function TaskManagement({ projectId }: TaskManagementProps) {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    priority: "medium" as "low" | "medium" | "high",
    assigned_to: null as string | null,
    due_date: ""
  });
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);

  // Fetch tasks
  useEffect(() => {
    if (!projectId || !user) return;

    const fetchTasks = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("tasks")
        .select(`
          *,
          assignee:profiles!assigned_to(id, username, avatar_url),
          creator:profiles!created_by(id, username, avatar_url)
        `)
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching tasks:", error);
      } else {
        setTasks(data || []);
      }
      setLoading(false);
    };

    fetchTasks();

    // Subscribe to task changes
    const channel = supabase
      .channel("tasks-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tasks",
          filter: `project_id=eq.${projectId}`,
        },
        (payload: any) => {
          fetchTasks();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId, user]);

  // Fetch team members
  useEffect(() => {
    if (!projectId || !user) return;

    const fetchTeamMembers = async () => {
      const { data, error } = await supabase
        .from("project_members")
        .select(`
          user_id,
          profiles(id, username, avatar_url)
        `)
        .eq("project_id", projectId);

      if (error) {
        console.error("Error fetching team members:", error);
      } else {
        const members = data.map((item: any) => item.profiles);
        setTeamMembers(members);
      }
    };

    fetchTeamMembers();
  }, [projectId, user]);

  const handleCreateTask = async () => {
    if (!newTask.title.trim() || !user) return;

    try {
      const { data, error } = await supabase
        .from("tasks")
        .insert([
          {
            project_id: projectId,
            title: newTask.title,
            description: newTask.description,
            priority: newTask.priority,
            assigned_to: newTask.assigned_to,
            created_by: user.id,
            due_date: newTask.due_date || null,
          },
        ])
        .select();

      if (error) {
        console.error("Error creating task:", error);
      } else if (data) {
        setTasks([data[0], ...tasks]);
        setNewTask({
          title: "",
          description: "",
          priority: "medium",
          assigned_to: null,
          due_date: ""
        });
        setShowCreateForm(false);
      }
    } catch (error) {
      console.error("Error creating task:", error);
    }
  };

  const handleUpdateTask = async () => {
    if (!editingTask || !user) return;

    try {
      const { data, error } = await supabase
        .from("tasks")
        .update({
          title: editingTask.title,
          description: editingTask.description,
          priority: editingTask.priority,
          assigned_to: editingTask.assigned_to,
          due_date: editingTask.due_date,
          status: editingTask.status,
        })
        .eq("id", editingTask.id)
        .select();

      if (error) {
        console.error("Error updating task:", error);
      } else if (data) {
        setTasks(tasks.map(task => task.id === editingTask.id ? data[0] : task));
        setEditingTask(null);
      }
    } catch (error) {
      console.error("Error updating task:", error);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("tasks")
        .delete()
        .eq("id", taskId);

      if (error) {
        console.error("Error deleting task:", error);
      } else {
        setTasks(tasks.filter(task => task.id !== taskId));
      }
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  };

  const updateTaskStatus = async (taskId: string, status: "todo" | "in_progress" | "done") => {
    try {
      const { data, error } = await supabase
        .from("tasks")
        .update({ status })
        .eq("id", taskId)
        .select();

      if (error) {
        console.error("Error updating task status:", error);
      } else if (data) {
        setTasks(tasks.map(task => task.id === taskId ? { ...task, status } : task));
      }
    } catch (error) {
      console.error("Error updating task status:", error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "todo":
        return "bg-gray-200";
      case "in_progress":
        return "bg-blue-200";
      case "done":
        return "bg-green-200";
      default:
        return "bg-gray-200";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "low":
        return "bg-green-100 text-green-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "high":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const groupedTasks = {
    todo: tasks.filter(task => task.status === "todo"),
    in_progress: tasks.filter(task => task.status === "in_progress"),
    done: tasks.filter(task => task.status === "done")
  };

  if (loading) {
    return <div className="p-4 text-center">Loading tasks...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Project Tasks</h2>
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Task
        </Button>
      </div>

      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Task</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Title</label>
              <Input
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                placeholder="Task title"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <Textarea
                value={newTask.description}
                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                placeholder="Task description"
                className="mt-1"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium">Priority</label>
                <Select
                  value={newTask.priority}
                  onValueChange={(value: any) => setNewTask({ ...newTask, priority: value })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Assign To</label>
                <Select
                  value={newTask.assigned_to || ""}
                  onValueChange={(value) => setNewTask({ ...newTask, assigned_to: value || null })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Unassigned" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Unassigned</SelectItem>
                    {teamMembers.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.username}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Due Date</label>
                <Input
                  type="date"
                  value={newTask.due_date}
                  onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                  className="mt-1"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleCreateTask} className="flex-1">
                Create Task
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowCreateForm(false)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {editingTask && (
        <Card>
          <CardHeader>
            <CardTitle>Edit Task</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Title</label>
              <Input
                value={editingTask.title}
                onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <Textarea
                value={editingTask.description}
                onChange={(e) => setEditingTask({ ...editingTask, description: e.target.value })}
                className="mt-1"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium">Status</label>
                <Select
                  value={editingTask.status}
                  onValueChange={(value: any) => setEditingTask({ ...editingTask, status: value })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todo">To Do</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="done">Done</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Priority</label>
                <Select
                  value={editingTask.priority}
                  onValueChange={(value: any) => setEditingTask({ ...editingTask, priority: value })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Assign To</label>
                <Select
                  value={editingTask.assigned_to || ""}
                  onValueChange={(value) => setEditingTask({ ...editingTask, assigned_to: value || null })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Unassigned" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Unassigned</SelectItem>
                    {teamMembers.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.username}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Due Date</label>
                <Input
                  type="date"
                  value={editingTask.due_date || ""}
                  onChange={(e) => setEditingTask({ ...editingTask, due_date: e.target.value })}
                  className="mt-1"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleUpdateTask} className="flex-1">
                Update Task
              </Button>
              <Button
                variant="outline"
                onClick={() => setEditingTask(null)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Object.entries(groupedTasks).map(([status, tasks]) => (
          <div key={status} className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold capitalize">
                {status.replace("_", " ")} ({tasks.length})
              </h3>
              <Badge className={getStatusColor(status)}>{tasks.length}</Badge>
            </div>
            <ScrollArea className="h-96 pr-4">
              <div className="space-y-4">
                {tasks.map((task) => (
                  <Card key={task.id} className="group hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => updateTaskStatus(task.id, 
                              task.status === "todo" ? "in_progress" : 
                              task.status === "in_progress" ? "done" : "todo"
                            )}
                          >
                            {task.status === "done" ? (
                              <CheckCircle className="h-5 w-5 text-green-500" />
                            ) : (
                              <Circle className="h-5 w-5 text-muted-foreground" />
                            )}
                          </Button>
                          <div>
                            <CardTitle className="text-base line-clamp-2">{task.title}</CardTitle>
                            {task.description && (
                              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                {task.description}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => setEditingTask(task)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => handleDeleteTask(task.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Badge className={getPriorityColor(task.priority)}>
                            {task.priority}
                          </Badge>
                          {task.due_date && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              <span>{format(new Date(task.due_date), "MMM d")}</span>
                            </div>
                          )}
                        </div>
                        
                        {task.assigned_to && task.assignee ? (
                          <div className="flex items-center gap-2">
                            <Avatar className="w-6 h-6">
                              <AvatarImage 
                                src={task.assignee.avatar_url || "/placeholder.svg"} 
                                alt={task.assignee.username} 
                              />
                              <AvatarFallback className="text-xs">
                                {task.assignee.username[0]}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm text-muted-foreground">
                              {task.assignee.username}
                            </span>
                          </div>
                        ) : (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="w-full text-xs"
                            onClick={() => setEditingTask(task)}
                          >
                            <UserPlus className="h-3 w-3 mr-1" />
                            Assign
                          </Button>
                        )}
                        
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <MessageSquare className="h-3 w-3" />
                            <span>0</span>
                          </div>
                          <span>{format(new Date(task.created_at), "MMM d, yyyy")}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                {tasks.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No tasks in this column</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        ))}
      </div>
    </div>
  );
}