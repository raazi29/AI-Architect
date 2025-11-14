'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { 
  projectService,
  projectTaskService,
  materialService,
  expenseService,
  milestoneService,
  subscribeToProjectChanges,
  type Project,
  type ProjectTask,
  type Material,
  type Expense,
  type ProjectMilestone
} from '@/lib/projectManagementService';
import IndiaLocalizationService from '@/lib/services/indiaLocalizationService';
import { ProjectDashboard } from '@/components/ProjectDashboard';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { 
  Plus, Trash2, Edit2, Activity, CheckCircle2, AlertCircle, Building2, Calculator
} from 'lucide-react';

export default function IndiaProjectManagementPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<ProjectTask[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [milestones, setMilestones] = useState<ProjectMilestone[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  
  // Dialogs
  const [showNewProject, setShowNewProject] = useState(false);
  const [showProjectList, setShowProjectList] = useState(false);
  const [showAddTask, setShowAddTask] = useState(false);
  const [showAddMaterial, setShowAddMaterial] = useState(false);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showAddMilestone, setShowAddMilestone] = useState(false);
  
  // Edit dialogs
  const [showEditTask, setShowEditTask] = useState(false);
  const [showEditMaterial, setShowEditMaterial] = useState(false);
  const [showEditExpense, setShowEditExpense] = useState(false);
  const [showEditMilestone, setShowEditMilestone] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  
  // Form states
  const [projectForm, setProjectForm] = useState({
    name: '',
    budget: '',
    state: '',
    city: '',
    climate_zone: 'tropical' as 'tropical' | 'subtropical' | 'mountain' | 'arid',
    project_type: 'residential' as 'residential' | 'commercial' | 'industrial' | 'infrastructure'
  });
  
  const [taskForm, setTaskForm] = useState({
    name: '',
    category: 'Foundation',
    cost: '',
    status: 'pending' as 'pending' | 'in-progress' | 'completed',
    monsoon_dependent: false,
    vastu_compliant: false,
    permit_required: false
  });
  
  const [materialForm, setMaterialForm] = useState({
    name: '',
    category: '',
    unit: 'kg',
    unit_cost: '',
    quantity: '',
    gst_rate: '18'
  });
  
  const [expenseForm, setExpenseForm] = useState({
    description: '',
    amount: '',
    category: 'Materials',
    gst_rate: '18'
  });
  
  const [milestoneForm, setMilestoneForm] = useState({
    name: '',
    description: '',
    target_date: '',
    payment_percentage: '',
    status: 'pending' as 'pending' | 'in-progress' | 'completed' | 'delayed'
  });

  // Load initial data
  useEffect(() => {
    loadProjects();
  }, []);

  // Subscribe to real-time changes when project is selected
  useEffect(() => {
    if (!currentProject) return;

    console.log('🔄 Setting up real-time subscriptions for project:', currentProject.id);
    setIsConnected(true);

    const unsubscribe = subscribeToProjectChanges(
      currentProject.id,
      handleTaskChange,
      handleMaterialChange,
      handleExpenseChange,
      () => {}, // members
      handleMilestoneChange,
      () => {} // presence
    );

    return () => {
      console.log('🔌 Cleaning up real-time subscriptions');
      setIsConnected(false);
      unsubscribe();
    };
  }, [currentProject?.id]);

  const loadProjects = async () => {
    try {
      console.log('📊 Loading projects from database...');
      const projects = await projectService.getProjects();
      console.log('📥 Projects loaded:', { count: projects.length });
      setAllProjects(projects);
      
      if (projects.length > 0 && !currentProject) {
        await switchToProject(projects[0].id);
      }
    } catch (error) {
      console.error('❌ Error loading projects:', error);
      toast({
        title: 'Error',
        description: 'Failed to load projects',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const switchToProject = async (projectId: string) => {
    try {
      console.log('🔄 Switching to project:', projectId);
      const project = await projectService.getProject(projectId);
      setCurrentProject(project);
      
      // Load project data
      const [tasksData, materialsData, expensesData, milestonesData] = await Promise.all([
        projectTaskService.getTasks(projectId),
        materialService.getMaterials(projectId),
        expenseService.getExpenses(projectId),
        milestoneService.getMilestones(projectId)
      ]);
      
      setTasks(tasksData);
      setMaterials(materialsData);
      setExpenses(expensesData);
      setMilestones(milestonesData);
      
      console.log('✅ Switched to project:', project.name);
      toast({
        title: 'Project Loaded',
        description: `Switched to ${project.name}`
      });
    } catch (error) {
      console.error('❌ Error switching project:', error);
      toast({
        title: 'Error',
        description: 'Failed to load project',
        variant: 'destructive'
      });
    }
  };

  // Real-time handlers
  const handleTaskChange = (payload: any) => {
    console.log('🔄 Task change:', payload);
    if (payload.eventType === 'INSERT') {
      setTasks(prev => [...prev, payload.new]);
    } else if (payload.eventType === 'UPDATE') {
      setTasks(prev => prev.map(t => t.id === payload.new.id ? payload.new : t));
    } else if (payload.eventType === 'DELETE') {
      setTasks(prev => prev.filter(t => t.id !== payload.old.id));
    }
  };

  const handleMaterialChange = (payload: any) => {
    console.log('🔄 Material change:', payload);
    if (payload.eventType === 'INSERT') {
      setMaterials(prev => [...prev, payload.new]);
    } else if (payload.eventType === 'UPDATE') {
      setMaterials(prev => prev.map(m => m.id === payload.new.id ? payload.new : m));
    } else if (payload.eventType === 'DELETE') {
      setMaterials(prev => prev.filter(m => m.id !== payload.old.id));
    }
  };

  const handleExpenseChange = (payload: any) => {
    console.log('🔄 Expense change:', payload);
    if (payload.eventType === 'INSERT') {
      setExpenses(prev => [...prev, payload.new]);
    } else if (payload.eventType === 'UPDATE') {
      setExpenses(prev => prev.map(e => e.id === payload.new.id ? payload.new : e));
    } else if (payload.eventType === 'DELETE') {
      setExpenses(prev => prev.filter(e => e.id !== payload.old.id));
    }
  };

  const handleMilestoneChange = (payload: any) => {
    console.log('🔄 Milestone change:', payload);
    if (payload.eventType === 'INSERT') {
      setMilestones(prev => [...prev, payload.new]);
    } else if (payload.eventType === 'UPDATE') {
      setMilestones(prev => prev.map(m => m.id === payload.new.id ? payload.new : m));
    } else if (payload.eventType === 'DELETE') {
      setMilestones(prev => prev.filter(m => m.id !== payload.old.id));
    }
  };

  // CRUD operations
  const createProject = async () => {
    if (!projectForm.name || !projectForm.budget) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        variant: 'destructive'
      });
      return;
    }

    try {
      const project = await projectService.createProject({
        name: projectForm.name,
        description: '',
        budget: parseFloat(projectForm.budget),
        location: `${projectForm.city}, ${projectForm.state}`,
        state: projectForm.state,
        city: projectForm.city,
        climate_zone: projectForm.climate_zone,
        project_type: projectForm.project_type,
        created_by: 'current_user' // TODO: Get from auth
      });

      setAllProjects(prev => [project, ...prev]);
      await switchToProject(project.id);
      setShowNewProject(false);
      setProjectForm({ name: '', budget: '', state: '', city: '', climate_zone: 'tropical', project_type: 'residential' });
      
      toast({
        title: 'Success',
        description: 'Project created successfully'
      });
    } catch (error) {
      console.error('❌ Error creating project:', error);
      toast({
        title: 'Error',
        description: 'Failed to create project',
        variant: 'destructive'
      });
    }
  };

  const createTask = async () => {
    if (!currentProject || !taskForm.name || !taskForm.cost) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        variant: 'destructive'
      });
      return;
    }

    try {
      await projectTaskService.createTask({
        project_id: currentProject.id,
        name: taskForm.name,
        category: taskForm.category,
        cost: parseFloat(taskForm.cost),
        duration: 0,
        assigned_to: '',
        status: taskForm.status,
        start_date: new Date().toISOString(),
        end_date: new Date().toISOString(),
        monsoon_dependent: taskForm.monsoon_dependent,
        vastu_compliant: taskForm.vastu_compliant,
        permit_required: taskForm.permit_required
      });

      setShowAddTask(false);
      setTaskForm({ name: '', category: 'Foundation', cost: '', status: 'pending', monsoon_dependent: false, vastu_compliant: false, permit_required: false });
      
      toast({
        title: 'Success',
        description: 'Task added successfully'
      });
    } catch (error) {
      console.error('❌ Error creating task:', error);
      toast({
        title: 'Error',
        description: 'Failed to create task',
        variant: 'destructive'
      });
    }
  };

  const deleteTask = async (taskId: string) => {
    if (!currentProject) return;
    
    try {
      await projectTaskService.deleteTask(taskId, currentProject.id);
      toast({
        title: 'Success',
        description: 'Task deleted successfully'
      });
    } catch (error) {
      console.error('❌ Error deleting task:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete task',
        variant: 'destructive'
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Activity className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-lg text-gray-600">Loading projects...</p>
        </div>
      </div>
    );
  }

  if (!currentProject) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-6 w-6" />
              No Projects Found
            </CardTitle>
            <CardDescription>Create your first project to get started</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setShowNewProject(true)} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Create New Project
            </Button>
          </CardContent>
        </Card>
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
              {currentProject.name}
            </h1>
            <div className="flex items-center gap-2">
              <Badge variant={isConnected ? 'default' : 'secondary'} className="flex items-center gap-1">
                {isConnected ? <CheckCircle2 className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                {isConnected ? 'Live' : 'Offline'}
              </Badge>
              {allProjects.length > 1 && (
                <Button variant="outline" onClick={() => setShowProjectList(true)}>
                  Switch Project
                </Button>
              )}
              <Button onClick={() => setShowNewProject(true)}>
                <Plus className="h-4 w-4 mr-2" />
                New Project
              </Button>
            </div>
          </div>
          <p className="text-lg text-blue-600">
            Real-time project management for Indian construction projects
          </p>
        </div>

        {/* Dashboard */}
        <ProjectDashboard
          project={currentProject}
          tasks={tasks}
          materials={materials}
          expenses={expenses}
          milestones={milestones}
        />

        {/* Tabs */}
        <Tabs defaultValue="tasks" className="mt-8">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
            <TabsTrigger value="materials">Materials</TabsTrigger>
            <TabsTrigger value="expenses">Expenses</TabsTrigger>
            <TabsTrigger value="milestones">Milestones</TabsTrigger>
          </TabsList>

          {/* Tasks Tab */}
          <TabsContent value="tasks">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Tasks</CardTitle>
                  <Button onClick={() => setShowAddTask(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Task
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Cost</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Flags</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tasks.map((task) => (
                      <TableRow key={task.id}>
                        <TableCell className="font-medium">{task.name}</TableCell>
                        <TableCell><Badge variant="outline">{task.category}</Badge></TableCell>
                        <TableCell>{IndiaLocalizationService.formatCurrency(task.cost)}</TableCell>
                        <TableCell>
                          <Badge className={
                            task.status === 'completed' ? 'bg-green-500' :
                            task.status === 'in-progress' ? 'bg-blue-500' : 'bg-gray-500'
                          }>
                            {task.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {task.monsoon_dependent && <Badge variant="secondary">🌧️</Badge>}
                            {task.vastu_compliant && <Badge variant="secondary">🕉️</Badge>}
                            {task.permit_required && <Badge variant="destructive">📋</Badge>}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="icon">
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => deleteTask(task.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Other tabs would go here */}
        </Tabs>

        {/* Dialogs */}
        <Dialog open={showNewProject} onOpenChange={setShowNewProject}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Project</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Project Name *</Label>
                <Input
                  value={projectForm.name}
                  onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })}
                  placeholder="e.g., Mumbai Residential Complex"
                />
              </div>
              <div>
                <Label>Budget (₹) *</Label>
                <Input
                  type="number"
                  value={projectForm.budget}
                  onChange={(e) => setProjectForm({ ...projectForm, budget: e.target.value })}
                  placeholder="e.g., 5000000"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>State</Label>
                  <Input
                    value={projectForm.state}
                    onChange={(e) => setProjectForm({ ...projectForm, state: e.target.value })}
                    placeholder="e.g., Maharashtra"
                  />
                </div>
                <div>
                  <Label>City</Label>
                  <Input
                    value={projectForm.city}
                    onChange={(e) => setProjectForm({ ...projectForm, city: e.target.value })}
                    placeholder="e.g., Mumbai"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowNewProject(false)}>Cancel</Button>
              <Button onClick={createProject}>Create Project</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={showAddTask} onOpenChange={setShowAddTask}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Task</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Task Name *</Label>
                <Input
                  value={taskForm.name}
                  onChange={(e) => setTaskForm({ ...taskForm, name: e.target.value })}
                  placeholder="e.g., Foundation Work"
                />
              </div>
              <div>
                <Label>Category</Label>
                <Select value={taskForm.category} onValueChange={(value) => setTaskForm({ ...taskForm, category: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Foundation">Foundation</SelectItem>
                    <SelectItem value="Structural">Structural</SelectItem>
                    <SelectItem value="Masonry">Masonry</SelectItem>
                    <SelectItem value="Plumbing">Plumbing</SelectItem>
                    <SelectItem value="Electrical">Electrical</SelectItem>
                    <SelectItem value="Vastu">Vastu</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Cost (₹) *</Label>
                <Input
                  type="number"
                  value={taskForm.cost}
                  onChange={(e) => setTaskForm({ ...taskForm, cost: e.target.value })}
                  placeholder="e.g., 150000"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={taskForm.monsoon_dependent}
                    onCheckedChange={(checked) => setTaskForm({ ...taskForm, monsoon_dependent: checked as boolean })}
                  />
                  <Label>Monsoon Dependent</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={taskForm.vastu_compliant}
                    onCheckedChange={(checked) => setTaskForm({ ...taskForm, vastu_compliant: checked as boolean })}
                  />
                  <Label>Vastu Compliant</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={taskForm.permit_required}
                    onCheckedChange={(checked) => setTaskForm({ ...taskForm, permit_required: checked as boolean })}
                  />
                  <Label>Permit Required</Label>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddTask(false)}>Cancel</Button>
              <Button onClick={createTask}>Add Task</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
