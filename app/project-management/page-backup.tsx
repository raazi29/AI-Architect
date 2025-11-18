'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Calculator,
  Building,
  Plus,
  MapPin,
  IndianRupee,
  Clock,
  Loader2,
  Trash2,
  Edit,
  Check,
  X,
  Calendar,
  Users,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import {
  projectService,
  projectTaskService,
  materialService,
  expenseService,
  milestoneService,
  subscribeToProjectChanges,
  Project,
  ProjectTask,
  Material,
  Expense,
  ProjectMilestone,
  UserPresence
} from '@/lib/projectManagementService';
import IndiaLocalizationService from '@/lib/services/indiaLocalizationService';

export default function ProjectManagementPage() {
  const { user } = useAuth();
  
  // Project selection state
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateProject, setShowCreateProject] = useState(false);

  
  // New project form state
  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    budget: '' as string | number,
    location: '',
    state: '',
    city: '',
    climate_zone: 'tropical' as 'tropical' | 'subtropical' | 'mountain' | 'arid',
    project_type: 'residential' as 'residential' | 'commercial' | 'industrial' | 'infrastructure',
    timeline_days: '' as string | number,
  });
  
  // Project data state
  const [tasks, setTasks] = useState<ProjectTask[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [milestones, setMilestones] = useState<ProjectMilestone[]>([]);
  
  // Form states for adding items
  const [showAddTask, setShowAddTask] = useState(false);
  const [showAddMaterial, setShowAddMaterial] = useState(false);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showAddMilestone, setShowAddMilestone] = useState(false);
  
  const [newTask, setNewTask] = useState({
    name: '',
    category: 'foundation',
    cost: '' as string | number,
    duration: '' as string | number,
    assigned_to: '',
    start_date: '',
    end_date: '',
    status: 'pending' as 'pending' | 'in-progress' | 'completed'
  });
  
  const [newMaterial, setNewMaterial] = useState({
    name: '',
    category: 'cement',
    unit: 'bag',
    unit_cost: '' as string | number,
    quantity: '' as string | number
  });
  
  const [newExpense, setNewExpense] = useState({
    description: '',
    category: 'materials',
    amount: '' as string | number,
    expense_date: '',
    gst_applicable: false,
    gst_rate: 18
  });
  
  const [newMilestone, setNewMilestone] = useState({
    name: '',
    description: '',
    target_date: '',
    status: 'pending' as 'pending' | 'in-progress' | 'completed' | 'delayed'
  });

  
  // Load projects on mount
  useEffect(() => {
    loadProjects();
  }, [user]);
  
  // Load project data when project is selected
  useEffect(() => {
    if (selectedProjectId) {
      loadProjectData(selectedProjectId);
      const unsubscribe = setupRealtimeSubscriptions(selectedProjectId);
      return () => unsubscribe();
    }
  }, [selectedProjectId]);
  
  const loadProjects = async () => {
    try {
      setLoading(true);
      const projectsData = await projectService.getProjects(user?.id);
      setProjects(projectsData);
      
      if (projectsData.length > 0 && !selectedProjectId) {
        setSelectedProjectId(projectsData[0].id);
        setSelectedProject(projectsData[0]);
      }
    } catch (error) {
      console.error('Error loading projects:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const loadProjectData = async (projectId: string) => {
    try {
      setLoading(true);
      const project = await projectService.getProject(projectId);
      setSelectedProject(project);
      
      const [tasksData, materialsData, expensesData, milestonesData] = await Promise.all([
        projectTaskService.getTasks(projectId),
        materialService.getMaterials(projectId),
        expenseService.getExpenses(projectId),
        milestoneService.getMilestones(projectId),
      ]);
      
      setTasks(tasksData);
      setMaterials(materialsData);
      setExpenses(expensesData);
      setMilestones(milestonesData);
    } catch (error) {
      console.error('Error loading project data:', error);
    } finally {
      setLoading(false);
    }
  };

  
  const setupRealtimeSubscriptions = (projectId: string) => {
    return subscribeToProjectChanges(
      projectId,
      (payload) => {
        if (payload.eventType === 'INSERT') {
          setTasks(prev => [...prev, payload.new as ProjectTask]);
        } else if (payload.eventType === 'UPDATE') {
          setTasks(prev => prev.map(task => 
            task.id === payload.new.id ? payload.new as ProjectTask : task
          ));
        } else if (payload.eventType === 'DELETE') {
          setTasks(prev => prev.filter(task => task.id !== payload.old.id));
        }
      },
      (payload) => {
        if (payload.eventType === 'INSERT') {
          setMaterials(prev => [...prev, payload.new as Material]);
        } else if (payload.eventType === 'UPDATE') {
          setMaterials(prev => prev.map(material => 
            material.id === payload.new.id ? payload.new as Material : material
          ));
        } else if (payload.eventType === 'DELETE') {
          setMaterials(prev => prev.filter(material => material.id !== payload.old.id));
        }
      },
      (payload) => {
        if (payload.eventType === 'INSERT') {
          setExpenses(prev => [...prev, payload.new as Expense]);
        } else if (payload.eventType === 'UPDATE') {
          setExpenses(prev => prev.map(expense => 
            expense.id === payload.new.id ? payload.new as Expense : expense
          ));
        } else if (payload.eventType === 'DELETE') {
          setExpenses(prev => prev.filter(expense => expense.id !== payload.old.id));
        }
      },
      () => {},
      (payload) => {
        if (payload.eventType === 'INSERT') {
          setMilestones(prev => [...prev, payload.new as ProjectMilestone]);
        } else if (payload.eventType === 'UPDATE') {
          setMilestones(prev => prev.map(milestone => 
            milestone.id === payload.new.id ? payload.new as ProjectMilestone : milestone
          ));
        } else if (payload.eventType === 'DELETE') {
          setMilestones(prev => prev.filter(milestone => milestone.id !== payload.old.id));
        }
      },
      () => {}
    );
  };

  
  const handleCreateProject = async () => {
    if (!newProject.name || !newProject.budget || !user) return;
    
    try {
      const project = await projectService.createProject({
        name: newProject.name,
        description: newProject.description,
        budget: Number(newProject.budget),
        location: newProject.location,
        state: newProject.state,
        city: newProject.city,
        climate_zone: newProject.climate_zone,
        project_type: newProject.project_type,
        timeline_days: newProject.timeline_days ? Number(newProject.timeline_days) : undefined,
        created_by: user.id,
      });
      
      setProjects([project, ...projects]);
      setSelectedProjectId(project.id);
      setSelectedProject(project);
      setShowCreateProject(false);
      setNewProject({
        name: '',
        description: '',
        budget: '',
        location: '',
        state: '',
        city: '',
        climate_zone: 'tropical',
        project_type: 'residential',
        timeline_days: '',
      });
    } catch (error) {
      console.error('Error creating project:', error);
    }
  };
  
  const handleAddTask = async () => {
    if (!newTask.name || !selectedProjectId) return;
    
    try {
      await projectTaskService.createTask({
        project_id: selectedProjectId,
        name: newTask.name,
        category: newTask.category,
        cost: Number(newTask.cost) || 0,
        duration: Number(newTask.duration) || 0,
        assigned_to: newTask.assigned_to,
        status: newTask.status,
        start_date: newTask.start_date,
        end_date: newTask.end_date,
      });
      
      setShowAddTask(false);
      setNewTask({
        name: '',
        category: 'foundation',
        cost: '',
        duration: '',
        assigned_to: '',
        start_date: '',
        end_date: '',
        status: 'pending'
      });
    } catch (error) {
      console.error('Error adding task:', error);
    }
  };

  
  const handleAddMaterial = async () => {
    if (!newMaterial.name || !selectedProjectId) return;
    
    try {
      await materialService.createMaterial({
        project_id: selectedProjectId,
        name: newMaterial.name,
        category: newMaterial.category,
        unit: newMaterial.unit,
        unit_cost: Number(newMaterial.unit_cost),
        quantity: Number(newMaterial.quantity),
      });
      
      setShowAddMaterial(false);
      setNewMaterial({
        name: '',
        category: 'cement',
        unit: 'bag',
        unit_cost: '',
        quantity: ''
      });
    } catch (error) {
      console.error('Error adding material:', error);
    }
  };
  
  const handleAddExpense = async () => {
    if (!newExpense.description || !selectedProjectId) return;
    
    try {
      await expenseService.createExpense({
        project_id: selectedProjectId,
        description: newExpense.description,
        category: newExpense.category,
        amount: Number(newExpense.amount),
        expense_date: newExpense.expense_date,
        gst_applicable: newExpense.gst_applicable,
        gst_rate: newExpense.gst_rate,
      });
      
      setShowAddExpense(false);
      setNewExpense({
        description: '',
        category: 'materials',
        amount: '',
        expense_date: '',
        gst_applicable: false,
        gst_rate: 18
      });
    } catch (error) {
      console.error('Error adding expense:', error);
    }
  };
  
  const handleAddMilestone = async () => {
    if (!newMilestone.name || !selectedProjectId) return;
    
    try {
      await milestoneService.createMilestone({
        project_id: selectedProjectId,
        name: newMilestone.name,
        description: newMilestone.description,
        target_date: newMilestone.target_date,
        status: newMilestone.status,
      });
      
      setShowAddMilestone(false);
      setNewMilestone({
        name: '',
        description: '',
        target_date: '',
        status: 'pending'
      });
    } catch (error) {
      console.error('Error adding milestone:', error);
    }
  };

  
  const handleDeleteTask = async (taskId: string) => {
    if (!selectedProjectId) return;
    try {
      await projectTaskService.deleteTask(taskId, selectedProjectId);
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };
  
  const handleDeleteMaterial = async (materialId: string) => {
    if (!selectedProjectId) return;
    try {
      await materialService.deleteMaterial(materialId, selectedProjectId);
    } catch (error) {
      console.error('Error deleting material:', error);
    }
  };
  
  const handleDeleteExpense = async (expenseId: string) => {
    if (!selectedProjectId) return;
    try {
      await expenseService.deleteExpense(expenseId, selectedProjectId);
    } catch (error) {
      console.error('Error deleting expense:', error);
    }
  };
  
  const handleDeleteMilestone = async (milestoneId: string) => {
    if (!selectedProjectId) return;
    try {
      await milestoneService.deleteMilestone(milestoneId, selectedProjectId);
    } catch (error) {
      console.error('Error deleting milestone:', error);
    }
  };
  
  const handleUpdateTaskStatus = async (taskId: string, status: 'pending' | 'in-progress' | 'completed') => {
    try {
      await projectTaskService.updateTask({ id: taskId, status });
    } catch (error) {
      console.error('Error updating task status:', error);
    }
  };
  
  // Calculate totals
  const totalTaskCost = tasks.reduce((sum, task) => sum + (task.cost || 0), 0);
  const totalMaterialCost = materials.reduce((sum, material) => sum + material.total_cost, 0);
  const totalExpenseCost = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const totalProjectCost = totalTaskCost + totalMaterialCost + totalExpenseCost;
  const projectBudget = selectedProject?.budget || 0;
  const budgetRemaining = projectBudget - totalProjectCost;
  
  const completedTasks = tasks.filter(task => task.status === 'completed').length;
  const totalTasks = tasks.length;
  const projectProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  
  if (loading && projects.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-indigo-50 p-4 md:p-8 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-lg text-blue-600">Loading projects...</p>
        </div>
      </div>
    );
  }
  
  if (projects.length === 0 && !showCreateProject) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-indigo-50 p-4 md:p-8">
        <div className="max-w-4xl mx-auto text-center py-12">
          <Building className="h-24 w-24 text-blue-300 mx-auto mb-6" />
          <h1 className="text-3xl font-bold text-blue-800 mb-4">No Projects Yet</h1>
          <p className="text-lg text-blue-600 mb-8">
            Create your first project to start managing construction tasks, materials, and expenses.
          </p>
          <Button onClick={() => setShowCreateProject(true)} size="lg">
            <Plus className="h-5 w-5 mr-2" />
            Create Your First Project
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-indigo-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-4xl font-bold text-blue-800 flex items-center gap-3">
              <Calculator className="h-10 w-10 text-blue-600" />
              Indian Project Management
            </h1>
            <Button onClick={() => setShowCreateProject(!showCreateProject)}>
              <Plus className="h-5 w-5 mr-2" />
              New Project
            </Button>
          </div>
          <p className="text-lg text-blue-600">
            Real-time collaborative project management for Indian construction industry
          </p>
        </div>

        
        {showCreateProject && (
          <Card className="mb-8 border-blue-200 shadow-lg">
            <CardHeader>
              <CardTitle>Create New Project</CardTitle>
              <CardDescription>Enter project details to get started</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Project Name *</label>
                  <Input
                    placeholder="e.g., Modern Residential Complex"
                    value={newProject.name}
                    onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Budget (₹) *</label>
                  <div className="relative">
                    <IndianRupee className="absolute left-3 top-3 h-4 w-4 text-blue-500" />
                    <Input
                      type="number"
                      placeholder="Total budget"
                      value={newProject.budget}
                      onChange={(e) => setNewProject({ ...newProject, budget: e.target.value === '' ? '' : Number(e.target.value) })}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Location</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-blue-500" />
                    <Input
                      placeholder="e.g., Mumbai, Maharashtra"
                      value={newProject.location}
                      onChange={(e) => setNewProject({ ...newProject, location: e.target.value })}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Timeline (days)</label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-3 h-4 w-4 text-blue-500" />
                    <Input
                      type="number"
                      placeholder="Project duration"
                      value={newProject.timeline_days}
                      onChange={(e) => setNewProject({ ...newProject, timeline_days: e.target.value === '' ? '' : Number(e.target.value) })}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Project Type</label>
                  <Select value={newProject.project_type} onValueChange={(value: any) => setNewProject({ ...newProject, project_type: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="residential">Residential</SelectItem>
                      <SelectItem value="commercial">Commercial</SelectItem>
                      <SelectItem value="industrial">Industrial</SelectItem>
                      <SelectItem value="infrastructure">Infrastructure</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Climate Zone</label>
                  <Select value={newProject.climate_zone} onValueChange={(value: any) => setNewProject({ ...newProject, climate_zone: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tropical">Tropical (South India)</SelectItem>
                      <SelectItem value="subtropical">Subtropical (North India)</SelectItem>
                      <SelectItem value="mountain">Mountain (Hill Stations)</SelectItem>
                      <SelectItem value="arid">Arid (Rajasthan)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <Textarea
                    placeholder="Brief description of the project..."
                    value={newProject.description}
                    onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                    className="h-20"
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button onClick={handleCreateProject} disabled={!newProject.name || !newProject.budget}>
                  Create Project
                </Button>
                <Button variant="outline" onClick={() => setShowCreateProject(false)}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        
        {projects.length > 0 && (
          <Card className="mb-8 border-blue-200 shadow-lg">
            <CardHeader>
              <CardTitle>Select Project</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={selectedProjectId || ''} onValueChange={setSelectedProjectId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name} - {IndiaLocalizationService.formatCurrency(project.budget)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        )}
        
        {selectedProject && (
          <>
            <Card className="mb-8 border-blue-200 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-6 w-6" />
                  {selectedProject.name}
                </CardTitle>
                <CardDescription>{selectedProject.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-1 text-blue-700">Budget</label>
                    <p className="text-2xl font-bold text-blue-800">
                      {IndiaLocalizationService.formatCurrency(projectBudget)}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-blue-700">Spent</label>
                    <p className="text-2xl font-bold text-orange-600">
                      {IndiaLocalizationService.formatCurrency(totalProjectCost)}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-blue-700">Remaining</label>
                    <p className={`text-2xl font-bold ${budgetRemaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {IndiaLocalizationService.formatCurrency(budgetRemaining)}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-blue-700">Progress</label>
                    <p className="text-2xl font-bold text-blue-800">{projectProgress}%</p>
                    <p className="text-sm text-gray-600">{completedTasks} of {totalTasks} tasks</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            
            <Tabs defaultValue="tasks" className="space-y-4">
              <TabsList>
                <TabsTrigger value="tasks">Tasks ({tasks.length})</TabsTrigger>
                <TabsTrigger value="materials">Materials ({materials.length})</TabsTrigger>
                <TabsTrigger value="expenses">Expenses ({expenses.length})</TabsTrigger>
                <TabsTrigger value="milestones">Milestones ({milestones.length})</TabsTrigger>
              </TabsList>
              
              <TabsContent value="tasks">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Tasks</CardTitle>
                        <CardDescription>Manage project tasks and track progress</CardDescription>
                      </div>
                      <Button onClick={() => setShowAddTask(!showAddTask)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Task
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {showAddTask && (
                      <div className="mb-6 p-4 border rounded-lg bg-blue-50">
                        <h3 className="font-semibold mb-4">Add New Task</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium mb-1">Task Name *</label>
                            <Input
                              placeholder="e.g., Foundation Work"
                              value={newTask.name}
                              onChange={(e) => setNewTask({ ...newTask, name: e.target.value })}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1">Category</label>
                            <Select value={newTask.category} onValueChange={(value) => setNewTask({ ...newTask, category: value })}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {IndiaLocalizationService.getTaskCategories().map((cat) => (
                                  <SelectItem key={cat.value} value={cat.value}>
                                    {cat.icon} {cat.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1">Cost (₹)</label>
                            <Input
                              type="number"
                              placeholder="Task cost"
                              value={newTask.cost}
                              onChange={(e) => setNewTask({ ...newTask, cost: e.target.value === '' ? '' : Number(e.target.value) })}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1">Duration (days)</label>
                            <Input
                              type="number"
                              placeholder="Duration"
                              value={newTask.duration}
                              onChange={(e) => setNewTask({ ...newTask, duration: e.target.value === '' ? '' : Number(e.target.value) })}
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium mb-1">Assigned To</label>
                            <Input
                              placeholder="Contractor name"
                              value={newTask.assigned_to}
                              onChange={(e) => setNewTask({ ...newTask, assigned_to: e.target.value })}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1">Status</label>
                            <Select value={newTask.status} onValueChange={(value: any) => setNewTask({ ...newTask, status: value })}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="in-progress">In Progress</SelectItem>
                                <SelectItem value="completed">Completed</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1">Start Date</label>
                            <Input
                              type="date"
                              value={newTask.start_date}
                              onChange={(e) => setNewTask({ ...newTask, start_date: e.target.value })}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1">End Date</label>
                            <Input
                              type="date"
                              value={newTask.end_date}
                              onChange={(e) => setNewTask({ ...newTask, end_date: e.target.value })}
                            />
                          </div>
                        </div>
                        <div className="flex gap-2 mt-4">
                          <Button onClick={handleAddTask} disabled={!newTask.name}>
                            Add Task
                          </Button>
                          <Button variant="outline" onClick={() => setShowAddTask(false)}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}
                    
                    {tasks.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <AlertCircle className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                        <p>No tasks yet. Add your first task to get started.</p>
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Task Name</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Assigned To</TableHead>
                            <TableHead>Cost</TableHead>
                            <TableHead>Duration</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {tasks.map((task) => (
                            <TableRow key={task.id}>
                              <TableCell className="font-medium">{task.name}</TableCell>
                              <TableCell className="capitalize">{task.category}</TableCell>
                              <TableCell>{task.assigned_to || '-'}</TableCell>
                              <TableCell>{IndiaLocalizationService.formatCurrency(task.cost || 0)}</TableCell>
                              <TableCell>{task.duration} days</TableCell>
                              <TableCell>
                                <Select value={task.status} onValueChange={(value: any) => handleUpdateTaskStatus(task.id, value)}>
                                  <SelectTrigger className="w-32">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="pending">
                                      <Badge variant="secondary">Pending</Badge>
                                    </SelectItem>
                                    <SelectItem value="in-progress">
                                      <Badge className="bg-blue-500">In Progress</Badge>
                                    </SelectItem>
                                    <SelectItem value="completed">
                                      <Badge className="bg-green-500">Completed</Badge>
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteTask(task.id)}
                                >
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              
              <TabsContent value="materials">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Materials</CardTitle>
                        <CardDescription>Track construction materials and costs</CardDescription>
                      </div>
                      <Button onClick={() => setShowAddMaterial(!showAddMaterial)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Material
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {showAddMaterial && (
                      <div className="mb-6 p-4 border rounded-lg bg-blue-50">
                        <h3 className="font-semibold mb-4">Add New Material</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium mb-1">Material Name *</label>
                            <Input
                              placeholder="e.g., OPC 53 Grade Cement"
                              value={newMaterial.name}
                              onChange={(e) => setNewMaterial({ ...newMaterial, name: e.target.value })}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1">Category</label>
                            <Select value={newMaterial.category} onValueChange={(value) => setNewMaterial({ ...newMaterial, category: value })}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {IndiaLocalizationService.getMaterialCategories().map((cat) => (
                                  <SelectItem key={cat} value={cat}>
                                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1">Unit</label>
                            <Input
                              placeholder="e.g., bag, kg, cubic meter"
                              value={newMaterial.unit}
                              onChange={(e) => setNewMaterial({ ...newMaterial, unit: e.target.value })}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1">Unit Cost (₹) *</label>
                            <Input
                              type="number"
                              placeholder="Cost per unit"
                              value={newMaterial.unit_cost}
                              onChange={(e) => setNewMaterial({ ...newMaterial, unit_cost: e.target.value === '' ? '' : Number(e.target.value) })}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1">Quantity *</label>
                            <Input
                              type="number"
                              placeholder="Quantity"
                              value={newMaterial.quantity}
                              onChange={(e) => setNewMaterial({ ...newMaterial, quantity: e.target.value === '' ? '' : Number(e.target.value) })}
                            />
                          </div>
                        </div>
                        <div className="flex gap-2 mt-4">
                          <Button onClick={handleAddMaterial} disabled={!newMaterial.name || !newMaterial.unit_cost || !newMaterial.quantity}>
                            Add Material
                          </Button>
                          <Button variant="outline" onClick={() => setShowAddMaterial(false)}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}

                    
                    {materials.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <AlertCircle className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                        <p>No materials yet. Add materials to track costs.</p>
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Material Name</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Unit</TableHead>
                            <TableHead>Unit Cost</TableHead>
                            <TableHead>Quantity</TableHead>
                            <TableHead>Total Cost</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {materials.map((material) => (
                            <TableRow key={material.id}>
                              <TableCell className="font-medium">{material.name}</TableCell>
                              <TableCell className="capitalize">{material.category}</TableCell>
                              <TableCell>{material.unit}</TableCell>
                              <TableCell>{IndiaLocalizationService.formatCurrency(material.unit_cost)}</TableCell>
                              <TableCell>{material.quantity}</TableCell>
                              <TableCell className="font-semibold">{IndiaLocalizationService.formatCurrency(material.total_cost)}</TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteMaterial(material.id)}
                                >
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              
              <TabsContent value="expenses">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Expenses</CardTitle>
                        <CardDescription>Track project expenses and payments</CardDescription>
                      </div>
                      <Button onClick={() => setShowAddExpense(!showAddExpense)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Expense
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {showAddExpense && (
                      <div className="mb-6 p-4 border rounded-lg bg-blue-50">
                        <h3 className="font-semibold mb-4">Add New Expense</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium mb-1">Description *</label>
                            <Input
                              placeholder="e.g., Municipal Permit"
                              value={newExpense.description}
                              onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1">Category</label>
                            <Select value={newExpense.category} onValueChange={(value) => setNewExpense({ ...newExpense, category: value })}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {IndiaLocalizationService.getExpenseCategories().map((cat) => (
                                  <SelectItem key={cat.value} value={cat.value}>
                                    {cat.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1">Amount (₹) *</label>
                            <Input
                              type="number"
                              placeholder="Expense amount"
                              value={newExpense.amount}
                              onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value === '' ? '' : Number(e.target.value) })}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1">Date *</label>
                            <Input
                              type="date"
                              value={newExpense.expense_date}
                              onChange={(e) => setNewExpense({ ...newExpense, expense_date: e.target.value })}
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              id="gst-applicable"
                              checked={newExpense.gst_applicable}
                              onChange={(e) => setNewExpense({ ...newExpense, gst_applicable: e.target.checked })}
                              className="h-4 w-4"
                            />
                            <label htmlFor="gst-applicable" className="text-sm font-medium">
                              GST Applicable
                            </label>
                          </div>
                          {newExpense.gst_applicable && (
                            <div>
                              <label className="block text-sm font-medium mb-1">GST Rate (%)</label>
                              <Input
                                type="number"
                                value={newExpense.gst_rate}
                                onChange={(e) => setNewExpense({ ...newExpense, gst_rate: Number(e.target.value) })}
                              />
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2 mt-4">
                          <Button onClick={handleAddExpense} disabled={!newExpense.description || !newExpense.amount || !newExpense.expense_date}>
                            Add Expense
                          </Button>
                          <Button variant="outline" onClick={() => setShowAddExpense(false)}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}

                    
                    {expenses.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <AlertCircle className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                        <p>No expenses yet. Track project expenses here.</p>
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Description</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>GST</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {expenses.map((expense) => (
                            <TableRow key={expense.id}>
                              <TableCell className="font-medium">{expense.description}</TableCell>
                              <TableCell className="capitalize">{expense.category}</TableCell>
                              <TableCell>{IndiaLocalizationService.formatCurrency(expense.amount)}</TableCell>
                              <TableCell>
                                {expense.gst_applicable ? (
                                  <span className="text-sm">
                                    {expense.gst_rate}% ({IndiaLocalizationService.formatCurrency(expense.gst_amount || 0)})
                                  </span>
                                ) : (
                                  <span className="text-gray-400">N/A</span>
                                )}
                              </TableCell>
                              <TableCell>{IndiaLocalizationService.formatDate(expense.expense_date)}</TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteExpense(expense.id)}
                                >
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              
              <TabsContent value="milestones">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Milestones</CardTitle>
                        <CardDescription>Track project milestones and deadlines</CardDescription>
                      </div>
                      <Button onClick={() => setShowAddMilestone(!showAddMilestone)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Milestone
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {showAddMilestone && (
                      <div className="mb-6 p-4 border rounded-lg bg-blue-50">
                        <h3 className="font-semibold mb-4">Add New Milestone</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium mb-1">Milestone Name *</label>
                            <Input
                              placeholder="e.g., Foundation Complete"
                              value={newMilestone.name}
                              onChange={(e) => setNewMilestone({ ...newMilestone, name: e.target.value })}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1">Target Date *</label>
                            <Input
                              type="date"
                              value={newMilestone.target_date}
                              onChange={(e) => setNewMilestone({ ...newMilestone, target_date: e.target.value })}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1">Status</label>
                            <Select value={newMilestone.status} onValueChange={(value: any) => setNewMilestone({ ...newMilestone, status: value })}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="in-progress">In Progress</SelectItem>
                                <SelectItem value="completed">Completed</SelectItem>
                                <SelectItem value="delayed">Delayed</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium mb-1">Description</label>
                            <Textarea
                              placeholder="Milestone description..."
                              value={newMilestone.description}
                              onChange={(e) => setNewMilestone({ ...newMilestone, description: e.target.value })}
                              className="h-20"
                            />
                          </div>
                        </div>
                        <div className="flex gap-2 mt-4">
                          <Button onClick={handleAddMilestone} disabled={!newMilestone.name || !newMilestone.target_date}>
                            Add Milestone
                          </Button>
                          <Button variant="outline" onClick={() => setShowAddMilestone(false)}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}
                    
                    {milestones.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <AlertCircle className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                        <p>No milestones yet. Set project milestones to track progress.</p>
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Milestone Name</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Target Date</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {milestones.map((milestone) => (
                            <TableRow key={milestone.id}>
                              <TableCell className="font-medium">{milestone.name}</TableCell>
                              <TableCell>{milestone.description || '-'}</TableCell>
                              <TableCell>{IndiaLocalizationService.formatDate(milestone.target_date)}</TableCell>
                              <TableCell>
                                <Badge
                                  className={
                                    milestone.status === 'completed'
                                      ? 'bg-green-500'
                                      : milestone.status === 'in-progress'
                                      ? 'bg-blue-500'
                                      : milestone.status === 'delayed'
                                      ? 'bg-red-500'
                                      : 'bg-gray-500'
                                  }
                                >
                                  {milestone.status}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteMilestone(milestone.id)}
                                >
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </div>
  );
}
