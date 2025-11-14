'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { IndiaLocalizationService, ClimateZone, INDIAN_STATES } from '@/lib/services/indiaLocalizationService';
import { MaterialData, INDIAN_MATERIALS } from '@/lib/data/indianMaterials';
import { RealTimePresence } from '@/components/project-management/RealTimePresence';
import { IndianMaterialSelector } from '@/components/project-management/IndianMaterialSelector';
import { IndianCurrencyFormatter } from '@/components/project-management/IndianCurrencyFormatter';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Calculator, Plus, Trash2, Activity, Cloud, CheckCircle2, AlertCircle,
  Edit2, MapPin, Calendar, TrendingUp, FileText, Users, Building2
} from 'lucide-react';

// Types
interface Project {
  id: string;
  name: string;
  description: string | null;
  budget: number | null;
  state: string | null;
  city: string | null;
  climate_zone: ClimateZone | null;
  project_type: string | null;
  timeline_days: number | null;
  created_at: string;
}

interface Task {
  id: string;
  project_id: string;
  name: string;
  category: string | null;
  cost: number;
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
}

interface Expense {
  id: string;
  project_id: string;
  description: string;
  amount: number;
  category: string | null;
  gst_rate: number;
  gst_amount: number;
}

export default function ProjectManagementPage() {
  const [loading, setLoading] = useState(true);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  
  // Dialogs
  const [showNewProject, setShowNewProject] = useState(false);
  const [showProjectList, setShowProjectList] = useState(false);
  const [showAddTask, setShowAddTask] = useState(false);
  const [showMaterialSelector, setShowMaterialSelector] = useState(false);
  const [showAddExpense, setShowAddExpense] = useState(false);
  
  // Form states
  const [projectForm, setProjectForm] = useState({ name: '', budget: '', state: '', city: '', climateZone: 'tropical' as ClimateZone, projectType: 'residential' });
  const [taskForm, setTaskForm] = useState({ name: '', category: '', cost: '', status: 'pending', monsoonDependent: false, vastuCompliant: true, permitRequired: false });
  const [expenseForm, setExpenseForm] = useState({ description: '', amount: '', category: '', gstRate: '18' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      console.log('📊 Loading projects from database...');
      setLoading(true);
      
      const { data: projects, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });
      
      console.log('📥 Projects loaded:', { count: projects?.length || 0, error });

      if (error) {
        console.error('❌ Error loading projects:', error);
        alert(`Error loading projects: ${error.message}\n\nThis usually means:\n1. Tables don't exist - Run SETUP_DATABASE.sql\n2. RLS is blocking - Disable RLS\n3. Wrong credentials - Check .env file`);
        setLoading(false);
        return;
      }

      setAllProjects(projects || []);
      console.log(`✅ Loaded ${projects?.length || 0} projects`);
      
      if (projects && projects.length > 0) {
        console.log('🎯 Setting current project:', projects[0].name);
        setCurrentProject(projects[0]);
        await loadProjectData(projects[0].id);
      } else {
        console.log('ℹ️ No projects found - showing create form');
        setCurrentProject(null);
      }
    } catch (error: any) {
      console.error('❌ Exception loading projects:', error);
      alert(`Failed to load projects.\n\nError: ${error.message || 'Unknown error'}\n\nCheck console for details.`);
    } finally {
      setLoading(false);
    }
  };

  const loadProjectData = async (projectId: string) => {
    console.log('📦 Loading project data for:', projectId);
    
    const [tasksRes, materialsRes, expensesRes] = await Promise.all([
      supabase.from('tasks').select('*').eq('project_id', projectId),
      supabase.from('materials').select('*').eq('project_id', projectId),
      supabase.from('expenses').select('*').eq('project_id', projectId),
    ]);
    
    console.log('📦 Loaded data:', {
      tasks: tasksRes.data?.length || 0,
      materials: materialsRes.data?.length || 0,
      expenses: expensesRes.data?.length || 0
    });
    
    if (tasksRes.data) console.log('📋 Tasks:', tasksRes.data);
    if (materialsRes.data) console.log('🧱 Materials:', materialsRes.data);
    if (expensesRes.data) console.log('💸 Expenses:', expensesRes.data);
    
    setTasks(tasksRes.data || []);
    setMaterials(materialsRes.data || []);
    setExpenses(expensesRes.data || []);
  };

  // Real-time
  useEffect(() => {
    if (!currentProject) return;
    const channel = supabase.channel(`project:${currentProject.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks', filter: `project_id=eq.${currentProject.id}` }, () => loadProjectData(currentProject.id))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'materials', filter: `project_id=eq.${currentProject.id}` }, () => loadProjectData(currentProject.id))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'expenses', filter: `project_id=eq.${currentProject.id}` }, () => loadProjectData(currentProject.id))
      .subscribe((status) => setIsConnected(status === 'SUBSCRIBED'));
    return () => { supabase.removeChannel(channel); };
  }, [currentProject]);

  // CRUD operations
  const createProject = async () => {
    try {
      console.log('🚀 Creating project with data:', projectForm);
      
      if (!projectForm.name || !projectForm.budget) {
        alert('Please fill in project name and budget');
        return;
      }

      const projectData = {
        name: projectForm.name,
        budget: parseFloat(projectForm.budget),
        state: projectForm.state || null,
        city: projectForm.city || null,
        climate_zone: projectForm.climateZone,
        project_type: projectForm.projectType
      };

      console.log('📤 Sending to Supabase:', projectData);

      const { data, error } = await supabase
        .from('projects')
        .insert(projectData)
        .select()
        .single();

      console.log('📥 Supabase response:', { data, error });

      if (error) {
        console.error('❌ Error creating project:', error);
        alert(`Error creating project: ${error.message}\n\nDetails: ${error.details || 'No details'}\n\nHint: ${error.hint || 'No hint'}`);
        return;
      }

      if (data) {
        console.log('✅ Project created successfully:', data);
        
        // Update state immediately
        setCurrentProject(data);
        setAllProjects(prev => [data, ...prev]);
        
        // Clear form and close dialog
        setProjectForm({ name: '', budget: '', state: '', city: '', climateZone: 'tropical', projectType: 'residential' });
        setShowNewProject(false);
        
        // Load project data
        await loadProjectData(data.id);
        
        // Reload all projects to ensure consistency
        await loadData();
        alert('Project created successfully! ✅');
      }
    } catch (error: any) {
      console.error('❌ Exception creating project:', error);
      alert(`Failed to create project.\n\nError: ${error.message || 'Unknown error'}\n\nCheck console for details.`);
    }
  };

  const addTask = async () => {
    if (!currentProject) return;
    try {
      if (!taskForm.name) {
        alert('Please enter task name');
        return;
      }

      const { error } = await supabase.from('tasks').insert({
        project_id: currentProject.id,
        name: taskForm.name,
        category: taskForm.category || 'general',
        cost: parseFloat(taskForm.cost) || 0,
        status: taskForm.status,
        monsoon_dependent: taskForm.monsoonDependent,
        vastu_compliant: taskForm.vastuCompliant,
        permit_required: taskForm.permitRequired
      });

      if (error) {
        console.error('Error adding task:', error);
        alert(`Error adding task: ${error.message}`);
        return;
      }

      setShowAddTask(false);
      setTaskForm({ name: '', category: '', cost: '', status: 'pending', monsoonDependent: false, vastuCompliant: true, permitRequired: false });
    } catch (error) {
      console.error('Error adding task:', error);
      alert('Failed to add task. Please check console for details.');
    }
  };

  const addMaterialFromSelector = async (material: MaterialData) => {
    if (!currentProject) return;
    try {
      const quantity = 1;
      const totalCost = material.basePrice * quantity;
      const gstCalc = IndiaLocalizationService.calculateGST(totalCost, material.category);
      
      const { error } = await supabase.from('materials').insert({
        project_id: currentProject.id,
        name: material.name,
        category: material.category,
        unit: material.unit,
        unit_cost: material.basePrice,
        quantity,
        total_cost: totalCost,
        gst_rate: gstCalc.gstRate,
        gst_amount: gstCalc.gstAmount,
        is_local_material: material.localAvailability.includes(currentProject.state?.substring(0, 2).toUpperCase() || ''),
        climate_suitable: material.climateZones.includes(currentProject.climate_zone || 'tropical')
      });

      if (error) {
        console.error('Error adding material:', error);
        alert(`Error adding material: ${error.message}`);
        return;
      }

      setShowMaterialSelector(false);
    } catch (error) {
      console.error('Error adding material:', error);
      alert('Failed to add material. Please check console for details.');
    }
  };

  const addExpense = async () => {
    if (!currentProject) return;
    try {
      if (!expenseForm.description || !expenseForm.amount) {
        alert('Please fill in description and amount');
        return;
      }

      const amount = parseFloat(expenseForm.amount);
      const gstCalc = IndiaLocalizationService.calculateGST(amount, expenseForm.category || 'default');
      
      const { error } = await supabase.from('expenses').insert({
        project_id: currentProject.id,
        description: expenseForm.description,
        amount,
        category: expenseForm.category || 'miscellaneous',
        gst_applicable: true,
        gst_rate: gstCalc.gstRate,
        gst_amount: gstCalc.gstAmount,
        expense_date: new Date().toISOString()
      });

      if (error) {
        console.error('Error adding expense:', error);
        alert(`Error adding expense: ${error.message}`);
        return;
      }

      setShowAddExpense(false);
      setExpenseForm({ description: '', amount: '', category: '', gstRate: '18' });
    } catch (error) {
      console.error('Error adding expense:', error);
      alert('Failed to add expense. Please check console for details.');
    }
  };

  const deleteTask = async (id: string) => {
    if (confirm('Delete this task?')) await supabase.from('tasks').delete().eq('id', id);
  };

  const deleteMaterial = async (id: string) => {
    if (confirm('Delete this material?')) await supabase.from('materials').delete().eq('id', id);
  };

  const deleteExpense = async (id: string) => {
    if (confirm('Delete this expense?')) await supabase.from('expenses').delete().eq('id', id);
  };

  const switchProject = async (projectId: string) => {
    try {
      console.log('🔄 Switching to project:', projectId);
      
      const project = allProjects.find(p => p.id === projectId);
      
      if (!project) {
        console.error('❌ Project not found in allProjects:', projectId);
        alert('Project not found. Reloading projects...');
        await loadData();
        return;
      }
      
      console.log('📂 Found project:', project.name);
      
      // Update current project
      setCurrentProject(project);
      
      // Clear existing data
      setTasks([]);
      setMaterials([]);
      setExpenses([]);
      
      // Load new project data
      await loadProjectData(projectId);
      
      // Close dialog
      setShowProjectList(false);
      
      console.log('✅ Switched to project:', project.name);
    } catch (error: any) {
      console.error('❌ Error switching project:', error);
      alert(`Failed to switch project: ${error.message}`);
    }
  };

  // Calculations - ensure all values are numbers
  const totalTaskCost = tasks.reduce((sum, t) => sum + (Number(t.cost) || 0), 0);
  const totalMaterialCost = materials.reduce((sum, m) => {
    const total = Number(m.total_cost) || 0;
    const gst = Number(m.gst_amount) || 0;
    return sum + total + gst;
  }, 0);
  const totalExpenses = expenses.reduce((sum, e) => {
    const amount = Number(e.amount) || 0;
    const gst = Number(e.gst_amount) || 0;
    return sum + amount + gst;
  }, 0);
  const totalSpent = totalTaskCost + totalMaterialCost + totalExpenses;
  const budget = Number(currentProject?.budget) || 0;
  const remaining = budget - totalSpent;
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const progress = tasks.length > 0 ? (completedTasks / tasks.length) * 100 : 0;

  // Debug logging
  console.log('💰 Calculations:', {
    totalTaskCost,
    totalMaterialCost,
    totalExpenses,
    totalSpent,
    budget,
    remaining,
    tasksCount: tasks.length,
    materialsCount: materials.length,
    expensesCount: expenses.length
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Activity className="h-8 w-8 animate-spin" />
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
              <CardDescription>Start with India-specific project management</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Project Name</Label>
                <Input value={projectForm.name} onChange={(e) => setProjectForm({...projectForm, name: e.target.value})} placeholder="Mumbai Residential Complex" />
              </div>
              <div>
                <Label>Budget (₹)</Label>
                <Input type="number" value={projectForm.budget} onChange={(e) => setProjectForm({...projectForm, budget: e.target.value})} placeholder="10000000" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>State</Label>
                  <Select value={projectForm.state} onValueChange={(v) => setProjectForm({...projectForm, state: v})}>
                    <SelectTrigger><SelectValue placeholder="Select state" /></SelectTrigger>
                    <SelectContent>
                      {INDIAN_STATES.map(s => <SelectItem key={s.code} value={s.name}>{s.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>City</Label>
                  <Input value={projectForm.city} onChange={(e) => setProjectForm({...projectForm, city: e.target.value})} placeholder="Mumbai" />
                </div>
              </div>
              <Button onClick={createProject} className="w-full"><Plus className="h-4 w-4 mr-2" />Create Project</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Calculator className="h-8 w-8 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold">{currentProject.name}</h1>
                <Badge variant={isConnected ? 'default' : 'secondary'}>
                  <Activity className={`h-3 w-3 mr-1 ${isConnected ? 'animate-pulse' : ''}`} />
                  {isConnected ? 'Live' : 'Offline'}
                </Badge>
              </div>
              <div className="flex items-center gap-2 mt-1 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>{currentProject.city}, {currentProject.state}</span>
                {currentProject.climate_zone && (
                  <>
                    <span>•</span>
                    <Cloud className="h-4 w-4" />
                    <span className="capitalize">{currentProject.climate_zone} Zone</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <RealTimePresence projectId={currentProject.id} />
            {allProjects.length > 1 && (
              <Button variant="outline" onClick={() => setShowProjectList(true)}>
                <Building2 className="h-4 w-4 mr-2" />
                Switch Project
              </Button>
            )}
            <Button onClick={() => setShowNewProject(true)}><Plus className="h-4 w-4 mr-2" />New Project</Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <IndianCurrencyFormatter amount={budget} label="Total Budget" variant="card" compact />
          <IndianCurrencyFormatter amount={totalSpent} label="Total Spent" variant="card" compact />
          <IndianCurrencyFormatter amount={remaining} label="Remaining" variant="card" compact trend={remaining < 0 ? 'down' : 'up'} />
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Progress</p>
              <p className="text-3xl font-bold">{progress.toFixed(0)}%</p>
              <Progress value={progress} className="mt-2" />
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="tasks">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="tasks">Tasks ({tasks.length})</TabsTrigger>
            <TabsTrigger value="materials">Materials ({materials.length})</TabsTrigger>
            <TabsTrigger value="expenses">Expenses ({expenses.length})</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="tasks">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Project Tasks</CardTitle>
                    <CardDescription>India-specific task management</CardDescription>
                  </div>
                  <Button onClick={() => setShowAddTask(true)}><Plus className="h-4 w-4 mr-2" />Add Task</Button>
                </div>
              </CardHeader>
              <CardContent>
                {tasks.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No tasks yet. Click &quot;Add Task&quot; to get started.</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Task</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Cost</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Flags</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tasks.map(task => (
                        <TableRow key={task.id}>
                          <TableCell className="font-medium">{task.name}</TableCell>
                          <TableCell>{task.category}</TableCell>
                          <TableCell><IndianCurrencyFormatter amount={task.cost} variant="inline" compact /></TableCell>
                          <TableCell>
                            <Badge variant={task.status === 'completed' ? 'default' : 'outline'}>{task.status}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              {task.monsoon_dependent && <Cloud className="h-4 w-4 text-blue-500" title="Monsoon Dependent" />}
                              {task.vastu_compliant && <CheckCircle2 className="h-4 w-4 text-green-500" title="Vastu Compliant" />}
                              {task.permit_required && <AlertCircle className="h-4 w-4 text-orange-500" title="Permit Required" />}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm" onClick={() => deleteTask(task.id)}><Trash2 className="h-4 w-4" /></Button>
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
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Construction Materials</CardTitle>
                    <CardDescription>Climate-optimized materials with GST</CardDescription>
                  </div>
                  <Button onClick={() => setShowMaterialSelector(true)}><Plus className="h-4 w-4 mr-2" />Add Material</Button>
                </div>
              </CardHeader>
              <CardContent>
                {materials.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No materials yet. Use the material selector to add climate-appropriate materials.</p>
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
                        <TableHead>GST</TableHead>
                        <TableHead>Final</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {materials.map(material => (
                        <TableRow key={material.id}>
                          <TableCell className="font-medium">
                            {material.name}
                            {material.is_local_material && <Badge variant="secondary" className="ml-2 text-xs">Local</Badge>}
                          </TableCell>
                          <TableCell>{material.category}</TableCell>
                          <TableCell>{material.quantity} {material.unit}</TableCell>
                          <TableCell><IndianCurrencyFormatter amount={material.unit_cost} variant="inline" compact /></TableCell>
                          <TableCell><IndianCurrencyFormatter amount={material.total_cost} variant="inline" compact /></TableCell>
                          <TableCell>
                            <Badge variant="outline">{material.gst_rate}%</Badge>
                            <div className="text-xs text-muted-foreground">
                              {IndiaLocalizationService.formatCurrency(material.gst_amount, { compact: true })}
                            </div>
                          </TableCell>
                          <TableCell><IndianCurrencyFormatter amount={material.total_cost + material.gst_amount} variant="inline" compact /></TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm" onClick={() => deleteMaterial(material.id)}><Trash2 className="h-4 w-4" /></Button>
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
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Project Expenses</CardTitle>
                    <CardDescription>Track expenses with GST compliance</CardDescription>
                  </div>
                  <Button onClick={() => setShowAddExpense(true)}><Plus className="h-4 w-4 mr-2" />Add Expense</Button>
                </div>
              </CardHeader>
              <CardContent>
                {expenses.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No expenses recorded yet.</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Description</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>GST</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {expenses.map(expense => (
                        <TableRow key={expense.id}>
                          <TableCell className="font-medium">{expense.description}</TableCell>
                          <TableCell>{expense.category}</TableCell>
                          <TableCell><IndianCurrencyFormatter amount={expense.amount} variant="inline" compact /></TableCell>
                          <TableCell>
                            <Badge variant="outline">{expense.gst_rate}%</Badge>
                            <div className="text-xs text-muted-foreground">
                              {IndiaLocalizationService.formatCurrency(expense.gst_amount, { compact: true })}
                            </div>
                          </TableCell>
                          <TableCell><IndianCurrencyFormatter amount={expense.amount + expense.gst_amount} variant="inline" compact /></TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm" onClick={() => deleteExpense(expense.id)}><Trash2 className="h-4 w-4" /></Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports">
            <Card>
              <CardHeader>
                <CardTitle>Project Reports</CardTitle>
                <CardDescription>Cost analysis and GST breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Task Costs</p>
                      <p className="text-2xl font-bold">{IndiaLocalizationService.formatCurrency(totalTaskCost, { compact: true })}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Material Costs</p>
                      <p className="text-2xl font-bold">{IndiaLocalizationService.formatCurrency(totalMaterialCost, { compact: true })}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Other Expenses</p>
                      <p className="text-2xl font-bold">{IndiaLocalizationService.formatCurrency(totalExpenses, { compact: true })}</p>
                    </div>
                  </div>
                  <div className="pt-4 border-t">
                    <p className="text-sm text-muted-foreground mb-2">Total GST Collected</p>
                    <p className="text-3xl font-bold text-primary">
                      {IndiaLocalizationService.formatCurrency(
                        materials.reduce((sum, m) => sum + m.gst_amount, 0) + 
                        expenses.reduce((sum, e) => sum + e.gst_amount, 0),
                        { compact: true }
                      )}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
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
                  onChange={(e) => setProjectForm({...projectForm, name: e.target.value})} 
                  placeholder="Mumbai Residential Complex" 
                />
              </div>
              <div>
                <Label>Budget (₹) *</Label>
                <Input 
                  type="number" 
                  value={projectForm.budget} 
                  onChange={(e) => setProjectForm({...projectForm, budget: e.target.value})} 
                  placeholder="10000000" 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>State</Label>
                  <Select value={projectForm.state} onValueChange={(v) => setProjectForm({...projectForm, state: v})}>
                    <SelectTrigger><SelectValue placeholder="Select state" /></SelectTrigger>
                    <SelectContent>
                      {INDIAN_STATES.map(s => (
                        <SelectItem key={s.code} value={s.name}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>City</Label>
                  <Input 
                    value={projectForm.city} 
                    onChange={(e) => setProjectForm({...projectForm, city: e.target.value})} 
                    placeholder="Mumbai" 
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Climate Zone</Label>
                  <Select value={projectForm.climateZone} onValueChange={(v) => setProjectForm({...projectForm, climateZone: v as ClimateZone})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tropical">Tropical</SelectItem>
                      <SelectItem value="subtropical">Subtropical</SelectItem>
                      <SelectItem value="mountain">Mountain</SelectItem>
                      <SelectItem value="arid">Arid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Project Type</Label>
                  <Select value={projectForm.projectType} onValueChange={(v) => setProjectForm({...projectForm, projectType: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="residential">Residential</SelectItem>
                      <SelectItem value="commercial">Commercial</SelectItem>
                      <SelectItem value="industrial">Industrial</SelectItem>
                      <SelectItem value="infrastructure">Infrastructure</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowNewProject(false)}>Cancel</Button>
              <Button onClick={createProject}>
                <Plus className="h-4 w-4 mr-2" />
                Create Project
              </Button>
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
                <Label>Task Name</Label>
                <Input value={taskForm.name} onChange={(e) => setTaskForm({...taskForm, name: e.target.value})} placeholder="Foundation work" />
              </div>
              <div>
                <Label>Category</Label>
                <Select value={taskForm.category} onValueChange={(v) => setTaskForm({...taskForm, category: v})}>
                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    {IndiaLocalizationService.getTaskCategories().map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>{cat.icon} {cat.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Cost (₹)</Label>
                <Input type="number" value={taskForm.cost} onChange={(e) => setTaskForm({...taskForm, cost: e.target.value})} placeholder="50000" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox checked={taskForm.monsoonDependent} onCheckedChange={(c) => setTaskForm({...taskForm, monsoonDependent: !!c})} />
                  <Label>Monsoon Dependent</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox checked={taskForm.vastuCompliant} onCheckedChange={(c) => setTaskForm({...taskForm, vastuCompliant: !!c})} />
                  <Label>Vastu Compliant</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox checked={taskForm.permitRequired} onCheckedChange={(c) => setTaskForm({...taskForm, permitRequired: !!c})} />
                  <Label>Permit Required</Label>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddTask(false)}>Cancel</Button>
              <Button onClick={addTask}>Add Task</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={showMaterialSelector} onOpenChange={setShowMaterialSelector}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Select Construction Material</DialogTitle>
            </DialogHeader>
            <IndianMaterialSelector
              climateZone={currentProject.climate_zone || 'tropical'}
              stateCode={currentProject.state?.substring(0, 2)}
              onMaterialSelect={addMaterialFromSelector}
            />
          </DialogContent>
        </Dialog>

        <Dialog open={showAddExpense} onOpenChange={setShowAddExpense}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Expense</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Description</Label>
                <Input value={expenseForm.description} onChange={(e) => setExpenseForm({...expenseForm, description: e.target.value})} placeholder="Labor payment" />
              </div>
              <div>
                <Label>Category</Label>
                <Select value={expenseForm.category} onValueChange={(v) => setExpenseForm({...expenseForm, category: v})}>
                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    {IndiaLocalizationService.getExpenseCategories().map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>{cat.label} (GST {cat.gstRate}%)</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Amount (₹)</Label>
                <Input type="number" value={expenseForm.amount} onChange={(e) => setExpenseForm({...expenseForm, amount: e.target.value})} placeholder="25000" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddExpense(false)}>Cancel</Button>
              <Button onClick={addExpense}>Add Expense</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={showProjectList} onOpenChange={setShowProjectList}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Switch Project</DialogTitle>
            </DialogHeader>
            <div className="space-y-2">
              {allProjects.map(project => (
                <Card 
                  key={project.id} 
                  className={`cursor-pointer hover:border-primary transition-colors ${project.id === currentProject?.id ? 'border-primary' : ''}`}
                  onClick={() => switchProject(project.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">{project.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {project.city}, {project.state}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">
                          {IndiaLocalizationService.formatCurrency(project.budget || 0, { compact: true })}
                        </p>
                        {project.climate_zone && (
                          <Badge variant="secondary" className="text-xs capitalize">
                            {project.climate_zone}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
