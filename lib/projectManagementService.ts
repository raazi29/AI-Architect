// projectManagementService.ts
import { supabase } from '@/lib/supabaseClient';

export interface Project {
  id: string;
  name: string;
  description: string;
  budget: number;
  location: string;
  state?: string;
  city?: string;
  climate_zone?: 'tropical' | 'subtropical' | 'mountain' | 'arid';
  project_type?: 'residential' | 'commercial' | 'industrial' | 'infrastructure';
  timeline_days?: number;
  gst_number?: string;
  local_contractor?: string;
  monsoon_start_date?: string;
  monsoon_end_date?: string;
  vastu_consultant?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectTask {
  id: string;
  project_id: string;
  name: string;
  category: string;
  cost: number;
  duration: number;
  assigned_to: string;
  status: 'pending' | 'in-progress' | 'completed';
  start_date: string;
  end_date: string;
  created_by: string;
  updated_at: string;
}

export interface Material {
  id: string;
  project_id: string;
  name: string;
  category: string;
  unit: string;
  unit_cost: number;
  quantity: number;
  total_cost: number;
  created_by: string;
  updated_at: string;
}

export interface Expense {
  id: string;
  project_id: string;
  description: string;
  category: string;
  amount: number;
  expense_date: string;
  gst_applicable?: boolean;
  gst_rate?: number;
  gst_amount?: number;
  payment_method?: string;
  invoice_number?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectMember {
  id: string;
  project_id: string;
  user_id: string;
  username: string;
  email: string;
  phone: string;
  role: string;
  joined_at: string;
}

export interface ProjectMilestone {
  id: string;
  project_id: string;
  name: string;
  description?: string;
  target_date: string;
  completion_date?: string;
  status: 'pending' | 'in-progress' | 'completed' | 'delayed';
  payment_percentage?: number;
  approval_required?: boolean;
  approval_authority?: string;
  compliance_documents?: string[];
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface UserPresence {
  id: string;
  user_id: string;
  project_id: string;
  status: 'online' | 'away' | 'offline';
  last_seen: string;
  cursor_position?: any;
}

// Projects API
export const projectService = {
  async getProjects(userId?: string) {
    let query = supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });

    if (userId) {
      query = query.eq('created_by', userId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching projects:', error);
      return [];
    }

    return data as Project[];
  },

  async getProject(projectId: string) {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (error) {
      console.error('Error fetching project:', error);
      throw error;
    }

    return data as Project;
  },

  async createProject(project: Omit<Project, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('projects')
      .insert([{
        ...project,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating project:', error);
      throw error;
    }

    return data as Project;
  },

  async updateProject(projectId: string, updates: Partial<Project>) {
    const { data, error } = await supabase
      .from('projects')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', projectId)
      .select()
      .single();

    if (error) {
      console.error('Error updating project:', error);
      throw error;
    }

    return data as Project;
  },

  async deleteProject(projectId: string) {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId);

    if (error) {
      console.error('Error deleting project:', error);
      throw error;
    }
  }
};

// Project Tasks API
export const projectTaskService = {
  async getTasks(projectId: string) {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching tasks:', error);
      return [];
    }

    return data as ProjectTask[];
  },

  async createTask(task: Omit<ProjectTask, 'id' | 'created_by' | 'updated_at'>) {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data, error } = await supabase
      .from('tasks')
      .insert([{
        ...task,
        created_by: user?.id || null,
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating task:', error);
      throw error;
    }

    return data as ProjectTask;
  },

  async updateTask(task: Partial<ProjectTask>) {
    const { data, error } = await supabase
      .from('tasks')
      .update({
        ...task,
        updated_at: new Date().toISOString()
      })
      .eq('id', task.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating task:', error);
      throw error;
    }

    return data as ProjectTask;
  },

  async deleteTask(taskId: string, projectId: string) {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId)
      .eq('project_id', projectId);

    if (error) {
      console.error('Error deleting task:', error);
      throw error;
    }
  }
};

// Materials API
export const materialService = {
  async getMaterials(projectId: string) {
    const { data, error } = await supabase
      .from('materials') // Note: This table might need to be created in your schema
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching materials:', error);
      return [];
    }

    return data as Material[];
  },

