// Database Types - Auto-generated from Supabase schema
// Corresponds to migrations in supabase/migrations/

export type ClimateZone = 'tropical' | 'subtropical' | 'mountain' | 'arid';
export type ProjectType = 'residential' | 'commercial' | 'industrial' | 'infrastructure';
export type TaskStatus = 'pending' | 'in-progress' | 'completed' | 'on-hold';
export type MilestoneStatus = 'pending' | 'in-progress' | 'completed' | 'delayed';
export type PresenceStatus = 'online' | 'offline' | 'away';
export type ProjectRole = 'owner' | 'editor' | 'viewer';

// ============================================================================
// PROJECT TYPES
// ============================================================================

export interface Project {
  id: string;
  name: string;
  description: string | null;
  budget: number | null;
  location: string | null;
  state: string | null;
  city: string | null;
  climate_zone: ClimateZone | null;
  project_type: ProjectType | null;
  timeline_days: number | null;
  
  // India-specific fields
  gst_number: string | null;
  local_contractor: string | null;
  monsoon_start_date: string | null;
  monsoon_end_date: string | null;
  vastu_consultant: string | null;
  
  // Metadata
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateProjectData {
  name: string;
  description?: string;
  budget?: number;
  location?: string;
  state?: string;
  city?: string;
  climate_zone?: ClimateZone;
  project_type?: ProjectType;
  timeline_days?: number;
  gst_number?: string;
  local_contractor?: string;
  monsoon_start_date?: string;
  monsoon_end_date?: string;
  vastu_consultant?: string;
}

// ============================================================================
// TASK TYPES
// ============================================================================

export interface ProjectTask {
  id: string;
  project_id: string;
  name: string;
  category: string | null;
  cost: number;
  duration: number | null;
  assigned_to: string | null;
  status: TaskStatus;
  start_date: string | null;
  end_date: string | null;
  
  // India-specific fields
  monsoon_dependent: boolean;
  vastu_compliant: boolean;
  permit_required: boolean;
  local_labor_required: boolean;
  
  // Metadata
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateTaskData {
  project_id: string;
  name: string;
  category?: string;
  cost?: number;
  duration?: number;
  assigned_to?: string;
  status?: TaskStatus;
  start_date?: string;
  end_date?: string;
  monsoon_dependent?: boolean;
  vastu_compliant?: boolean;
  permit_required?: boolean;
  local_labor_required?: boolean;
}

// ============================================================================
// MATERIAL TYPES
// ============================================================================

export interface Material {
  id: string;
  project_id: string;
  name: string;
  category: string | null;
  unit: string | null;
  unit_cost: number;
  quantity: number;
  total_cost: number; // Computed field
  
  // India-specific fields
  gst_rate: number;
  gst_amount: number; // Computed field
  is_local_material: boolean;
  climate_suitable: boolean;
  supplier_location: string | null;
  quality_grade: string | null;
  
  // Metadata
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateMaterialData {
  project_id: string;
  name: string;
  category?: string;
  unit?: string;
  unit_cost: number;
  quantity: number;
  gst_rate?: number;
  is_local_material?: boolean;
  climate_suitable?: boolean;
  supplier_location?: string;
  quality_grade?: string;
}

// ============================================================================
// EXPENSE TYPES
// ============================================================================

export interface Expense {
  id: string;
  project_id: string;
  description: string;
  amount: number;
  category: string | null;
  expense_date: string;
  
  // India-specific fields
  gst_applicable: boolean;
  gst_rate: number;
  gst_amount: number; // Computed field
  payment_method: string | null;
  invoice_number: string | null;
  
  // Metadata
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateExpenseData {
  project_id: string;
  description: string;
  amount: number;
  category?: string;
  expense_date?: string;
  gst_applicable?: boolean;
  gst_rate?: number;
  payment_method?: string;
  invoice_number?: string;
}

// ============================================================================
// MILESTONE TYPES
// ============================================================================

export interface Milestone {
  id: string;
  project_id: string;
  name: string;
  description: string | null;
  target_date: string;
  completion_date: string | null;
  status: MilestoneStatus;
  payment_percentage: number;
  
  // India-specific fields
  approval_required: boolean;
  approval_authority: string | null;
  compliance_documents: string[] | null;
  
