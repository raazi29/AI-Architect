'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
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
  UserPlus,
  MessageSquare,
  Activity,
  IndianRupee,
  Calendar,
  MapPin,
  Phone,
  Mail,
  Factory,
  LandPlot,
  HardHat,
  Construction,
  Home,
  Building2,
  Ruler,
  Hammer,
  Palette,
  TreePine,
  Sun,
  Mountain,
  Waves
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { 
  projectTaskService, 
  materialService, 
  expenseService, 
  projectMemberService, 
  milestoneService, 
  userPresenceService,
  subscribeToProjectChanges,
  ProjectTask,
  Material,
  Expense,
  ProjectMember,
  ProjectMilestone,
  UserPresence
} from '@/lib/projectManagementService';

interface ProjectMember {
  id: string;
  user_id: string;
  username: string;
  email: string;
  phone: string;
  role: string;
  joined_at: string;
}

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
  created_by: string;
  updated_at: string;
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
  created_by: string;
}

interface ProjectMilestone {
  id: string;
  name: string;
  targetDate: string;
  completed: boolean;
  budget: number;
  actualCost: number;
}

interface UserPresence {
  user_id: string;
  username: string;
  status: string;
  last_seen: string;
}

interface Project {
  id: string;
  name: string;
  description: string;
  budget: number;
  location: string;
  timeline: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export default function ProjectManagementPage() {
  // State for project details
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [projectBudget, setProjectBudget] = useState<number | ''>('');
  const [projectTimeline, setProjectTimeline] = useState<number | ''>('');
  const [projectLocation, setProjectLocation] = useState(''); // India-specific field for location
  const [projectType, setProjectType] = useState('residential'); // India-specific: residential, commercial, industrial
  const [climateZone, setClimateZone] = useState('tropical'); // India-specific: tropical, subtropical, mountain
  const [localMaterials, setLocalMaterials] = useState<string[]>([]); // India-specific local materials
  
  // State for tasks (initial with sample data)
  const [tasks, setTasks] = useState<ProjectTask[]>([
    {
      id: '1',
      project_id: 'project1',
      name: 'Foundation Work',
      category: 'Construction',
      cost: 1500000, // Cost in INR
      duration: 10,
      assigned_to: 'Ramesh Contractor',
      status: 'completed',
      start_date: '2024-01-01',
      end_date: '2024-01-10',
      created_by: 'user1',
      updated_at: new Date().toISOString()
    },
    {
      id: '2',
      project_id: 'project1',
      name: 'Framing',
      category: 'Construction',
      cost: 2500000,
      duration: 15,
      assigned_to: 'Mukesh Builders',
      status: 'in-progress',
      start_date: '2024-01-11',
      end_date: '2024-01-25',
      created_by: 'user2',
      updated_at: new Date().toISOString()
    },
    {
      id: '3',
      project_id: 'project1',
      name: 'Electrical Work',
      category: 'Electrical',
      cost: 1200000,
      duration: 12,
      assigned_to: 'Suresh Electric',
      status: 'pending',
      start_date: '2024-01-26',
      end_date: '2024-02-06',
      created_by: 'user3',
      updated_at: new Date().toISOString()
    }
  ]);
  
  // State for materials
  const [materials, setMaterials] = useState<Material[]>([
    {
      id: '1',
      project_id: 'project1',
      name: 'Cement (OPC 53 Grade)',
      category: 'Building Materials',
      unit: 'bag',
      unit_cost: 400,
      quantity: 500,
      total_cost: 200000,
      created_by: 'user1',
      updated_at: new Date().toISOString()
    },
    {
      id: '2',
      project_id: 'project1',
      name: 'TMT Steel Rods',
      category: 'Building Materials',
      unit: 'kg',
      unit_cost: 75,
      quantity: 2000,
      total_cost: 150000,
      created_by: 'user1',
      updated_at: new Date().toISOString()
    },
    {
      id: '3',
      project_id: 'project1',
      name: 'Premium Wood Planks',
      category: 'Finishing Materials',
      unit: 'piece',
      unit_cost: 800,
      quantity: 100,
      total_cost: 80000,
      created_by: 'user1',
      updated_at: new Date().toISOString()
    }
  ]);
  
  // State for expenses
  const [expenses, setExpenses] = useState<Expense[]>([
    {
      id: '1',
      project_id: 'project1',
      name: 'Municipal Permit',
      category: 'Legal',
      amount: 50000,
      date: '2024-01-05',
      notes: 'Building permit and inspection fees',
      created_by: 'user1'
    },
    {
      id: '2',
      project_id: 'project1',
      name: 'Architect Consultation',
      category: 'Professional',
      amount: 150000,
      date: '2024-01-10',
      notes: 'Architect consultation and design approval',
      created_by: 'user2'
    }
  ]);
  
  // State for milestones
  const [milestones, setMilestones] = useState<ProjectMilestone[]>([
    {
      id: '1',
      project_id: 'project1',
      name: 'Foundation Complete',
      target_date: '2024-01-10',
      completed: true,
      budget: 1500000,
      actual_cost: 1500000,
      created_by: 'user1',
      updated_at: new Date().toISOString()
    },
    {
      id: '2',
      project_id: 'project1',
      name: 'Framing Complete',
      target_date: '2024-01-25',
      completed: false,
      budget: 2500000,
      actual_cost: 0,
      created_by: 'user1',
      updated_at: new Date().toISOString()
    },
    {
      id: '3',
      project_id: 'project1',
      name: 'Electrical Complete',
      target_date: '2024-02-06',
      completed: false,
      budget: 1200000,
      actual_cost: 0,
      created_by: 'user1',
      updated_at: new Date().toISOString()
    }
  ]);
  
  // State for members
  const [members, setMembers] = useState<ProjectMember[]>([
    { id: '1', project_id: 'project1', user_id: 'user1', username: 'Designer1', email: 'designer@example.com', phone: '+91-9876543210', role: 'owner', joined_at: '2024-01-01' },
    { id: '2', project_id: 'project1', user_id: 'user2', username: 'Contractor1', email: 'contractor@example.com', phone: '+91-9876543211', role: 'editor', joined_at: '2024-01-02' },
    { id: '3', project_id: 'project1', user_id: 'user3', username: 'Engineer1', email: 'engineer@example.com', phone: '+91-9876543212', role: 'editor', joined_at: '2024-01-03' },
  ]);
  
  // State for form inputs
  const [newTask, setNewTask] = useState({
    name: '',
    category: 'Construction',
    cost: '' as string | number,
    duration: '' as string | number,
    assigned_to: '',
    start_date: '',
    end_date: ''
  });
  
  const [newMaterial, setNewMaterial] = useState({
    name: '',
    category: 'Building Materials',
    unit: 'unit',
    unit_cost: '' as string | number,
    quantity: '' as string | number
  });
  
  const [newExpense, setNewExpense] = useState({
    name: '',
    category: 'General',
    amount: '' as string | number,
    date: '',
    notes: ''
  });
  
  // State for real-time features
  const [userPresence, setUserPresence] = useState<UserPresence[]>([]);
  const [activeUsers, setActiveUsers] = useState<number>(0);
  const [isOnline, setIsOnline] = useState(false);
  const [unsubscribe, setUnsubscribe] = useState<(() => void) | null>(null);

  // Calculate totals
  const totalTaskCost = tasks.reduce((sum, task) => sum + task.cost, 0);
  const totalMaterialCost = materials.reduce((sum, material) => sum + material.total_cost, 0);
  const totalExpenseCost = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const totalProjectCost = totalTaskCost + totalMaterialCost + totalExpenseCost;
  const projectBudgetNum = typeof projectBudget === 'number' ? projectBudget : 0;
  const budgetRemaining = projectBudgetNum - totalProjectCost;
  
  // Calculate project progress
  const completedTasks = tasks.filter(task => task.status === 'completed').length;
  const totalTasks = tasks.length;
  const projectProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  
  // Calculate milestone progress
  const completedMilestones = milestones.filter(m => m.completed).length;
  const totalMilestones = milestones.length;
  const milestoneProgress = totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0;

  // Add new task using service
  const addTask = async () => {
    if (newTask.name && newTask.cost !== '' && newTask.duration !== '' && newTask.start_date && newTask.end_date) {
      try {
        const taskData = {
          project_id: 'project1', // This should be the actual project ID
          name: newTask.name,
          category: newTask.category,
          cost: Number(newTask.cost),
          duration: Number(newTask.duration),
          assigned_to: newTask.assigned_to,
          status: 'pending',
          start_date: newTask.start_date,
          end_date: newTask.end_date,
        };
        
        const newTaskItem = await projectTaskService.createTask(taskData);
        setTasks([...tasks, newTaskItem]);
        
        // Reset form
        setNewTask({
          name: '',
          category: 'Construction',
          cost: '',
          duration: '',
          assigned_to: '',
          start_date: '',
          end_date: ''
        });
      } catch (error) {
        console.error('Error adding task:', error);
      }
    }
  };

  // Add new material using service
  const addMaterial = async () => {
    if (newMaterial.name && newMaterial.unit_cost !== '' && newMaterial.quantity !== '') {
      try {
        const materialData = {
          project_id: 'project1', // This should be the actual project ID
          name: newMaterial.name,
          category: newMaterial.category,
          unit: newMaterial.unit,
          unit_cost: Number(newMaterial.unit_cost),
          quantity: Number(newMaterial.quantity),
        };
        
        const newMaterialItem = await materialService.createMaterial(materialData);
        setMaterials([...materials, newMaterialItem]);
        
        // Reset form
        setNewMaterial({
          name: '',
          category: 'Building Materials',
          unit: 'unit',
          unit_cost: '',
          quantity: ''
        });
      } catch (error) {
        console.error('Error adding material:', error);
      }
    }
  };

  // Add new expense using service
  const addExpense = async () => {
    if (newExpense.name && newExpense.amount !== '' && newExpense.date) {
      try {
        const expenseData = {
          project_id: 'project1', // This should be the actual project ID
          name: newExpense.name,
          category: newExpense.category,
          amount: Number(newExpense.amount),
          date: newExpense.date,
          notes: newExpense.notes,
        };
        
        const newExpenseItem = await expenseService.createExpense(expenseData);
        setExpenses([...expenses, newExpenseItem]);
        
        // Reset form
        setNewExpense({
          name: '',
          category: 'General',
          amount: '',
          date: '',
          notes: ''
        });
      } catch (error) {
        console.error('Error adding expense:', error);
      }
    }
  };

  // Remove item functions using service
  const removeTask = async (id: string) => {
    try {
      await projectTaskService.deleteTask(id, 'project1'); // project1 should be actual project ID
      setTasks(tasks.filter(task => task.id !== id));
    } catch (error) {
      console.error('Error removing task:', error);
    }
  };

  const removeMaterial = async (id: string) => {
    try {
      await materialService.deleteMaterial(id, 'project1'); // project1 should be actual project ID
      setMaterials(materials.filter(material => material.id !== id));
    } catch (error) {
      console.error('Error removing material:', error);
    }
  };

  const removeExpense = async (id: string) => {
    try {
      await expenseService.deleteExpense(id, 'project1'); // project1 should be actual project ID
      setExpenses(expenses.filter(expense => expense.id !== id));
    } catch (error) {
      console.error('Error removing expense:', error);
    }
  };

  // Initialize India-specific features
  useEffect(() => {
    // Set default project location to India
    setProjectLocation('Mumbai, India');
    
    // Set sample project details with Indian context
    setProjectName('Modern Residential Complex');
    setProjectDescription('A modern residential complex with eco-friendly features, designed for the Indian climate and lifestyle.');
    setProjectBudget(15000000); // 1.5 Cr INR
    setProjectTimeline(270); // 9 months
    
    // Set India-specific defaults
    setProjectType('residential');
    setClimateZone('tropical');
    setLocalMaterials(['Laterite Stone', 'Red Bricks', 'Teak Wood', 'Indian Marble']);
  }, []);

  // Initialize real-time subscriptions
  useEffect(() => {
    const projectId = 'project1'; // This should be the actual project ID
    
    const unsubscribeFn = subscribeToProjectChanges(
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
      (payload) => {
        if (payload.eventType === 'INSERT') {
          setMembers(prev => [...prev, payload.new as ProjectMember]);
        } else if (payload.eventType === 'UPDATE') {
          setMembers(prev => prev.map(member => 
            member.id === payload.new.id ? payload.new as ProjectMember : member
          ));
        } else if (payload.eventType === 'DELETE') {
          setMembers(prev => prev.filter(member => member.id !== payload.old.id));
        }
      },
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
          setActiveUsers(prev => prev + 1);
        } else if (payload.eventType === 'DELETE') {
          setUserPresence(prev => prev.filter(p => p.user_id !== payload.old.user_id));
          setActiveUsers(prev => Math.max(0, prev - 1));
        }
      }
    );
    
    setUnsubscribe(() => unsubscribeFn);
    
    // Cleanup function
    return () => {
      if (unsubscribeFn) {
        unsubscribeFn();
      }
    };
  }, []);

  // Format currency for India (INR) with proper formatting
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Format date for Indian format (DD/MM/YYYY)
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN'); // Indian date format
  };

  // India-specific functions
  const getLocalMaterialSuggestions = () => {
    const climateSpecificMaterials = {
      tropical: ['Laterite Stone', 'Red Bricks', 'Teak Wood', 'Indian Marble'],
      subtropical: ['Slate Stone', 'Cement Bricks', 'Deodar Wood', 'Kota Stone'],
      mountain: ['Shingle Stone', 'Pine Wood', 'Sandstone', 'Local Marble']
    };
    
    return climateSpecificMaterials[climateZone as keyof typeof climateSpecificMaterials] || [];
  };

  const getClimateSpecificTips = () => {
    const tips: Record<string, string> = {
      tropical: 'Consider monsoon season during construction. Use materials that resist moisture.',
      subtropical: 'Plan for temperature variations between seasons. Good ventilation is crucial.',
      mountain: 'Account for potential landslides. Insulation is important for temperature control.'
    };
    
    return tips[climateZone] || '';
  };

  // Project type specific categories
  const getTaskCategories = () => {
    if (projectType === 'residential') {
      return [
        'Construction', 'Electrical', 'Plumbing', 'HVAC', 
        'Finishing', 'Site Preparation', 'Interior Design',
        'Vastu Compliance', 'Earthwork'
      ];
    } else if (projectType === 'commercial') {
      return [
        'Construction', 'Electrical', 'Plumbing', 'HVAC', 
        'Finishing', 'Site Preparation', 'Fire Safety',
        'Elevator Installation', 'Security Systems'
      ];
    } else {
      return [
        'Construction', 'Electrical', 'Plumbing', 'HVAC', 
        'Finishing', 'Site Preparation', 'Machinery Installation',
        'Utility Connections', 'Environmental Compliance'
      ];
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-indigo-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header with real-time status */}
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-4 mb-4">
            <h1 className="text-4xl font-bold text-blue-800 flex items-center justify-center gap-3">
              <Calculator className="h-10 w-10 text-blue-600" />
              Indian Project Management Suite
            </h1>
            <div className="flex items-center gap-2 bg-green-100 px-3 py-1 rounded-full">
              <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-green-700">Realtime ON</span>
            </div>
            <div className="flex items-center gap-2 bg-blue-100 px-3 py-1 rounded-full">
              <Activity className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-700">{activeUsers} Online</span>
            </div>
          </div>
          
          <p className="text-lg text-blue-600 max-w-3xl mx-auto">
            Comprehensive project management and cost estimation tools with real-time collaboration
            specifically designed for the Indian architectural and construction industry
          </p>
        </div>

        {/* Project Summary Card */}
        <Card className="mb-8 border-blue-200 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-800">
              <Building className="h-6 w-6" />
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-red-500" />
                <span>Project Overview</span>
              </div>
            </CardTitle>
            <CardDescription>Enter project details and track overall progress</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
              <div className="lg:col-span-2 space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-blue-700">Project Name</label>
                  <Input
                    placeholder="e.g., Modern Residential Complex"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1 text-blue-700">Location</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 h-4 w-4 text-blue-500" />
                      <Input
                        placeholder="e.g., Mumbai, Maharashtra"
                        value={projectLocation}
                        onChange={(e) => setProjectLocation(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-blue-700">Project Type</label>
                    <Select value={projectType} onValueChange={setProjectType}>
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
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-blue-700">Project Description</label>
                  <Textarea
                    placeholder="Briefly describe the scope of the project..."
                    value={projectDescription}
                    onChange={(e) => setProjectDescription(e.target.value)}
                    className="h-20"
                  />
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-blue-700">Budget (₹)</label>
                  <div className="relative">
                    <IndianRupee className="absolute left-3 top-3 h-4 w-4 text-blue-500" />
                    <Input
                      type="number"
                      placeholder="Total budget"
                      value={projectBudget}
                      onChange={(e) => setProjectBudget(e.target.value === '' ? '' : Number(e.target.value))}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-blue-700">Timeline (days)</label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-3 h-4 w-4 text-blue-500" />
                    <Input
                      type="number"
                      placeholder="Total duration"
                      value={projectTimeline}
                      onChange={(e) => setProjectTimeline(e.target.value === '' ? '' : Number(e.target.value))}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-blue-700">Climate Zone</label>
                  <Select value={climateZone} onValueChange={setClimateZone}>
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
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-blue-700">Total Tasks</label>
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-600" />
                    <span className="text-lg font-semibold">{totalTasks}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-blue-700">Completed Tasks</label>
                  <div className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-green-600" />
                    <span className="text-lg font-semibold">{completedTasks}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-blue-700">Progress</label>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    <span className="text-lg font-semibold">{projectProgress}%</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-blue-700">Cost Summary</label>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span>Budget:</span>
                      <span className="font-semibold">{formatCurrency(projectBudgetNum)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Spent:</span>
                      <span className="font-semibold">{formatCurrency(totalProjectCost)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Remaining:</span>
                      <span className={`font-semibold ${budgetRemaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(budgetRemaining)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-sm font-medium text-blue-700 flex items-center gap-1">
                    <Sun className="h-4 w-4" />
                    Climate Tip
                  </p>
                  <p className="text-xs text-blue-600">{getClimateSpecificTips()}</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-blue-700">Local Materials</label>
                  <div className="flex flex-wrap gap-1">
                    {getLocalMaterialSuggestions().map((material, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {material}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="bg-green-50 p-3 rounded-lg">
                  <p className="text-sm font-medium text-green-700 flex items-center gap-1">
                    <Factory className="h-4 w-4" />
                    Local Supplier
                  </p>
                  <p className="text-xs text-green-600">Recommended suppliers in your region</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Progress Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="border-blue-200 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-blue-100">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Project Progress</p>
                  <p className="text-2xl font-bold">{projectProgress}%</p>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${projectProgress}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-green-200 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-green-100">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Milestones</p>
                  <p className="text-2xl font-bold">{milestoneProgress}%</p>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full" 
                      style={{ width: `${milestoneProgress}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-purple-200 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-purple-100">
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Team Members</p>
                  <p className="text-2xl font-bold">{members.length}</p>
                  <p className="text-sm text-gray-600">{activeUsers} Active</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-amber-200 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-amber-100">
                  <DollarSign className="h-6 w-6 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Budget Status</p>
                  <p className="text-2xl font-bold">{formatCurrency(totalProjectCost)}</p>
                  <p className="text-sm text-gray-600">of {formatCurrency(projectBudgetNum)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="tasks" className="space-y-4">
          <TabsList className="grid w-full grid-cols-6 bg-blue-100 p-1">
            <TabsTrigger value="tasks" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <FileText className="h-4 w-4 mr-2" />
              Tasks
            </TabsTrigger>
            <TabsTrigger value="materials" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <Building className="h-4 w-4 mr-2" />
              Materials
            </TabsTrigger>
            <TabsTrigger value="expenses" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <DollarSign className="h-4 w-4 mr-2" />
              Expenses
            </TabsTrigger>
            <TabsTrigger value="milestones" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <TrendingUp className="h-4 w-4 mr-2" />
              Milestones
            </TabsTrigger>
            <TabsTrigger value="team" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <Users className="h-4 w-4 mr-2" />
              Team
            </TabsTrigger>
            <TabsTrigger value="reports" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <PieChart className="h-4 w-4 mr-2" />
              Reports
            </TabsTrigger>
          </TabsList>

          {/* Tasks Tab */}
          <TabsContent value="tasks">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Card className="border-blue-200 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-blue-800">
                      <FileText className="h-6 w-6" />
                      Project Tasks
                    </CardTitle>
                    <CardDescription>Manage and track project tasks with costs and timelines</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Task</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Cost (₹)</TableHead>
                          <TableHead>Duration (days)</TableHead>
                          <TableHead>Assigned To</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Start Date</TableHead>
                          <TableHead>End Date</TableHead>
                          <TableHead>Vastu Compliant</TableHead>
                          <TableHead>Actions</TableHead>
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
                            <TableCell>{formatCurrency(task.cost)}</TableCell>
                            <TableCell>{task.duration}</TableCell>
                            <TableCell>{task.assigned_to}</TableCell>
                            <TableCell>
                              <Badge 
                                className={
                                  task.status === 'completed' ? 'bg-green-100 text-green-800' :
                                  task.status === 'in-progress' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-gray-100 text-gray-800'
                                }
                              >
                                {task.status.replace('-', ' ')}
                              </Badge>
                            </TableCell>
                            <TableCell>{formatDate(task.start_date)}</TableCell>
                            <TableCell>{formatDate(task.end_date)}</TableCell>
                            <TableCell>
                              <Badge variant={task.category.includes('Vastu') ? "default" : "outline"}>
                                {task.category.includes('Vastu') ? 'Yes' : 'No'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button variant="ghost" size="icon">
                                  <Edit3 className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
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
                  </CardContent>
                </Card>
              </div>
              
              <div>
                <Card className="border-blue-200 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-blue-800">
                      <Plus className="h-6 w-6" />
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
                          {getTaskCategories().map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Cost (₹)</label>
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
                        value={newTask.assigned_to}
                        onChange={(e) => setNewTask({...newTask, assigned_to: e.target.value})}
                        placeholder="Contractor or team member"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1 flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          Start Date
                        </label>
                        <Input
                          type="date"
                          value={newTask.start_date}
                          onChange={(e) => setNewTask({...newTask, start_date: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1 flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          End Date
                        </label>
                        <Input
                          type="date"
                          value={newTask.end_date}
                          onChange={(e) => setNewTask({...newTask, end_date: e.target.value})}
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
                <Card className="border-blue-200 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-blue-800">
                      <Building className="h-6 w-6" />
                      Materials & Resources
                    </CardTitle>
                    <CardDescription>Track materials and resources with costs</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Material</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Unit</TableHead>
                          <TableHead>Unit Cost (₹)</TableHead>
                          <TableHead>Quantity</TableHead>
                          <TableHead>Total Cost (₹)</TableHead>
                          <TableHead>Supplier</TableHead>
                          <TableHead>Region</TableHead>
                          <TableHead>Actions</TableHead>
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
                            <TableCell>{material.unit}</TableCell>
                            <TableCell>{formatCurrency(material.unit_cost)}</TableCell>
                            <TableCell>{material.quantity}</TableCell>
                            <TableCell className="font-semibold">{formatCurrency(material.total_cost)}</TableCell>
                            <TableCell>
                              {material.name.includes('Cement') ? 'Ambuja Cement' : 
                               material.name.includes('Steel') ? 'Tata TMT' : 
                               material.name.includes('Wood') ? 'Premium Supplier' : 
                               material.name.includes('Marble') ? 'Indian Marble Co.' :
                               'Local Supplier'}
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary">
                                {material.name.includes('Laterite') || material.name.includes('Teak') ? 'South India' :
                                 material.name.includes('Slate') || material.name.includes('Deodar') ? 'North India' :
                                 material.name.includes('Shingle') || material.name.includes('Pine') ? 'Mountain' :
                                 'All India'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button variant="ghost" size="icon">
                                  <Edit3 className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
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
                  </CardContent>
                </Card>
              </div>
              
              <div>
                <Card className="border-blue-200 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-blue-800">
                      <Plus className="h-6 w-6" />
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
                        placeholder="e.g., Cement (OPC 53 Grade)"
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
                          <SelectItem value="Finishing Materials">Finishing Materials</SelectItem>
                          <SelectItem value="Equipment">Equipment</SelectItem>
                          <SelectItem value="Local Materials">Local Materials</SelectItem>
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
                            <SelectItem value="cubic_meter">Cubic Meter</SelectItem>
                            <SelectItem value="quintal">Quintal</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Unit Cost (₹)</label>
                        <Input
                          type="number"
                          value={newMaterial.unit_cost}
                          onChange={(e) => setNewMaterial({...newMaterial, unit_cost: e.target.value === '' ? '' : Number(e.target.value)})}
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
                          <TableHead>Amount (₹)</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Notes</TableHead>
                          <TableHead>Supplier</TableHead>
                          <TableHead>GST Applicable</TableHead>
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
                            <TableCell className="font-semibold">{formatCurrency(expense.amount)}</TableCell>
                            <TableCell>{formatDate(expense.date)}</TableCell>
                            <TableCell>{expense.notes}</TableCell>
                            <TableCell>{expense.name.includes('Municipal') ? 'Municipal Office' : expense.name.includes('Architect') ? 'Professional Service' : 'Local Vendor'}</TableCell>
                            <TableCell>
                              <Badge variant={expense.amount > 250000 ? "default" : "outline"}>
                                {expense.amount > 250000 ? 'Yes' : 'No'}
                              </Badge>
                            </TableCell>
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
                        placeholder="e.g., Municipal Permit"
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
                          <SelectItem value="Labour">Labour</SelectItem>
                          <SelectItem value="Municipal">Municipal</SelectItem>
                          <SelectItem value="General">General</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Amount (₹)</label>
                      <Input
                        type="number"
                        value={newExpense.amount}
                        onChange={(e) => setNewExpense({...newExpense, amount: e.target.value === '' ? '' : Number(e.target.value)})}
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1 flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        Date
                      </label>
                      <Input
                        type="date"
                        value={newExpense.date}
                        onChange={(e) => setNewExpense({...newExpense, date: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">GST Applicable?</label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="checkbox"
                          checked={newExpense.amount > 250000}
                          disabled
                          className="h-4 w-4"
                        />
                        <span className="text-sm">Automatically applied for expenses >₹2,50,000</span>
                      </div>
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
                            <p className="text-sm text-gray-600">Target: {formatDate(milestone.targetDate)}</p>
                            <div className="mt-2 flex items-center gap-4">
                              <span className={`text-sm ${milestone.completed ? 'text-green-600' : 'text-yellow-600'}`}>
                                {milestone.completed ? 'Completed' : 'Pending'}
                              </span>
                              <span className="text-sm">Budget: {formatCurrency(milestone.budget)}</span>
                              <span className="text-sm">Actual: {formatCurrency(milestone.actualCost)}</span>
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

          {/* Team Tab */}
          <TabsContent value="team">
            <Card className="border-blue-200 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-800">
                  <Users className="h-6 w-6" />
                  Team Members
                </CardTitle>
                <CardDescription>Manage and communicate with project team members</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-6 flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Team Members</h3>
                  <Button>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Invite Member
                  </Button>
                </div>
                
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Member</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Joined Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {members.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell className="font-medium">{member.username}</TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-1 text-sm">
                              <Mail className="h-3 w-3" />
                              {member.email}
                            </div>
                            <div className="flex items-center gap-1 text-sm">
                              <Phone className="h-3 w-3" />
                              {member.phone}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            className={
                              member.role === 'owner' ? 'bg-purple-100 text-purple-800' :
                              member.role === 'editor' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'
                            }
                          >
                            {member.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                            <span>Active</span>
                          </div>
                        </TableCell>
                        <TableCell>{formatDate(member.joined_at)}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="icon">
                              <MessageSquare className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon">
                              <Edit3 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-4">Real-time Collaboration</h3>
                  <div className="bg-white p-4 rounded-lg border">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="h-10 w-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                        YS
                      </div>
                      <div>
                        <p className="font-medium">You</p>
                        <p className="text-sm text-gray-600">Online now</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-green-500 rounded-full flex items-center justify-center text-white font-bold">
                          DS
                        </div>
                        <div>
                          <p className="font-medium">Designer1</p>
                          <p className="text-sm text-gray-600">Active now</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-gray-500 rounded-full flex items-center justify-center text-white font-bold">
                          CE
                        </div>
                        <div>
                          <p className="font-medium">Contractor1</p>
                          <p className="text-sm text-gray-600">Offline</p>
                        </div>
                      </div>
                    </div>
                  </div>
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
                      <span className="font-semibold">{formatCurrency(totalTaskCost)}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className="bg-blue-600 h-2.5 rounded-full" 
                        style={{ width: `${totalProjectCost > 0 ? (totalTaskCost / totalProjectCost) * 100 : 0}%` }}
                      ></div>
                    </div>
                    
                    <div className="flex justify-between">
                      <span>Materials</span>
                      <span className="font-semibold">{formatCurrency(totalMaterialCost)}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className="bg-green-600 h-2.5 rounded-full" 
                        style={{ width: `${totalProjectCost > 0 ? (totalMaterialCost / totalProjectCost) * 100 : 0}%` }}
                      ></div>
                    </div>
                    
                    <div className="flex justify-between">
                      <span>Expenses</span>
                      <span className="font-semibold">{formatCurrency(totalExpenseCost)}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className="bg-purple-600 h-2.5 rounded-full" 
                        style={{ width: `${totalProjectCost > 0 ? (totalExpenseCost / totalProjectCost) * 100 : 0}%` }}
                      ></div>
                    </div>
                    
                    <div className="pt-4 border-t border-gray-200 flex justify-between font-bold">
                      <span>Total</span>
                      <span>{formatCurrency(totalProjectCost)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-blue-200 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-blue-800">
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
                        <span>{formatCurrency(projectBudgetNum)}</span>
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
                        <span>{formatCurrency(totalProjectCost)}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-4">
                        <div 
                          className={`${totalProjectCost > projectBudgetNum ? 'bg-red-500' : 'bg-green-500'}`} 
                          style={{ width: `${projectBudgetNum > 0 ? Math.min(100, (totalProjectCost / projectBudgetNum) * 100) : 0}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <div className="pt-4 border-t border-gray-200">
                      <div className="flex justify-between">
                        <span>Remaining</span>
                        <span className={`font-semibold ${budgetRemaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(budgetRemaining)}
                        </span>
                      </div>
                      {budgetRemaining < 0 && (
                        <p className="text-sm text-red-600 mt-2">
                          Budget exceeded by {formatCurrency(Math.abs(budgetRemaining))}
                        </p>
                      )}
                    </div>
                    
                    <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                      <h4 className="font-semibold text-yellow-800 flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        Indian Tax Compliance
                      </h4>
                      <p className="text-sm text-yellow-700">
                        {totalExpenseCost > 250000 
                          ? 'GST applicable on expenses >₹2,50,000. Ensure proper documentation.' 
                          : 'Expenses below ₹2,50,000 threshold are GST exempt for now.'}
                      </p>
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
                      <p className="text-sm text-blue-600">{completedTasks} completed</p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <h3 className="font-semibold text-green-800">Materials</h3>
                      <p className="text-2xl font-bold">{materials.length}</p>
                      <p className="text-sm text-green-600">{formatCurrency(totalMaterialCost)}</p>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <h3 className="font-semibold text-purple-800">Expenses</h3>
                      <p className="text-2xl font-bold">{expenses.length}</p>
                      <p className="text-sm text-purple-600">{formatCurrency(totalExpenseCost)}</p>
                    </div>
                    <div className="bg-yellow-50 p-4 rounded-lg">
                      <h3 className="font-semibold text-yellow-800">Progress</h3>
                      <p className="text-2xl font-bold">{projectProgress}%</p>
                      <p className="text-sm text-yellow-600">Overall completion</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                      <h4 className="font-semibold text-amber-800 flex items-center gap-1">
                        <Sun className="h-4 w-4" />
                        Climate Consideration
                      </h4>
                      <p className="text-sm text-amber-700">{getClimateSpecificTips()}</p>
                    </div>
                    <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200">
                      <h4 className="font-semibold text-emerald-800 flex items-center gap-1">
                        <Factory className="h-4 w-4" />
                        Local Material Advantage
                      </h4>
                      <p className="text-sm text-emerald-700">
                        Using {getLocalMaterialSuggestions().length} regional materials can reduce costs by 10-15%
                      </p>
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
              <CardFooter className="flex flex-col sm:flex-row justify-between gap-4">
                <div className="flex gap-2">
                  <Button variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Export Report (PDF)
                  </Button>
                  <Button variant="outline">
                    <IndianRupee className="h-4 w-4 mr-2" />
                    Export Financials (Excel)
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline">
                    <Upload className="h-4 w-4 mr-2" />
                    Save Project
                  </Button>
                  <Button>
                    <Mail className="h-4 w-4 mr-2" />
                    Send to Client
                  </Button>
                </div>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}