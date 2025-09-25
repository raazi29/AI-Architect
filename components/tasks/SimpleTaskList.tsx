"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Edit, 
  Trash2, 
  CheckCircle, 
  Circle 
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
}

interface SimpleTaskListProps {
  projectId: string;
}

export default function SimpleTaskList({ projectId }: SimpleTaskListProps) {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    priority: "medium" as "low" | "medium" | "high"
  });

  // Fetch tasks
  useEffect(() => {
    if (!projectId || !user) return;

    const fetchTasks = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
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
            created_by: user.id,
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
          priority: "medium"
        });
        setShowCreateForm(false);
      }
    } catch (error) {
      console.error("Error creating task:", error);
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
            <div>
              <label className="text-sm font-medium">Priority</label>
              <select
                value={newTask.priority}
                onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as "low" | "medium" | "high" })}
                className="w-full p-2 border rounded mt-1"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
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
              <div className="flex items-center justify-between">
                <Badge className={getPriorityColor(task.priority)}>
                  {task.priority}
                </Badge>
                <Badge variant="outline" className={getStatusColor(task.status)}>
                  {task.status.replace("_", " ")}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}

        {tasks.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <p>No tasks yet. Create your first task!</p>
          </div>
        )}
      </div>
    </div>
  );
}