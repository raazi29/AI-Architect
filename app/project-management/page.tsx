'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Calculator,
  Building,
  Plus,
  MapPin,
  IndianRupee,
  Clock,
  Loader2
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
  const [userPresence, setUserPresence] = useState<UserPresence[]>([]);
  
  // Load projects on mount
  useEffect(() => {
    loadProjects();
  }, [user]);
  
  // Load project data when project is selected
  useEffect(() => {
    if (selectedProjectId) {
      loadProjectData(selectedProjectId);
      setupRealtimeSubscriptions(selectedProjectId);
    }
  }, [selectedProjectId]);
  
  const loadProjects = async () => {
    try {
      setLoading(true);
      const projectsData = await projectService.getProjects(user?.id);
      setProjects(projectsData);
      
      // Auto-select first project if available
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
      
      // Load project details
      const project = await projectService.getProject(projectId);
      setSelectedProject(project);
      
      // Load all project data in parallel
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
    const unsubscribe = subscribeToProjectChanges(
      projectId,
      // onTaskChange
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
      // onMaterialChange
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
      // onExpenseChange
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
      // onMemberChange
      () => {},
      // onMilestoneChange
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
      // onPresenceChange
      (payload) => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          setUserPresence(prev => {
            const existingIndex = prev.findIndex(p => p.user_id === payload.new.user_id);
            if (existingIndex >= 0) {
              const updated = [...prev];
              updated[existingIndex] = payload.new as UserPresence;
              return updated;
            }
            return [...prev, payload.new as UserPresence];
          });
        } else if (payload.eventType === 'DELETE') {
          setUserPresence(prev => prev.filter(p => p.user_id !== payload.old.user_id));
        }
      }
    );
    
    return () => {
      unsubscribe();
    };
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
      
      // Reset form
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
  
  // Calculate totals
  const totalTaskCost = tasks.reduce((sum, task) => sum + (task.cost || 0), 0);
  const totalMaterialCost = materials.reduce((sum, material) => sum + material.total_cost, 0);
  const totalExpenseCost = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const totalProjectCost = totalTaskCost + totalMaterialCost + totalExpenseCost;
  const projectBudget = selectedProject?.budget || 0;
  const budgetRemaining = projectBudget - totalProjectCost;
  
  // Calculate progress
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
        {/* Header */}
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
        
        {/* Create Project Form */}
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
        
        {/* Project Selector */}
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
        
        {/* Project Overview */}
        {selectedProject && (
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
        )}
        
        {/* Tabs for different sections */}
        {selectedProject && (
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="tasks">Tasks ({tasks.length})</TabsTrigger>
              <TabsTrigger value="materials">Materials ({materials.length})</TabsTrigger>
              <TabsTrigger value="expenses">Expenses ({expenses.length})</TabsTrigger>
              <TabsTrigger value="milestones">Milestones ({milestones.length})</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview">
              <Card>
                <CardHeader>
                  <CardTitle>Project Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold mb-2">Location</h3>
                      <p>{selectedProject.location || 'Not specified'}</p>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">Climate Zone</h3>
                      <p className="capitalize">{selectedProject.climate_zone || 'Not specified'}</p>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">Project Type</h3>
                      <p className="capitalize">{selectedProject.project_type || 'Not specified'}</p>
                    </div>
                    {selectedProject.timeline_days && (
                      <div>
                        <h3 className="font-semibold mb-2">Timeline</h3>
                        <p>{selectedProject.timeline_days} days</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="tasks">
              <Card>
                <CardHeader>
                  <CardTitle>Tasks</CardTitle>
                  <CardDescription>
                    {tasks.length === 0 ? 'No tasks yet. Add your first task to get started.' : `Managing ${tasks.length} tasks`}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {/* Task list will be implemented in next iteration */}
                  <p className="text-gray-500">Task management interface coming soon...</p>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="materials">
              <Card>
                <CardHeader>
                  <CardTitle>Materials</CardTitle>
                  <CardDescription>
                    {materials.length === 0 ? 'No materials yet. Add materials to track costs.' : `Tracking ${materials.length} materials`}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {/* Materials list will be implemented in next iteration */}
                  <p className="text-gray-500">Materials management interface coming soon...</p>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="expenses">
              <Card>
                <CardHeader>
                  <CardTitle>Expenses</CardTitle>
                  <CardDescription>
                    {expenses.length === 0 ? 'No expenses yet. Track project expenses here.' : `Tracking ${expenses.length} expenses`}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {/* Expenses list will be implemented in next iteration */}
                  <p className="text-gray-500">Expense tracking interface coming soon...</p>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="milestones">
              <Card>
                <CardHeader>
                  <CardTitle>Milestones</CardTitle>
                  <CardDescription>
                    {milestones.length === 0 ? 'No milestones yet. Set project milestones.' : `Tracking ${milestones.length} milestones`}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {/* Milestones list will be implemented in next iteration */}
                  <p className="text-gray-500">Milestone tracking interface coming soon...</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}
