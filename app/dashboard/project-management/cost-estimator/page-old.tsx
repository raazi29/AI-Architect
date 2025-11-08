'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  Calculator,
  DollarSign,
  Clock,
  Users,
  Building,
  FileText,
  TrendingUp,
  TrendingDown,
  PieChart,
  BarChart3,
  FileSpreadsheet,
  Settings,
  Plus,
  Trash2,
  Edit3,
  Eye,
  Download,
  Upload,
  Filter,
  Search,
  Check,
  AlertCircle,
  Target,
  Briefcase,
  Package,
  Activity
} from 'lucide-react';

interface ProjectTask {
  id: string;
  name: string;
  category: string;
  cost: number;
  duration: number;
  assignedTo: string;
  status: 'pending' | 'in-progress' | 'completed';
  startDate: string;
  endDate: string;
}

interface Material {
  id: string;
  name: string;
  category: string;
  unit: string;
  unitCost: number;
  quantity: number;
  totalCost: number;
}

interface Expense {
  id: string;
  name: string;
  category: string;
  amount: number;
  date: string;
  notes: string;
}

interface ProjectMilestone {
  id: string;
  name: string;
  targetDate: string;
  completed: boolean;
  budget: number;
  actualCost: number;
}

export default function ProjectManagementCostEstimatorPage() {
  // Real-time connection
  const [isRealtimeEnabled, setIsRealtimeEnabled] = useState(true); // Enable by default
  const [realtimeChannel, setRealtimeChannel] = useState<any>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  
  // State for project details
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [projectBudget, setProjectBudget] = useState<number | ''>('');
  const [projectTimeline, setProjectTimeline] = useState<number | ''>('');
  const [showNewProjectDialog, setShowNewProjectDialog] = useState(false);
  
  // State for tasks
  const [tasks, setTasks] = useState<ProjectTask[]>([
    {
      id: '1',
      name: 'Foundation Work',
      category: 'Construction',
      cost: 15000,
      duration: 10,
      assignedTo: 'John Smith',
      status: 'completed',
      startDate: '2024-01-01',
      endDate: '2024-01-10'
    },
    {
      id: '2',
      name: 'Framing',
      category: 'Construction',
      cost: 25000,
      duration: 15,
      assignedTo: 'Mike Johnson',
      status: 'in-progress',
      startDate: '2024-01-11',
      endDate: '2024-01-25'
    },
    {
      id: '3',
      name: 'Electrical Work',
      category: 'Electrical',
      cost: 12000,
      duration: 12,
      assignedTo: 'Sarah Davis',
      status: 'pending',
      startDate: '2024-01-26',
      endDate: '2024-02-06'
    }
  ]);
  
  // State for materials
  const [materials, setMaterials] = useState<Material[]>([
    {
      id: '1',
      name: 'Cement',
      category: 'Building Materials',
      unit: 'bag',
      unitCost: 10,
      quantity: 500,
      totalCost: 5000
    },
    {
      id: '2',
      name: 'Steel Rods',
      category: 'Building Materials',
      unit: 'kg',
      unitCost: 80,
      quantity: 200,
      totalCost: 160000
    },
    {
      id: '3',
      name: 'Wood Planks',
      category: 'Building Materials',
      unit: 'piece',
      unitCost: 25,
      quantity: 500,
      totalCost: 12500
    }
  ]);
  
  // State for expenses
  const [expenses, setExpenses] = useState<Expense[]>([
    {
      id: '1',
      name: 'Permit Fees',
      category: 'Legal',
      amount: 2500,
      date: '2024-01-05',
      notes: 'Building permit and inspection fees'
    },
    {
      id: '2',
      name: 'Consultation',
      category: 'Professional',
      amount: 5000,
      date: '2024-01-10',
      notes: 'Architect consultation'
    }
  ]);
  
  // State for milestones
 const [milestones, setMilestones] = useState<ProjectMilestone[]>([
    {
      id: '1',
      name: 'Foundation Complete',
      targetDate: '2024-01-10',
      completed: true,
      budget: 15000,
      actualCost: 15000
    },
    {
      id: '2',
      name: 'Framing Complete',
      targetDate: '2024-01-25',
      completed: false,
      budget: 25000,
      actualCost: 0
    },
    {
      id: '3',
      name: 'Electrical Complete',
      targetDate: '2024-02-06',
      completed: false,
      budget: 12000,
      actualCost: 0
    }
  ]);
  
  // Form states
  const [newTask, setNewTask] = useState({
    name: '',
    category: 'Construction',
    cost: '' as string | number,
    duration: '' as string | number,
    assignedTo: '',
    startDate: '',
    endDate: ''
  });
  
  const [newMaterial, setNewMaterial] = useState({
    name: '',
    category: 'Building Materials',
    unit: 'unit',
    unitCost: '' as string | number,
    quantity: '' as string | number
  });
  
  const [newExpense, setNewExpense] = useState({
    name: '',
    category: 'General',
    amount: '' as string | number,
    date: '',
    notes: ''
  });
  
  // Calculate totals
  const totalTaskCost = tasks.reduce((sum, task) => sum + task.cost, 0);
  const totalMaterialCost = materials.reduce((sum, material) => sum + material.totalCost, 0);
  const totalExpenseCost = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const totalProjectCost = totalTaskCost + totalMaterialCost + totalExpenseCost;
  const projectBudgetNum = typeof projectBudget === 'number' ? projectBudget : 0;
  const budgetRemaining = projectBudgetNum - totalProjectCost;
  
  // Add new task
  const addTask = () => {
    if (newTask.name && newTask.cost !== '' && newTask.duration !== '') {
      const task: ProjectTask = {
        id: Date.now().toString(),
        name: newTask.name,
        category: newTask.category,
        cost: Number(newTask.cost),
        duration: Number(newTask.duration),
        assignedTo: newTask.assignedTo,
        status: 'pending',
        startDate: newTask.startDate,
        endDate: newTask.endDate
      };
      setTasks([...tasks, task]);
      
      // Broadcast to other users if real-time is enabled
      if (realtimeChannel && isConnected) {
        realtimeChannel.send({
          type: 'broadcast',
          event: 'task_added',
          payload: { task }
        });
      }
      
      // Reset form
      setNewTask({
        name: '',
        category: 'Construction',
        cost: '',
        duration: '',
        assignedTo: '',
        startDate: '',
        endDate: ''
      });
    }
  };
  
  // Add new material
  const addMaterial = () => {
    if (newMaterial.name && newMaterial.unitCost !== '' && newMaterial.quantity !== '') {
      const material: Material = {
        id: Date.now().toString(),
        name: newMaterial.name,
        category: newMaterial.category,
        unit: newMaterial.unit,
        unitCost: Number(newMaterial.unitCost),
        quantity: Number(newMaterial.quantity),
        totalCost: Number(newMaterial.unitCost) * Number(newMaterial.quantity)
      };
      setMaterials([...materials, material]);
      
      // Broadcast to other users
      if (realtimeChannel && isConnected) {
        realtimeChannel.send({
          type: 'broadcast',
          event: 'material_added',
          payload: { material }
        });
      }
      
      // Reset form
      setNewMaterial({
        name: '',
        category: 'Building Materials',
        unit: 'unit',
        unitCost: '',
        quantity: ''
      });
    }
  };
  
  // Add new expense
  const addExpense = () => {
    if (newExpense.name && newExpense.amount !== '' && newExpense.date) {
      const expense: Expense = {
        id: Date.now().toString(),
        name: newExpense.name,
        category: newExpense.category,
        amount: Number(newExpense.amount),
        date: newExpense.date,
        notes: newExpense.notes
      };
      setExpenses([...expenses, expense]);
      
      // Broadcast to other users
      if (realtimeChannel && isConnected) {
        realtimeChannel.send({
          type: 'broadcast',
          event: 'expense_added',
          payload: { expense }
        });
      }
      
      // Reset form
      setNewExpense({
        name: '',
        category: 'General',
        amount: '',
        date: '',
        notes: ''
      });
    }
  };
  
  // Remove item functions
  const removeTask = (id: string) => {
    setTasks(tasks.filter(task => task.id !== id));
    
    // Broadcast to other users
    if (realtimeChannel && isConnected) {
      realtimeChannel.send({
        type: 'broadcast',
        event: 'task_removed',
        payload: { taskId: id }
      });
    }
  };
  
  const removeMaterial = (id: string) => {
    setMaterials(materials.filter(material => material.id !== id));
    
    // Broadcast to other users
    if (realtimeChannel && isConnected) {
      realtimeChannel.send({
        type: 'broadcast',
        event: 'material_removed',
        payload: { materialId: id }
      });
    }
  };
  
  const removeExpense = (id: string) => {
    setExpenses(expenses.filter(expense => expense.id !== id));
    
    // Broadcast to other users
    if (realtimeChannel && isConnected) {
      realtimeChannel.send({
        type: 'broadcast',
        event: 'expense_removed',
        payload: { expenseId: id }
      });
    }
  };
  
  // Calculate project progress
  const completedTasks = tasks.filter(task => task.status === 'completed').length;
  const totalTasks = tasks.length;
  const projectProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  
  // Calculate milestone progress
  const completedMilestones = milestones.filter(m => m.completed).length;
  const totalMilestones = milestones.length;
  const milestoneProgress = totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0;
  
  // Load data from Supabase on mount
  useEffect(() => {
    const loadProjects = async () => {
      try {
        const { data: projects, error } = await supabase
          .from('projects')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (error) {
          console.log('No projects found or error:', error.message);
          return;
        }

        if (projects) {
          setCurrentProjectId(projects.id);
          setProjectName(projects.name || '');
          setProjectDescription(projects.description || '');
          setProjectBudget(projects.budget || '');
          setProjectTimeline(projects.timeline_days || '');
        }
      } catch (err) {
        console.error('Error loading projects:', err);
      }
    };

    loadProjects();
  }, []);

  // Real-time connection with Supabase Database
  useEffect(() => {
    if (!isRealtimeEnabled || !currentProjectId) {
      setIsConnected(false);
      if (realtimeChannel) {
        supabase.removeChannel(realtimeChannel);
        setRealtimeChannel(null);
      }
      return;
    }

    console.log('Setting up real-time for project:', currentProjectId);

    // Create a channel for database changes
    const channel = supabase
      .channel('project-changes')
      // Subscribe to tasks table changes
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
          filter: `project_id=eq.${currentProjectId}`
        },
        (payload) => {
          console.log('Task change detected:', payload);
          if (payload.eventType === 'INSERT') {
            const newTask: ProjectTask = {
              id: payload.new.id,
              name: payload.new.name,
              category: payload.new.category || '',
              cost: payload.new.cost || 0,
              duration: payload.new.duration || 0,
              assignedTo: payload.new.assigned_to || '',
              status: payload.new.status || 'pending',
              startDate: payload.new.start_date || '',
              endDate: payload.new.end_date || ''
            };
            setTasks(prev => [...prev, newTask]);
          } else if (payload.eventType === 'DELETE') {
            setTasks(prev => prev.filter(t => t.id !== payload.old.id));
          } else if (payload.eventType === 'UPDATE') {
            setTasks(prev => prev.map(t => 
              t.id === payload.new.id ? {
                id: payload.new.id,
                name: payload.new.name,
                category: payload.new.category || '',
                cost: payload.new.cost || 0,
                duration: payload.new.duration || 0,
                assignedTo: payload.new.assigned_to || '',
                status: payload.new.status || 'pending',
                startDate: payload.new.start_date || '',
                endDate: payload.new.end_date || ''
              } : t
            ));
          }
        }
      )
      // Subscribe to materials table changes
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'materials',
          filter: `project_id=eq.${currentProjectId}`
        },
        (payload) => {
          console.log('Material change detected:', payload);
          if (payload.eventType === 'INSERT') {
            const newMaterial: Material = {
              id: payload.new.id,
              name: payload.new.name,
              category: payload.new.category || '',
              unit: payload.new.unit || '',
              unitCost: payload.new.unit_cost || 0,
              quantity: payload.new.quantity || 0,
              totalCost: payload.new.total_cost || 0
            };
            setMaterials(prev => [...prev, newMaterial]);
          } else if (payload.eventType === 'DELETE') {
            setMaterials(prev => prev.filter(m => m.id !== payload.old.id));
          }
        }
      )
      // Subscribe to expenses table changes
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'expenses',
          filter: `project_id=eq.${currentProjectId}`
        },
        (payload) => {
          console.log('Expense change detected:', payload);
          if (payload.eventType === 'INSERT') {
            const newExpense: Expense = {
              id: payload.new.id,
              name: payload.new.description,
              category: payload.new.category || '',
              amount: payload.new.amount || 0,
              date: payload.new.expense_date || '',
              notes: ''
            };
            setExpenses(prev => [...prev, newExpense]);
          } else if (payload.eventType === 'DELETE') {
            setExpenses(prev => prev.filter(e => e.id !== payload.old.id));
          }
        }
      )
      .subscribe((status) => {
        console.log('Real-time subscription status:', status);
        if (status === 'SUBSCRIBED') {
          setIsConnected(true);
          console.log('✅ Real-time connected!');
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          setIsConnected(false);
          console.log('❌ Real-time disconnected');
        }
      });

    setRealtimeChannel(channel);

    // Cleanup on unmount or when disabled
    return () => {
      if (channel) {
        console.log('Cleaning up real-time channel');
        supabase.removeChannel(channel);
      }
    };
  }, [isRealtimeEnabled, currentProjectId]);
  
  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Clean Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Calculator className="h-8 w-8 text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl md:text-4xl font-bold text-foreground">
                    Project Management Hub
                  </h1>
                  {isRealtimeEnabled && (
                    <Badge 
                      variant={isConnected ? 'default' : 'secondary'}
                      className="flex items-center gap-1.5"
                    >
                      <Activity className={`h-3 w-3 ${isConnected ? 'animate-pulse' : ''}`} />
                      {isConnected ? 'Live' : 'Offline'}
                    </Badge>
                  )}
                </div>
                <p className="text-muted-foreground mt-1">
                  Comprehensive cost estimation & project tracking
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={() => setShowNewProjectDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                New Project
              </Button>
            </div>
          </div>
        </div>

        {/* Clean Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">Total Budget</p>
                  <h3 className="text-2xl font-bold mt-2">${projectBudgetNum.toLocaleString()}</h3>
                </div>
                <div className="p-3 bg-primary/10 rounded-lg">
                  <DollarSign className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">Total Spent</p>
                  <h3 className="text-2xl font-bold mt-2">${totalProjectCost.toLocaleString()}</h3>
                </div>
                <div className="p-3 bg-primary/10 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">Tasks Progress</p>
                  <h3 className="text-2xl font-bold mt-2">{completedTasks}/{totalTasks}</h3>
                </div>
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Check className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={budgetRemaining < 0 ? 'border-destructive' : ''}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">Remaining</p>
                  <h3 className={`text-2xl font-bold mt-2 ${budgetRemaining < 0 ? 'text-destructive' : ''}`}>
                    ${Math.abs(budgetRemaining).toLocaleString()}
                  </h3>
                </div>
                <div className={`p-3 rounded-lg ${budgetRemaining < 0 ? 'bg-destructive/10' : 'bg-primary/10'}`}>
                  {budgetRemaining >= 0 ? 
                    <Target className={`h-6 w-6 ${budgetRemaining < 0 ? 'text-destructive' : 'text-primary'}`} /> : 
                    <AlertCircle className="h-6 w-6 text-destructive" />
                  }
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Project Details Card */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Project Overview
            </CardTitle>
            <CardDescription>Configure your project details and track progress</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                  Project Name
                </label>
                <Input
                  placeholder="e.g., Modern Office Complex"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  Timeline (days)
                </label>
                <Input
                  type="number"
                  placeholder="Total duration"
                  value={projectTimeline}
                  onChange={(e) => setProjectTimeline(e.target.value === '' ? '' : Number(e.target.value))}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Project Description</label>
              <Textarea
                placeholder="Briefly describe the scope of the project..."
                value={projectDescription}
                onChange={(e) => setProjectDescription(e.target.value)}
                className="h-24"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Project Progress</label>
                <span className="text-sm font-semibold">{projectProgress}%</span>
              </div>
              <Progress value={projectProgress} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Clean Tabs */}
        <Tabs defaultValue="tasks" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="tasks">
              <FileText className="h-4 w-4 mr-2" />
              Tasks
            </TabsTrigger>
            <TabsTrigger value="materials">
              <Package className="h-4 w-4 mr-2" />
              Materials
            </TabsTrigger>
            <TabsTrigger value="expenses">
              <DollarSign className="h-4 w-4 mr-2" />
              Expenses
            </TabsTrigger>
            <TabsTrigger value="milestones">
              <TrendingUp className="h-4 w-4 mr-2" />
              Milestones
            </TabsTrigger>
            <TabsTrigger value="reports">
              <PieChart className="h-4 w-4 mr-2" />
              Reports
            </TabsTrigger>
          </TabsList>

          {/* Tasks Tab */}
          <TabsContent value="tasks">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Project Tasks
                    </CardTitle>
                    <CardDescription>Manage and track project tasks with costs and timelines</CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="font-semibold">Task</TableHead>
                            <TableHead className="font-semibold">Category</TableHead>
                            <TableHead className="font-semibold">Cost ($)</TableHead>
                            <TableHead className="font-semibold">Duration</TableHead>
                            <TableHead className="font-semibold">Assigned To</TableHead>
                            <TableHead className="font-semibold">Status</TableHead>
                            <TableHead className="font-semibold text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {tasks.map((task) => (
                            <TableRow key={task.id}>
                              <TableCell className="font-medium">{task.name}</TableCell>
                              <TableCell>
                                <Badge variant="outline" className="capitalize">
                                  {task.category}
                                </Badge>
                              </TableCell>
                              <TableCell className="font-semibold">${task.cost.toLocaleString()}</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1 text-muted-foreground">
                                  <Clock className="h-3 w-3" />
                                  <span>{task.duration}d</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold">
                                    {task.assignedTo.split(' ').map(n => n[0]).join('')}
                                  </div>
                                  <span className="text-sm">{task.assignedTo}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge 
                                  variant={task.status === 'completed' ? 'default' : 'secondary'}
                                  className="capitalize"
                                >
                                  {task.status.replace('-', ' ')}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex gap-1 justify-end">
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <Edit3 className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-8 w-8"
                                    onClick={() => removeTask(task.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <div>
                <Card className="sticky top-4">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Plus className="h-5 w-5" />
                      Add New Task
                    </CardTitle>
                    <CardDescription>Create a new project task</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Task Name</label>
                      <Input
                        value={newTask.name}
                        onChange={(e) => setNewTask({...newTask, name: e.target.value})}
                        placeholder="e.g., Foundation Work"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Category</label>
                      <Select value={newTask.category} onValueChange={(value) => setNewTask({...newTask, category: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Construction">Construction</SelectItem>
                          <SelectItem value="Electrical">Electrical</SelectItem>
                          <SelectItem value="Plumbing">Plumbing</SelectItem>
                          <SelectItem value="HVAC">HVAC</SelectItem>
                          <SelectItem value="Finishing">Finishing</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Cost ($)</label>
                        <Input
                          type="number"
                          value={newTask.cost}
                          onChange={(e) => setNewTask({...newTask, cost: e.target.value === '' ? '' : Number(e.target.value)})}
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Duration (days)</label>
                        <Input
                          type="number"
                          value={newTask.duration}
                          onChange={(e) => setNewTask({...newTask, duration: e.target.value === '' ? '' : Number(e.target.value)})}
                          placeholder="0"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Assigned To</label>
                      <Input
                        value={newTask.assignedTo}
                        onChange={(e) => setNewTask({...newTask, assignedTo: e.target.value})}
                        placeholder="Team member name"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Start Date</label>
                        <Input
                          type="date"
                          value={newTask.startDate}
                          onChange={(e) => setNewTask({...newTask, startDate: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">End Date</label>
                        <Input
                          type="date"
                          value={newTask.endDate}
                          onChange={(e) => setNewTask({...newTask, endDate: e.target.value})}
                        />
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button onClick={addTask} className="w-full">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Task
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Materials Tab */}
          <TabsContent value="materials">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      Materials & Resources
                    </CardTitle>
                    <CardDescription>Track materials and resources with costs</CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="font-semibold">Material</TableHead>
                            <TableHead className="font-semibold">Category</TableHead>
                            <TableHead className="font-semibold">Unit</TableHead>
                            <TableHead className="font-semibold">Unit Cost</TableHead>
                            <TableHead className="font-semibold">Quantity</TableHead>
                            <TableHead className="font-semibold">Total Cost</TableHead>
                            <TableHead className="font-semibold text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {materials.map((material) => (
                            <TableRow key={material.id}>
                              <TableCell className="font-medium">{material.name}</TableCell>
                              <TableCell>
                                <Badge variant="outline" className="capitalize">
                                  {material.category}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-muted-foreground">{material.unit}</TableCell>
                              <TableCell className="font-medium">${material.unitCost.toLocaleString()}</TableCell>
                              <TableCell>
                                <Badge variant="secondary">
                                  {material.quantity}
                                </Badge>
                              </TableCell>
                              <TableCell className="font-bold">${material.totalCost.toLocaleString()}</TableCell>
                              <TableCell>
                                <div className="flex gap-1 justify-end">
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <Edit3 className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-8 w-8"
                                    onClick={() => removeMaterial(material.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <div>
                <Card className="sticky top-4">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Plus className="h-5 w-5" />
                      Add New Material
                    </CardTitle>
                    <CardDescription>Add a new material to your project</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Material Name</label>
                      <Input
                        value={newMaterial.name}
                        onChange={(e) => setNewMaterial({...newMaterial, name: e.target.value})}
                        placeholder="e.g., Cement"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Category</label>
                      <Select value={newMaterial.category} onValueChange={(value) => setNewMaterial({...newMaterial, category: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Building Materials">Building Materials</SelectItem>
                          <SelectItem value="Electrical">Electrical</SelectItem>
                          <SelectItem value="Plumbing">Plumbing</SelectItem>
                          <SelectItem value="Finishing">Finishing</SelectItem>
                          <SelectItem value="Equipment">Equipment</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Unit</label>
                        <Select value={newMaterial.unit} onValueChange={(value) => setNewMaterial({...newMaterial, unit: value})}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="unit">Unit</SelectItem>
                            <SelectItem value="kg">Kilogram</SelectItem>
                            <SelectItem value="bag">Bag</SelectItem>
                            <SelectItem value="piece">Piece</SelectItem>
                            <SelectItem value="box">Box</SelectItem>
                            <SelectItem value="liter">Liter</SelectItem>
                            <SelectItem value="meter">Meter</SelectItem>
                            <SelectItem value="sqm">Square Meter</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Unit Cost ($)</label>
                        <Input
                          type="number"
                          value={newMaterial.unitCost}
                          onChange={(e) => setNewMaterial({...newMaterial, unitCost: e.target.value === '' ? '' : Number(e.target.value)})}
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Quantity</label>
                        <Input
                          type="number"
                          value={newMaterial.quantity}
                          onChange={(e) => setNewMaterial({...newMaterial, quantity: e.target.value === '' ? '' : Number(e.target.value)})}
                          placeholder="0"
                        />
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button onClick={addMaterial} className="w-full">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Material
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Expenses Tab */}
          <TabsContent value="expenses">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Card className="border-blue-200 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-blue-800">
                      <DollarSign className="h-6 w-6" />
                      Additional Expenses
                    </CardTitle>
                    <CardDescription>Track additional project expenses</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Expense</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Amount ($)</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Notes</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {expenses.map((expense) => (
                          <TableRow key={expense.id}>
                            <TableCell className="font-medium">{expense.name}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="capitalize">
                                {expense.category}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-semibold">{expense.amount.toLocaleString()}</TableCell>
                            <TableCell>{expense.date}</TableCell>
                            <TableCell>{expense.notes}</TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button variant="ghost" size="icon">
                                  <Edit3 className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  onClick={() => removeExpense(expense.id)}
                                >
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
              </div>
              
              <div>
                <Card className="border-blue-200 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-blue-800">
                      <Plus className="h-6 w-6" />
                      Add New Expense
                    </CardTitle>
                    <CardDescription>Add an additional project expense</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Expense Name</label>
                      <Input
                        value={newExpense.name}
                        onChange={(e) => setNewExpense({...newExpense, name: e.target.value})}
                        placeholder="e.g., Permit Fees"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Category</label>
                      <Select value={newExpense.category} onValueChange={(value) => setNewExpense({...newExpense, category: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Legal">Legal</SelectItem>
                          <SelectItem value="Professional">Professional</SelectItem>
                          <SelectItem value="Transportation">Transportation</SelectItem>
                          <SelectItem value="Equipment">Equipment</SelectItem>
                          <SelectItem value="General">General</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Amount ($)</label>
                      <Input
                        type="number"
                        value={newExpense.amount}
                        onChange={(e) => setNewExpense({...newExpense, amount: e.target.value === '' ? '' : Number(e.target.value)})}
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Date</label>
                      <Input
                        type="date"
                        value={newExpense.date}
                        onChange={(e) => setNewExpense({...newExpense, date: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Notes</label>
                      <Textarea
                        value={newExpense.notes}
                        onChange={(e) => setNewExpense({...newExpense, notes: e.target.value})}
                        placeholder="Additional details..."
                        className="h-20"
                      />
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button onClick={addExpense} className="w-full">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Expense
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Milestones Tab */}
          <TabsContent value="milestones">
            <Card className="border-blue-200 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-800">
                  <TrendingUp className="h-6 w-6" />
                  Project Milestones
                </CardTitle>
                <CardDescription>Track major project milestones and completion status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Overall Milestone Progress</span>
                    <span className="text-sm font-medium">{milestoneProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className="bg-blue-600 h-2.5 rounded-full" 
                      style={{ width: `${milestoneProgress}%` }}
                    ></div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {milestones.map((milestone) => (
                    <Card key={milestone.id} className={`border-l-4 ${milestone.completed ? 'border-l-green-500' : 'border-l-yellow-500'}`}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold">{milestone.name}</h3>
                            <p className="text-sm text-gray-600">Target: {milestone.targetDate}</p>
                            <div className="mt-2 flex items-center gap-4">
                              <span className={`text-sm ${milestone.completed ? 'text-green-600' : 'text-yellow-600'}`}>
                                {milestone.completed ? 'Completed' : 'Pending'}
                              </span>
                              <span className="text-sm">Budget: ${milestone.budget.toLocaleString()}</span>
                              <span className="text-sm">Actual: ${milestone.actualCost.toLocaleString()}</span>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="icon">
                              <Edit3 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-blue-200 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-blue-800">
                    <PieChart className="h-6 w-6" />
                    Cost Breakdown
                  </CardTitle>
                  <CardDescription>Visual representation of project costs</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>Tasks</span>
                      <span className="font-semibold">${totalTaskCost.toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className="bg-blue-600 h-2.5 rounded-full" 
                        style={{ width: `${totalProjectCost > 0 ? (totalTaskCost / totalProjectCost) * 100 : 0}%` }}
                      ></div>
                    </div>
                    
                    <div className="flex justify-between">
                      <span>Materials</span>
                      <span className="font-semibold">${totalMaterialCost.toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className="bg-green-600 h-2.5 rounded-full" 
                        style={{ width: `${totalProjectCost > 0 ? (totalMaterialCost / totalProjectCost) * 10 : 0}%` }}
                      ></div>
                    </div>
                    
                    <div className="flex justify-between">
                      <span>Expenses</span>
                      <span className="font-semibold">${totalExpenseCost.toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className="bg-purple-600 h-2.5 rounded-full" 
                        style={{ width: `${totalProjectCost > 0 ? (totalExpenseCost / totalProjectCost) * 10 : 0}%` }}
                      ></div>
                    </div>
                    
                    <div className="pt-4 border-t border-gray-200 flex justify-between font-bold">
                      <span>Total</span>
                      <span>${totalProjectCost.toLocaleString()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-blue-200 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-blue-80">
                    <BarChart3 className="h-6 w-6" />
                    Budget Analysis
                  </CardTitle>
                  <CardDescription>Project budget vs actual spending</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span>Budget</span>
                        <span>${projectBudgetNum.toLocaleString()}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-4">
                        <div 
                          className="bg-blue-500 h-4 rounded-full" 
                          style={{ width: '100%' }}
                        ></div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between mb-1">
                        <span>Spent</span>
                        <span>${totalProjectCost.toLocaleString()}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-4">
                        <div 
                          className={`h-4 rounded-full ${totalProjectCost > projectBudgetNum ? 'bg-red-500' : 'bg-green-500'}`} 
                          style={{ width: `${projectBudgetNum > 0 ? Math.min(100, (totalProjectCost / projectBudgetNum) * 100) : 0}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <div className="pt-4 border-t border-gray-200">
                      <div className="flex justify-between">
                        <span>Remaining</span>
                        <span className={`font-semibold ${budgetRemaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          ${budgetRemaining.toLocaleString()}
                        </span>
                      </div>
                      {budgetRemaining < 0 && (
                        <p className="text-sm text-red-600 mt-2">
                          Budget exceeded by ${Math.abs(budgetRemaining).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <Card className="mt-6 border-blue-200 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-800">
                  <FileSpreadsheet className="h-6 w-6" />
                  Project Summary Report
                </CardTitle>
                <CardDescription>Comprehensive project status and financial summary</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h3 className="font-semibold text-blue-800">Tasks</h3>
                      <p className="text-2xl font-bold">{totalTasks}</p>
                      <p className="text-sm text-blue-60">{completedTasks} completed</p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <h3 className="font-semibold text-green-800">Materials</h3>
                      <p className="text-2xl font-bold">{materials.length}</p>
                      <p className="text-sm text-green-60">${totalMaterialCost.toLocaleString()}</p>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <h3 className="font-semibold text-purple-80">Expenses</h3>
                      <p className="text-2xl font-bold">{expenses.length}</p>
                      <p className="text-sm text-purple-60">${totalExpenseCost.toLocaleString()}</p>
                    </div>
                    <div className="bg-yellow-50 p-4 rounded-lg">
                      <h3 className="font-semibold text-yellow-800">Progress</h3>
                      <p className="text-2xl font-bold">{projectProgress}%</p>
                      <p className="text-sm text-yellow-600">Overall completion</p>
                    </div>
                  </div>
                  
                  <div className="mt-6">
                    <h3 className="font-semibold mb-2">Project Notes</h3>
                    <Textarea 
                      placeholder="Add project notes, observations, or important information..."
                      className="h-32"
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export Report
                </Button>
                <Button>
                  <Upload className="h-4 w-4 mr-2" />
                  Save Project
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* New Project Dialog */}
      {showNewProjectDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl mx-4">
            <CardHeader>
              <CardTitle>Create New Project</CardTitle>
              <CardDescription>Set up a new project with budget and timeline</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Project Name</label>
                <Input
                  placeholder="e.g., Modern Office Renovation"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <Textarea
                  placeholder="Describe your project..."
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Budget ($)</label>
                  <Input
                    type="number"
                    placeholder="100000"
                    value={projectBudget}
                    onChange={(e) => setProjectBudget(e.target.value === '' ? '' : Number(e.target.value))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Timeline (days)</label>
                  <Input
                    type="number"
                    placeholder="90"
                    value={projectTimeline}
                    onChange={(e) => setProjectTimeline(e.target.value === '' ? '' : Number(e.target.value))}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex gap-2">
              <Button variant="outline" onClick={() => setShowNewProjectDialog(false)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={() => {
                // Project is created - just close dialog
                // In a real app, you'd save to database here
                setShowNewProjectDialog(false);
              }} className="flex-1">
                Create Project
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
}