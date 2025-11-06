// Real Supabase Project Management Service - India Specific
// No mocks, actual database operations

import { supabase } from '@/lib/supabaseClient';
import type { 
  Project, 
  CreateProjectData,
  ProjectTask,
  CreateTaskData,
  Material,
  CreateMaterialData,
  Expense,
  CreateExpenseData,
  Milestone,
  CreateMilestoneData
} from '@/lib/types/database.types';

// ============================================================================
// PROJECTS
// ============================================================================

export async function createProject(data: CreateProjectData) {
  const { data: project, error } = await supabase
    .from('projects')
    .insert(data)
    .select()
    .single();
  
  if (error) throw error;
  return project;
}

export async function getProjects() {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data;
}

export async function getProject(id: string) {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) throw error;
  return data;
}

export async function updateProject(id: string, updates: Partial<Project>) {
  const { data, error } = await supabase
    .from('projects')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function deleteProject(id: string) {
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
}

// ============================================================================
// TASKS
// ============================================================================

export async function createTask(data: CreateTaskData) {
  const { data: task, error } = await supabase
    .from('tasks')
    .insert(data)
    .select()
    .single();
  
  if (error) throw error;
  return task;
}

export async function getTasks(projectId: string) {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data;
}

export async function updateTask(id: string, updates: Partial<ProjectTask>) {
  const { data, error } = await supabase
    .from('tasks')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function deleteTask(id: string) {
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
}

// ============================================================================
// MATERIALS
// ============================================================================

export async function createMaterial(data: CreateMaterialData) {
  const { data: material, error } = await supabase
    .from('materials')
    .insert(data)
    .select()
    .single();
  
  if (error) throw error;
  return material;
}

export async function getMaterials(projectId: string) {
  const { data, error } = await supabase
    .from('materials')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data;
}

export async function updateMaterial(id: string, updates: Partial<Material>) {
  const { data, error } = await supabase
    .from('materials')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function deleteMaterial(id: string) {
  const { error } = await supabase
    .from('materials')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
}

// ============================================================================
// EXPENSES
// ============================================================================

export async function createExpense(data: CreateExpenseData) {
  const { data: expense, error } = await supabase
    .from('expenses')
    .insert(data)
    .select()
    .single();
  
  if (error) throw error;
  return expense;
}

export async function getExpenses(projectId: string) {
  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data;
}

export async function updateExpense(id: string, updates: Partial<Expense>) {
  const { data, error } = await supabase
    .from('expenses')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function deleteExpense(id: string) {
  const { error } = await supabase
    .from('expenses')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
}

// ============================================================================
// MILESTONES
// ============================================================================

export async function createMilestone(data: CreateMilestoneData) {
  const { data: milestone, error } = await supabase
    .from('milestones')
    .insert(data)
    .select()
    .single();
  
  if (error) throw error;
  return milestone;
}

export async function getMilestones(projectId: string) {
  const { data, error } = await supabase
    .from('milestones')
    .select('*')
    .eq('project_id', projectId)
    .order('target_date', { ascending: true });
  
  if (error) throw error;
  return data;
}

export async function updateMilestone(id: string, updates: Partial<Milestone>) {
  const { data, error } = await supabase
    .from('milestones')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function deleteMilestone(id: string) {
  const { error } = await supabase
    .from('milestones')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
}

// ============================================================================
// INDIA-SPECIFIC UTILITIES
// ============================================================================

export function calculateGST(amount: number, gstRate: number = 18) {
  const gstAmount = (amount * gstRate) / 100;
  return {
    baseAmount: amount,
    gstRate,
    gstAmount,
    totalAmount: amount + gstAmount
  };
}

export function formatIndianCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
}

export const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
  'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal'
];

export const CLIMATE_ZONES = [
  { value: 'tropical', label: 'Tropical' },
  { value: 'subtropical', label: 'Subtropical' },
  { value: 'mountain', label: 'Mountain' },
  { value: 'arid', label: 'Arid' }
];

export const PROJECT_TYPES = [
  { value: 'residential', label: 'Residential' },
  { value: 'commercial', label: 'Commercial' },
  { value: 'industrial', label: 'Industrial' },
  { value: 'infrastructure', label: 'Infrastructure' }
];