  // Metadata
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateMilestoneData {
  project_id: string;
  name: string;
  description?: string;
  target_date: string;
  completion_date?: string;
  status?: MilestoneStatus;
  payment_percentage?: number;
  approval_required?: boolean;
  approval_authority?: string;
  compliance_documents?: string[];
}

// ============================================================================
// USER PRESENCE TYPES
// ============================================================================

export interface UserPresence {
  id: string;
  user_id: string;
  project_id: string;
  status: PresenceStatus;
  last_seen: string;
  cursor_position: CursorPosition | null;
  current_section: string | null;
  created_at: string;
  updated_at: string;
}

export interface CursorPosition {
  x: number;
  y: number;
  section?: string;
}

export interface CreatePresenceData {
  user_id: string;
  project_id: string;
  status?: PresenceStatus;
  cursor_position?: CursorPosition;
  current_section?: string;
}

// ============================================================================
// PROJECT MEMBER TYPES
// ============================================================================

export interface ProjectMember {
  id: string;
  project_id: string;
  user_id: string;
  role: ProjectRole;
  invited_by: string | null;
  joined_at: string;
}

export interface CreateProjectMemberData {
  project_id: string;
  user_id: string;
  role?: ProjectRole;
  invited_by?: string;
}

// ============================================================================
// STATISTICS AND AGGREGATES
// ============================================================================

export interface ProjectStatistics {
  total_tasks: number;
  completed_tasks: number;
  total_materials: number;
  total_expenses: number;
  total_materials_cost: number;
  total_milestones: number;
  completed_milestones: number;
  active_members: number;
}

export interface ProjectWithStatistics extends Project {
  statistics: ProjectStatistics;
  user_role: ProjectRole;
}

export interface ProjectDashboardSummary {
  project_id: string;
  project_name: string;
  budget: number | null;
  state: string | null;
  city: string | null;
  climate_zone: ClimateZone | null;
  project_type: ProjectType | null;
  total_tasks: number;
  completed_tasks: number;
  total_materials: number;
  total_expenses: number;
  total_materials_cost: number;
  total_milestones: number;
  completed_milestones: number;
  total_members: number;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// REAL-TIME EVENT TYPES
// ============================================================================

export interface TaskStatusChangedEvent {
  task_id: string;
  project_id: string;
  old_status: TaskStatus;
  new_status: TaskStatus;
  updated_by: string;
  timestamp: string;
}

export interface MilestoneCompletedEvent {
  milestone_id: string;
  project_id: string;
  milestone_name: string;
  completion_date: string;
  timestamp: string;
}

export interface BudgetThresholdExceededEvent {
  project_id: string;
  total_spent: number;
  timestamp: string;
}

// ============================================================================
// SUPABASE RESPONSE TYPES
// ============================================================================

export interface SupabaseResponse<T> {
  data: T | null;
  error: Error | null;
}

export interface SupabaseError {
  message: string;
  details: string;
  hint: string;
  code: string;
}

// ============================================================================
// FILTER AND QUERY TYPES
// ============================================================================

export interface ProjectFilters {
  state?: string;
  city?: string;
  climate_zone?: ClimateZone;
  project_type?: ProjectType;
  created_by?: string;
}

export interface TaskFilters {
  project_id?: string;
  status?: TaskStatus;
  category?: string;
  assigned_to?: string;
  monsoon_dependent?: boolean;
}

export interface MaterialFilters {
  project_id?: string;
  category?: string;
  is_local_material?: boolean;
  climate_suitable?: boolean;
}

export interface ExpenseFilters {
  project_id?: string;
  category?: string;
  start_date?: string;
  end_date?: string;
}

// ============================================================================
// INDIA-SPECIFIC TYPES
// ============================================================================

export interface IndianState {
  code: string;
  name: string;
  climate_zones: ClimateZone[];
}

export interface IndianCity {
  name: string;
  state: string;
  climate_zone: ClimateZone;
}

export interface GSTCalculation {
  base_amount: number;
  gst_rate: number;
  gst_amount: number;
  total_amount: number;
}

export interface LocalMaterial {
  name: string;
  category: string;
  typical_unit: string;
  climate_zones: ClimateZone[];
  quality_grades?: string[];
}

export interface ClimateRecommendation {
  climate_zone: ClimateZone;
  recommended_materials: string[];
  avoid_materials: string[];
  seasonal_considerations: string[];
}
