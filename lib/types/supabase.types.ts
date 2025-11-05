// Supabase Database Type Definitions
// This file provides type-safe access to Supabase database

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      projects: {
        Row: {
          id: string
          name: string
          description: string | null
          budget: number | null
          location: string | null
          state: string | null
          city: string | null
          climate_zone: 'tropical' | 'subtropical' | 'mountain' | 'arid' | null
          project_type: 'residential' | 'commercial' | 'industrial' | 'infrastructure' | null
          timeline_days: number | null
          gst_number: string | null
          local_contractor: string | null
          monsoon_start_date: string | null
          monsoon_end_date: string | null
          vastu_consultant: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          budget?: number | null
          location?: string | null
          state?: string | null
          city?: string | null
          climate_zone?: 'tropical' | 'subtropical' | 'mountain' | 'arid' | null
          project_type?: 'residential' | 'commercial' | 'industrial' | 'infrastructure' | null
          timeline_days?: number | null
          gst_number?: string | null
          local_contractor?: string | null
          monsoon_start_date?: string | null
          monsoon_end_date?: string | null
          vastu_consultant?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          budget?: number | null
          location?: string | null
          state?: string | null
          city?: string | null
          climate_zone?: 'tropical' | 'subtropical' | 'mountain' | 'arid' | null
          project_type?: 'residential' | 'commercial' | 'industrial' | 'infrastructure' | null
          timeline_days?: number | null
          gst_number?: string | null
          local_contractor?: string | null
          monsoon_start_date?: string | null
          monsoon_end_date?: string | null
          vastu_consultant?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      tasks: {
        Row: {
          id: string
          project_id: string
          name: string
          category: string | null
          cost: number
          duration: number | null
          assigned_to: string | null
          status: 'pending' | 'in-progress' | 'completed' | 'on-hold'
          start_date: string | null
          end_date: string | null
          monsoon_dependent: boolean
          vastu_compliant: boolean
          permit_required: boolean
          local_labor_required: boolean
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          name: string
          category?: string | null
          cost?: number
          duration?: number | null
          assigned_to?: string | null
          status?: 'pending' | 'in-progress' | 'completed' | 'on-hold'
          start_date?: string | null
          end_date?: string | null
          monsoon_dependent?: boolean
          vastu_compliant?: boolean
          permit_required?: boolean
          local_labor_required?: boolean
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          name?: string
          category?: string | null
          cost?: number
          duration?: number | null
          assigned_to?: string | null
          status?: 'pending' | 'in-progress' | 'completed' | 'on-hold'
          start_date?: string | null
          end_date?: string | null
          monsoon_dependent?: boolean
          vastu_compliant?: boolean
          permit_required?: boolean
          local_labor_required?: boolean
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      materials: {
        Row: {
          id: string
          project_id: string
          name: string
          category: string | null
          unit: string | null
          unit_cost: number
          quantity: number
          total_cost: number
          gst_rate: number
          gst_amount: number
          is_local_material: boolean
          climate_suitable: boolean
          supplier_location: string | null
          quality_grade: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          name: string
          category?: string | null
          unit?: string | null
          unit_cost: number
          quantity: number
          gst_rate?: number
          is_local_material?: boolean
          climate_suitable?: boolean
          supplier_location?: string | null
          quality_grade?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          name?: string
          category?: string | null
          unit?: string | null
          unit_cost?: number
          quantity?: number
          gst_rate?: number
          is_local_material?: boolean
          climate_suitable?: boolean
          supplier_location?: string | null
          quality_grade?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      expenses: {
        Row: {
          id: string
          project_id: string
          description: string
          amount: number
          category: string | null
          expense_date: string
          gst_applicable: boolean
          gst_rate: number
          gst_amount: number
          payment_method: string | null
          invoice_number: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          description: string
          amount: number
          category?: string | null
          expense_date?: string
          gst_applicable?: boolean
          gst_rate?: number
          payment_method?: string | null
          invoice_number?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          description?: string
          amount?: number
          category?: string | null
          expense_date?: string
          gst_applicable?: boolean
          gst_rate?: number
          payment_method?: string | null
          invoice_number?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      milestones: {
        Row: {
          id: string
          project_id: string
          name: string
          description: string | null
          target_date: string
          completion_date: string | null
          status: 'pending' | 'in-progress' | 'completed' | 'delayed'
          payment_percentage: number
          approval_required: boolean
          approval_authority: string | null
          compliance_documents: string[] | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          name: string
          description?: string | null
          target_date: string
          completion_date?: string | null
          status?: 'pending' | 'in-progress' | 'completed' | 'delayed'
          payment_percentage?: number
          approval_required?: boolean
          approval_authority?: string | null
          compliance_documents?: string[] | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          name?: string
          description?: string | null
          target_date?: string
          completion_date?: string | null
          status?: 'pending' | 'in-progress' | 'completed' | 'delayed'
          payment_percentage?: number
          approval_required?: boolean
          approval_authority?: string | null
          compliance_documents?: string[] | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      user_presence: {
        Row: {
          id: string
          user_id: string
          project_id: string
          status: 'online' | 'offline' | 'away'
          last_seen: string
          cursor_position: Json | null
          current_section: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          project_id: string
          status?: 'online' | 'offline' | 'away'
          last_seen?: string
          cursor_position?: Json | null
          current_section?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          project_id?: string
          status?: 'online' | 'offline' | 'away'
          last_seen?: string
          cursor_position?: Json | null
          current_section?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      project_members: {
        Row: {
          id: string
          project_id: string
          user_id: string
          role: 'owner' | 'editor' | 'viewer'
          invited_by: string | null
          joined_at: string
        }
        Insert: {
          id?: string
          project_id: string
          user_id: string
          role?: 'owner' | 'editor' | 'viewer'
          invited_by?: string | null
          joined_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          user_id?: string
          role?: 'owner' | 'editor' | 'viewer'
          invited_by?: string | null
          joined_at?: string
        }
      }
    }
    Views: {
      project_dashboard_summary: {
        Row: {
          project_id: string
          project_name: string
          budget: number | null
          state: string | null
          city: string | null
          climate_zone: 'tropical' | 'subtropical' | 'mountain' | 'arid' | null
          project_type: 'residential' | 'commercial' | 'industrial' | 'infrastructure' | null
          total_tasks: number
          completed_tasks: number
          total_materials: number
          total_expenses: number
          total_materials_cost: number
          total_milestones: number
          completed_milestones: number
          total_members: number
          created_at: string
          updated_at: string
        }
      }
    }
    Functions: {
      is_project_member: {
        Args: { project_uuid: string; user_uuid: string }
        Returns: boolean
      }
      get_user_project_role: {
        Args: { project_uuid: string; user_uuid: string }
        Returns: string
      }
      get_project_statistics: {
        Args: { project_uuid: string }
        Returns: Json
      }
      get_user_projects: {
        Args: { user_uuid: string }
        Returns: {
          project_id: string
          project_name: string
          project_description: string | null
          budget: number | null
          location: string | null
          state: string | null
          city: string | null
          climate_zone: string | null
          project_type: string | null
          user_role: string
          statistics: Json
          created_at: string
        }[]
      }
      batch_update_task_status: {
        Args: { task_ids: string[]; new_status: string }
        Returns: number
      }
      cleanup_stale_presence: {
        Args: Record<string, never>
        Returns: void
      }
    }
    Enums: {
      climate_zone: 'tropical' | 'subtropical' | 'mountain' | 'arid'
      project_type: 'residential' | 'commercial' | 'industrial' | 'infrastructure'
      task_status: 'pending' | 'in-progress' | 'completed' | 'on-hold'
      milestone_status: 'pending' | 'in-progress' | 'completed' | 'delayed'
      presence_status: 'online' | 'offline' | 'away'
      project_role: 'owner' | 'editor' | 'viewer'
    }
  }
}
