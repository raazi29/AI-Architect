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
  Clock,
  Users,
  Building,
  Plus,
  Trash2,
  Activity,
  IndianRupee,
  Cloud,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

// Indian Rupee formatter
const formatINR = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
};

// Format in lakhs/crores
const formatIndianNumber = (num: number): string => {
  if (num >= 10000000) {
    return `₹${(num / 10000000).toFixed(2)} Cr`;
  } else if (num >= 100000) {
    return `₹${(num / 100000).toFixed(2)} L`;
  } else {
    return formatINR(num);
  }
};

interface Project {
  id: string;
  name: string;
  description: string | null;
  budget: number | null;
  state: string | null;
  city: string | null;
  climate_zone: string | null;
  project_type: string | null;
  timeline_days: number | null;
  gst_number: string | null;
  monsoon_start_date: string | null;
  monsoon_end_date: string | null;
  vastu_consultant: string | null;
}

interface Task {
  id: string;
  project_id: string;
  name: string;
  category: string | null;
  cost: number;
  duration: number | null;
  assigned_to: string | null;
  status: string;
  monsoon_dependent: boolean;
  vastu_compliant: boolean;
  permit_required: boolean;
}

interface Material {
  id: string;
  project_id: string;
  name: string;
  category: string | null;
  unit: string | null;
  unit_cost: number;
  quantity: number;
  total_cost: number;
  gst_rate: number;
  gst_amount: number;
  is_local_material: boolean;
  climate_suitable: boolean;
}

interface Expense {
  id: string;
  project_id: string;
  description: string;
  amount: number;
  category: string | null;
  expense_date: string;
  gst_applicable: boolean;
  gst_rate: number;
  gst_amount: number;
  invoice_number: string | null;
}