  async createMaterial(material: Omit<Material, 'id' | 'created_by' | 'updated_at' | 'total_cost'>) {
    const { data: { user } } = await supabase.auth.getUser();
    
    // Don't send total_cost - it's a GENERATED column in the database
    const { data, error } = await supabase
      .from('materials')
      .insert([{
        project_id: material.project_id,
        name: material.name,
        category: material.category,
        unit: material.unit,
        unit_cost: material.unit_cost,
        quantity: material.quantity,
        created_by: user?.id || null,
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating material:', error);
      throw error;
    }

    return data as Material;
  },

  async updateMaterial(material: Partial<Material>) {
    const { data, error } = await supabase
      .from('materials')
      .update({
        ...material,
        updated_at: new Date().toISOString()
      })
      .eq('id', material.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating material:', error);
      throw error;
    }

    return data as Material;
  },

  async deleteMaterial(materialId: string, projectId: string) {
    const { error } = await supabase
      .from('materials')
      .delete()
      .eq('id', materialId)
      .eq('project_id', projectId);

    if (error) {
      console.error('Error deleting material:', error);
      throw error;
    }
  }
};

// Expenses API
export const expenseService = {
  async getExpenses(projectId: string) {
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching expenses:', error);
      return [];
    }

    return data as Expense[];
  },

  async createExpense(expense: Omit<Expense, 'id' | 'created_by' | 'created_at' | 'updated_at'>) {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data, error } = await supabase
      .from('expenses')
      .insert([{
        ...expense,
        created_by: user?.id || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating expense:', error);
      throw error;
    }

    return data as Expense;
  },

  async updateExpense(expense: Partial<Expense>) {
    const { data, error } = await supabase
      .from('expenses')
      .update({
        ...expense,
        updated_at: new Date().toISOString()
      })
      .eq('id', expense.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating expense:', error);
      throw error;
    }

    return data as Expense;
  },

  async deleteExpense(expenseId: string, projectId: string) {
    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', expenseId)
      .eq('project_id', projectId);

    if (error) {
      console.error('Error deleting expense:', error);
      throw error;
    }
  }
};

// Project Members API
export const projectMemberService = {
  async getMembers(projectId: string) {
    const { data, error } = await supabase
      .from('project_members')
      .select(`
        id,
        project_id,
        user_id,
        profiles(username, email, avatar_url)
      `)
      .eq('project_id', projectId);

    if (error) {
      console.error('Error fetching members:', error);
      return [];
    }

    // Format the data to match our interface
    return data.map(item => ({
      id: item.id,
      project_id: item.project_id,
      user_id: item.user_id,
      username: item.profiles?.username || 'Unknown',
      email: item.profiles?.email || '',
      phone: '', // Phone might need to be added to profiles table
      role: 'editor', // Role is available in project_members table
      joined_at: new Date().toISOString() // Joined at is available in project_members table
    })) as ProjectMember[];
  },

  async addMember(projectId: string, userId: string, role: string) {
    const { data, error } = await supabase
      .from('project_members')
      .insert([{
        project_id: projectId,
        user_id: userId,
        role: role
      }])
      .select()
      .single();

    if (error) {
      console.error('Error adding member:', error);
      throw error;
    }

    return data;
  }
};

// Project Milestones API
export const milestoneService = {
  async getMilestones(projectId: string) {
    const { data, error } = await supabase
      .from('milestones')
      .select('*')
      .eq('project_id', projectId)
      .order('target_date', { ascending: true });

    if (error) {
      console.error('Error fetching milestones:', error);
      return [];
    }

    return data as ProjectMilestone[];
  },

  async createMilestone(milestone: Omit<ProjectMilestone, 'id' | 'created_by' | 'created_at' | 'updated_at'>) {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data, error } = await supabase
      .from('milestones')
      .insert([{
        ...milestone,
        status: milestone.status || 'pending',
        created_by: user?.id || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating milestone:', error);
      throw error;
    }

    return data as ProjectMilestone;
  },

  async updateMilestone(milestone: Partial<ProjectMilestone>) {
    const { data, error } = await supabase
      .from('milestones')
      .update({
        ...milestone,
        updated_at: new Date().toISOString()
      })
      .eq('id', milestone.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating milestone:', error);
      throw error;
    }

    return data as ProjectMilestone;
  },

  async deleteMilestone(milestoneId: string, projectId: string) {
    const { error } = await supabase
      .from('milestones')
      .delete()
      .eq('id', milestoneId)
      .eq('project_id', projectId);

    if (error) {
      console.error('Error deleting milestone:', error);
      throw error;
    }
  }
};

// User Presence API
export const userPresenceService = {
  async getUserPresence(projectId: string) {
    const { data, error } = await supabase
      .from('user_presence')
      .select(`
        id,
        user_id,
        status,
        last_seen,
        profiles(username)
      `)
      .eq('project_id', projectId);

    if (error) {
      console.error('Error fetching user presence:', error);
      return [];
    }

    return data.map(item => ({
      id: item.id,
      user_id: item.user_id,
      project_id: projectId, // Adding project_id that's implicit in the query
      status: item.status,
      last_seen: item.last_seen,
      username: item.profiles?.username || 'Unknown'
    })) as UserPresence[];
  },

  async updateUserPresence(userId: string, projectId: string, status: 'online' | 'away' | 'offline') {
    const { data, error } = await supabase
      .from('user_presence')
      .upsert([{
        user_id: userId,
        project_id: projectId,
        status: status,
        last_seen: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) {
      console.error('Error updating user presence:', error);
      throw error;
    }

    return data;
  }
};

// Real-time subscription functions
export const subscribeToProjectChanges = (
  projectId: string,
  onTaskChange: (payload: any) => void,
  onMaterialChange: (payload: any) => void,
  onExpenseChange: (payload: any) => void,
  onMemberChange: (payload: any) => void,
  onMilestoneChange: (payload: any) => void,
  onPresenceChange: (payload: any) => void
) => {
  // Subscribe to tasks changes
  const tasksChannel = supabase
    .channel(`tasks-${projectId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'tasks',
        filter: `project_id=eq.${projectId}`
      },
      onTaskChange
    )
    .subscribe();

  // Subscribe to materials changes
  const materialsChannel = supabase
    .channel(`materials-${projectId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'materials',
        filter: `project_id=eq.${projectId}`
      },
      onMaterialChange
    )
    .subscribe();

  // Subscribe to expenses changes
  const expensesChannel = supabase
    .channel(`expenses-${projectId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'expenses',
        filter: `project_id=eq.${projectId}`
      },
      onExpenseChange
    )
    .subscribe();

  // Subscribe to project members changes
  const membersChannel = supabase
    .channel(`members-${projectId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'project_members',
        filter: `project_id=eq.${projectId}`
      },
      onMemberChange
    )
    .subscribe();

  // Subscribe to milestones changes
  const milestonesChannel = supabase
    .channel(`milestones-${projectId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'milestones', // This table might need to be created
        filter: `project_id=eq.${projectId}`
      },
      onMilestoneChange
    )
    .subscribe();

  // Subscribe to user presence changes
  const presenceChannel = supabase
    .channel(`presence-${projectId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'user_presence',
        filter: `project_id=eq.${projectId}`
      },
      onPresenceChange
    )
    .subscribe();

  // Return function to unsubscribe from all channels
  return () => {
    supabase.removeChannel(tasksChannel);
    supabase.removeChannel(materialsChannel);
    supabase.removeChannel(expensesChannel);
    supabase.removeChannel(membersChannel);
    supabase.removeChannel(milestonesChannel);
    supabase.removeChannel(presenceChannel);
  };
};