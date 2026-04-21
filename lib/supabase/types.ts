export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export interface Database {
  public: {
    Tables: {
      workspaces: {
        Row: {
          id: string
          name: string
          description: string | null
          status: 'live' | 'draft' | 'private'
          owner_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          status?: 'live' | 'draft' | 'private'
          owner_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          name?: string
          description?: string | null
          status?: 'live' | 'draft' | 'private'
          updated_at?: string
        }
      }
      datasets: {
        Row: {
          id: string
          workspace_id: string
          name: string
          original_filename: string
          row_count: number
          column_count: number
          columns: Json
          storage_path: string
          uploaded_at: string
        }
        Insert: {
          id?: string
          workspace_id: string
          name: string
          original_filename: string
          row_count: number
          column_count: number
          columns: Json
          storage_path: string
          uploaded_at?: string
        }
        Update: {
          name?: string
        }
      }
      dataset_rows: {
        Row: {
          id: string
          dataset_id: string
          row_index: number
          data: Json
        }
        Insert: {
          id?: string
          dataset_id: string
          row_index: number
          data: Json
        }
        Update: never
      }
      charts: {
        Row: {
          id: string
          workspace_id: string
          dataset_id: string
          title: string
          subtitle: string | null
          type: 'bar' | 'line' | 'area' | 'donut' | 'pie' | 'scatter'
          config: Json
          size: 'sm' | 'md' | 'lg'
          palette: string
          position: number
          created_at: string
        }
        Insert: {
          id?: string
          workspace_id: string
          dataset_id: string
          title: string
          subtitle?: string | null
          type: 'bar' | 'line' | 'area' | 'donut' | 'pie' | 'scatter'
          config?: Json
          size?: 'sm' | 'md' | 'lg'
          palette?: string
          position?: number
          created_at?: string
        }
        Update: {
          title?: string
          subtitle?: string | null
          type?: 'bar' | 'line' | 'area' | 'donut' | 'pie' | 'scatter'
          config?: Json
          size?: 'sm' | 'md' | 'lg'
          palette?: string
          position?: number
        }
      }
      workspace_members: {
        Row: {
          id: string
          workspace_id: string
          user_id: string
          email: string
          role: 'owner' | 'editor' | 'viewer'
          joined_at: string
        }
        Insert: {
          id?: string
          workspace_id: string
          user_id?: string
          email: string
          role?: 'owner' | 'editor' | 'viewer'
          joined_at?: string
        }
        Update: {
          role?: 'owner' | 'editor' | 'viewer'
        }
      }
    }
  }
}

export type Workspace = Database['public']['Tables']['workspaces']['Row']
export type Dataset = Database['public']['Tables']['datasets']['Row']
export type DatasetRow = Database['public']['Tables']['dataset_rows']['Row']
export type Chart = Database['public']['Tables']['charts']['Row']
export type WorkspaceMember = Database['public']['Tables']['workspace_members']['Row']

export type ChartType = 'bar' | 'line' | 'area' | 'donut' | 'pie' | 'scatter'
export type ChartSize = 'sm' | 'md' | 'lg'