export default function ProjectManagementPage() {
  const [isConnected, setIsConnected] = useState(false);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  // New project form
  const [showNewProject, setShowNewProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectBudget, setNewProjectBudget] = useState('');
  const [newProjectState, setNewProjectState] = useState('');
  const [newProjectCity, setNewProjectCity] = useState('');

  // Add task form
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTaskName, setNewTaskName] = useState('');
  const [newTaskCategory, setNewTaskCategory] = useState('');
  const [newTaskCost, setNewTaskCost] = useState('');
  const [newTaskStatus, setNewTaskStatus] = useState('pending');

  // Add material form
  const [showAddMaterial, setShowAddMaterial] = useState(false);
  const [newMaterialName, setNewMaterialName] = useState('');
  const [newMaterialCategory, setNewMaterialCategory] = useState('');
  const [newMaterialUnit, setNewMaterialUnit] = useState('');
  const [newMaterialUnitCost, setNewMaterialUnitCost] = useState('');
  const [newMaterialQuantity, setNewMaterialQuantity] = useState('');
  const [newMaterialGST, setNewMaterialGST] = useState('18');

  // Add expense form
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [newExpenseDescription, setNewExpenseDescription] = useState('');
  const [newExpenseAmount, setNewExpenseAmount] = useState('');
  const [newExpenseCategory, setNewExpenseCategory] = useState('');
  const [newExpenseGST, setNewExpenseGST] = useState('18');

  // Load initial data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load latest project
      const { data: projects, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1);

      if (projectError) throw projectError;

      if (projects && projects.length > 0) {
        const project = projects[0];
        setCurrentProject(project);

        // Load tasks
        const { data: tasksData } = await supabase
          .from('tasks')
          .select('*')
          .eq('project_id', project.id);
        setTasks(tasksData || []);

        // Load materials
        const { data: materialsData } = await supabase
          .from('materials')
          .select('*')
          .eq('project_id', project.id);
        setMaterials(materialsData || []);

        // Load expenses
        const { data: expensesData } = await supabase
          .from('expenses')
          .select('*')
          .eq('project_id', project.id);
        setExpenses(expensesData || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Real-time subscriptions
  useEffect(() => {
    if (!currentProject) return;

    const channel = supabase
      .channel('project-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
          filter: `project_id=eq.${currentProject.id}`
        },
        (payload) => {
          console.log('Task change:', payload);
          if (payload.eventType === 'INSERT') {
            setTasks(prev => [...prev, payload.new as Task]);
          } else if (payload.eventType === 'DELETE') {
            setTasks(prev => prev.filter(t => t.id !== payload.old.id));
          } else if (payload.eventType === 'UPDATE') {
            setTasks(prev => prev.map(t => t.id === payload.new.id ? payload.new as Task : t));
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'materials',
          filter: `project_id=eq.${currentProject.id}`
        },
        (payload) => {
          console.log('Material change:', payload);
          if (payload.eventType === 'INSERT') {
            setMaterials(prev => [...prev, payload.new as Material]);
          } else if (payload.eventType === 'DELETE') {
            setMaterials(prev => prev.filter(m => m.id !== payload.old.id));
          } else if (payload.eventType === 'UPDATE') {
            setMaterials(prev => prev.map(m => m.id === payload.new.id ? payload.new as Material : m));
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'expenses',
          filter: `project_id=eq.${currentProject.id}`
        },
        (payload) => {
          console.log('Expense change:', payload);
          if (payload.eventType === 'INSERT') {
            setExpenses(prev => [...prev, payload.new as Expense]);
          } else if (payload.eventType === 'DELETE') {
            setExpenses(prev => prev.filter(e => e.id !== payload.old.id));
          } else if (payload.eventType === 'UPDATE') {
            setExpenses(prev => prev.map(e => e.id === payload.new.id ? payload.new as Expense : e));
          }
        }
      )
      .subscribe((status) => {
        console.log('Realtime status:', status);
        setIsConnected(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentProject]);

  // Calculate totals
  const totalTaskCost = tasks.reduce((sum, task) => sum + task.cost, 0);
  const totalMaterialCost = materials.reduce((sum, mat) => sum + mat.total_cost + mat.gst_amount, 0);
  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount + exp.gst_amount, 0);
  const totalSpent = totalTaskCost + totalMaterialCost + totalExpenses;
  const budget = currentProject?.budget || 0;
  const remaining = budget - totalSpent;
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const progress = tasks.length > 0 ? (completedTasks / tasks.length) * 100 : 0;

  // Create new project
  const createProject = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .insert({
          name: newProjectName,
          budget: parseFloat(newProjectBudget),
          state: newProjectState,
          city: newProjectCity,
          climate_zone: 'tropical',
          project_type: 'residential'
        })
        .select()
        .single();

      if (error) throw error;

      setCurrentProject(data);
      setShowNewProject(false);
      setNewProjectName('');
      setNewProjectBudget('');
      setNewProjectState('');
      setNewProjectCity('');
    } catch (error) {
      console.error('Error creating project:', error);
      alert('Error creating project. Check console.');
    }
  };

  // Add task
  const addTask = async () => {
    if (!currentProject) return;
    try {
      const { error } = await supabase
        .from('tasks')
        .insert({
          project_id: currentProject.id,
          name: newTaskName,
          category: newTaskCategory,
          cost: parseFloat(newTaskCost) || 0,
          status: newTaskStatus,
          monsoon_dependent: false,
          vastu_compliant: true,
          permit_required: false
        });

      if (error) throw error;

      setShowAddTask(false);
      setNewTaskName('');
      setNewTaskCategory('');
      setNewTaskCost('');
      setNewTaskStatus('pending');
    } catch (error) {
      console.error('Error adding task:', error);
      alert('Error adding task. Check console.');
    }
  };

  // Add material
  const addMaterial = async () => {
    if (!currentProject) return;
    try {
      const { error } = await supabase
        .from('materials')
        .insert({
          project_id: currentProject.id,
          name: newMaterialName,
          category: newMaterialCategory,
          unit: newMaterialUnit,
          unit_cost: parseFloat(newMaterialUnitCost),
          quantity: parseFloat(newMaterialQuantity),
          gst_rate: parseFloat(newMaterialGST),
          is_local_material: true,
          climate_suitable: true
        });

      if (error) throw error;

      setShowAddMaterial(false);
      setNewMaterialName('');
      setNewMaterialCategory('');
      setNewMaterialUnit('');
      setNewMaterialUnitCost('');
      setNewMaterialQuantity('');
      setNewMaterialGST('18');
    } catch (error) {
      console.error('Error adding material:', error);
      alert('Error adding material. Check console.');
    }
  };

  // Add expense
  const addExpense = async () => {
    if (!currentProject) return;
    try {
      const { error } = await supabase
        .from('expenses')
        .insert({
          project_id: currentProject.id,
          description: newExpenseDescription,
          amount: parseFloat(newExpenseAmount),
          category: newExpenseCategory,
          gst_applicable: true,
          gst_rate: parseFloat(newExpenseGST)
        });

      if (error) throw error;

      setShowAddExpense(false);
      setNewExpenseDescription('');
      setNewExpenseAmount('');
      setNewExpenseCategory('');
      setNewExpenseGST('18');
    } catch (error) {
      console.error('Error adding expense:', error);
      alert('Error adding expense. Check console.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Activity className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading project data...</p>
        </div>
      </div>
    );
  }

  if (!currentProject) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Create Your First Project</CardTitle>
              <CardDescription>Start managing your construction project with India-specific features</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Project Name</label>
                <Input
                  placeholder="e.g., Mumbai Residential Complex"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Budget (₹)</label>
                <Input
                  type="number"
                  placeholder="e.g., 10000000"
                  value={newProjectBudget}
                  onChange={(e) => setNewProjectBudget(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">State</label>
                  <Select value={newProjectState} onValueChange={setNewProjectState}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select state" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Maharashtra">Maharashtra</SelectItem>
                      <SelectItem value="Karnataka">Karnataka</SelectItem>
                      <SelectItem value="Tamil Nadu">Tamil Nadu</SelectItem>
                      <SelectItem value="Delhi">Delhi</SelectItem>
                      <SelectItem value="Gujarat">Gujarat</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">City</label>
                  <Input
                    placeholder="e.g., Mumbai"
                    value={newProjectCity}
                    onChange={(e) => setNewProjectCity(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={createProject} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Create Project
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Calculator className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <h1 className="text-3xl md:text-4xl font-bold">
                      {currentProject.name}
                    </h1>
                    <Badge variant={isConnected ? 'default' : 'secondary'} className="flex items-center gap-1.5">
                      <Activity className={`h-3 w-3 ${isConnected ? 'animate-pulse' : ''}`} />
                      {isConnected ? 'Live' : 'Offline'}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground mt-1">
                    {currentProject.city}, {currentProject.state} • Real-time Project Management
                  </p>
                </div>
              </div>
            </div>
            <Button onClick={() => setShowNewProject(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Project
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Budget</p>
                    <p className="text-2xl font-bold">{formatIndianNumber(budget)}</p>
                  </div>
                  <IndianRupee className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Spent</p>
                    <p className="text-2xl font-bold">{formatIndianNumber(totalSpent)}</p>
                  </div>
                  <Activity className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Remaining</p>
                    <p className={`text-2xl font-bold ${remaining < 0 ? 'text-red-500' : 'text-green-500'}`}>
                      {formatIndianNumber(remaining)}
                    </p>
                  </div>
                  {remaining < 0 ? (
                    <AlertCircle className="h-8 w-8 text-red-500" />
                  ) : (
                    <CheckCircle2 className="h-8 w-8 text-green-500" />
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Progress</p>
                    <p className="text-2xl font-bold">{progress.toFixed(0)}%</p>
                    <Progress value={progress} className="mt-2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="tasks" className="space-y-4">
          <TabsList>
            <TabsTrigger value="tasks">Tasks ({tasks.length})</TabsTrigger>
            <TabsTrigger value="materials">Materials ({materials.length})</TabsTrigger>
            <TabsTrigger value="expenses">Expenses ({expenses.length})</TabsTrigger>
          </TabsList>

          {/* Tasks Tab */}
          <TabsContent value="tasks">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Project Tasks</CardTitle>
                    <CardDescription>Track all construction tasks with India-specific features</CardDescription>
                  </div>
                  <Button onClick={() => setShowAddTask(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Task
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {tasks.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No tasks yet. Add tasks via SQL or API.</p>
                    <p className="text-sm mt-2">Real-time updates enabled - changes will appear automatically!</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Task Name</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Cost</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Monsoon</TableHead>
                        <TableHead>Vastu</TableHead>
                        <TableHead>Permit</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tasks.map((task) => (
                        <TableRow key={task.id}>
                          <TableCell className="font-medium">{task.name}</TableCell>
                          <TableCell>{task.category}</TableCell>
                          <TableCell>{formatINR(task.cost)}</TableCell>
                          <TableCell>
                            <Badge variant={
                              task.status === 'completed' ? 'default' :
                              task.status === 'in-progress' ? 'secondary' : 'outline'
                            }>
                              {task.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {task.monsoon_dependent && <Cloud className="h-4 w-4 text-blue-500" />}
                          </TableCell>
                          <TableCell>
                            {task.vastu_compliant && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                          </TableCell>
                          <TableCell>
                            {task.permit_required && <AlertCircle className="h-4 w-4 text-orange-500" />}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Materials Tab */}
          <TabsContent value="materials">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Construction Materials</CardTitle>
                    <CardDescription>Materials with GST calculations and climate suitability</CardDescription>
                  </div>
                  <Button onClick={() => setShowAddMaterial(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Material
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {materials.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No materials yet. Add materials via SQL or API.</p>
                    <p className="text-sm mt-2">Real-time updates enabled!</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Material</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Unit Cost</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>GST ({materials[0]?.gst_rate}%)</TableHead>
                        <TableHead>Final Amount</TableHead>
                        <TableHead>Local</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {materials.map((material) => (
                        <TableRow key={material.id}>
                          <TableCell className="font-medium">{material.name}</TableCell>
                          <TableCell>{material.category}</TableCell>
                          <TableCell>{material.quantity} {material.unit}</TableCell>
                          <TableCell>{formatINR(material.unit_cost)}</TableCell>
                          <TableCell>{formatINR(material.total_cost)}</TableCell>
                          <TableCell>{formatINR(material.gst_amount)}</TableCell>
                          <TableCell className="font-bold">
                            {formatINR(material.total_cost + material.gst_amount)}
                          </TableCell>
                          <TableCell>
                            {material.is_local_material && (
                              <Badge variant="secondary">Local</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Expenses Tab */}
          <TabsContent value="expenses">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Project Expenses</CardTitle>
                    <CardDescription>Track all expenses with GST and invoice details</CardDescription>
                  </div>
                  <Button onClick={() => setShowAddExpense(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Expense
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {expenses.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No expenses yet. Add expenses via SQL or API.</p>
                    <p className="text-sm mt-2">Real-time updates enabled!</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Description</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>GST</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Invoice</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {expenses.map((expense) => (
                        <TableRow key={expense.id}>
                          <TableCell className="font-medium">{expense.description}</TableCell>
                          <TableCell>{expense.category}</TableCell>
                          <TableCell>{new Date(expense.expense_date).toLocaleDateString('en-IN')}</TableCell>
                          <TableCell>{formatINR(expense.amount)}</TableCell>
                          <TableCell>
                            {expense.gst_applicable ? formatINR(expense.gst_amount) : '-'}
                          </TableCell>
                          <TableCell className="font-bold">
                            {formatINR(expense.amount + expense.gst_amount)}
                          </TableCell>
                          <TableCell>
                            {expense.invoice_number && (
                              <Badge variant="outline">{expense.invoice_number}</Badge>
                            )}
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
      </div>

      {/* New Project Dialog */}
      {showNewProject && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl mx-4">
            <CardHeader>
              <CardTitle>Create New Project</CardTitle>
              <CardDescription>Set up a new construction project</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Project Name</label>
                <Input
                  placeholder="e.g., Delhi Commercial Complex"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Budget (₹)</label>
                <Input
                  type="number"
                  placeholder="e.g., 50000000"
                  value={newProjectBudget}
                  onChange={(e) => setNewProjectBudget(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">State</label>
                  <Select value={newProjectState} onValueChange={setNewProjectState}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select state" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Maharashtra">Maharashtra</SelectItem>
                      <SelectItem value="Karnataka">Karnataka</SelectItem>
                      <SelectItem value="Tamil Nadu">Tamil Nadu</SelectItem>
                      <SelectItem value="Delhi">Delhi</SelectItem>
                      <SelectItem value="Gujarat">Gujarat</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">City</label>
                  <Input
                    placeholder="e.g., Mumbai"
                    value={newProjectCity}
                    onChange={(e) => setNewProjectCity(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex gap-2">
              <Button variant="outline" onClick={() => setShowNewProject(false)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={createProject} className="flex-1">
                Create Project
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}

      {/* Add Task Dialog */}
      {showAddTask && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-lg mx-4">
            <CardHeader>
              <CardTitle>Add New Task</CardTitle>
              <CardDescription>Add a construction task to your project</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Task Name</label>
                <Input
                  placeholder="e.g., Foundation Work"
                  value={newTaskName}
                  onChange={(e) => setNewTaskName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Category</label>
                <Input
                  placeholder="e.g., Construction"
                  value={newTaskCategory}
                  onChange={(e) => setNewTaskCategory(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Cost (₹)</label>
                  <Input
                    type="number"
                    placeholder="e.g., 150000"
                    value={newTaskCost}
                    onChange={(e) => setNewTaskCost(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Status</label>
                  <Select value={newTaskStatus} onValueChange={setNewTaskStatus}>
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
              </div>
            </CardContent>
            <CardFooter className="flex gap-2">
              <Button variant="outline" onClick={() => setShowAddTask(false)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={addTask} className="flex-1">
                Add Task
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}

      {/* Add Material Dialog */}
      {showAddMaterial && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-lg mx-4">
            <CardHeader>
              <CardTitle>Add New Material</CardTitle>
              <CardDescription>Add construction material with GST calculation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Material Name</label>
                <Input
                  placeholder="e.g., Portland Cement"
                  value={newMaterialName}
                  onChange={(e) => setNewMaterialName(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Category</label>
                  <Input
                    placeholder="e.g., Building Materials"
                    value={newMaterialCategory}
                    onChange={(e) => setNewMaterialCategory(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Unit</label>
                  <Input
                    placeholder="e.g., bags"
                    value={newMaterialUnit}
                    onChange={(e) => setNewMaterialUnit(e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Unit Cost (₹)</label>
                  <Input
                    type="number"
                    placeholder="350"
                    value={newMaterialUnitCost}
                    onChange={(e) => setNewMaterialUnitCost(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Quantity</label>
                  <Input
                    type="number"
                    placeholder="100"
                    value={newMaterialQuantity}
                    onChange={(e) => setNewMaterialQuantity(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">GST %</label>
                  <Input
                    type="number"
                    placeholder="18"
                    value={newMaterialGST}
                    onChange={(e) => setNewMaterialGST(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex gap-2">
              <Button variant="outline" onClick={() => setShowAddMaterial(false)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={addMaterial} className="flex-1">
                Add Material
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}

      {/* Add Expense Dialog */}
      {showAddExpense && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-lg mx-4">
            <CardHeader>
              <CardTitle>Add New Expense</CardTitle>
              <CardDescription>Record a project expense with GST</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <Input
                  placeholder="e.g., Site Survey and Soil Testing"
                  value={newExpenseDescription}
                  onChange={(e) => setNewExpenseDescription(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Category</label>
                <Input
                  placeholder="e.g., Professional Services"
                  value={newExpenseCategory}
                  onChange={(e) => setNewExpenseCategory(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Amount (₹)</label>
                  <Input
                    type="number"
                    placeholder="25000"
                    value={newExpenseAmount}
                    onChange={(e) => setNewExpenseAmount(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">GST %</label>
                  <Input
                    type="number"
                    placeholder="18"
                    value={newExpenseGST}
                    onChange={(e) => setNewExpenseGST(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex gap-2">
              <Button variant="outline" onClick={() => setShowAddExpense(false)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={addExpense} className="flex-1">
                Add Expense
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
}