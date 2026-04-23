export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          updated_at?: string
        }
        Relationships: []
      }
      accounts: {
        Row: {
          id: string
          user_id: string
          name: string
          type: 'checking' | 'savings' | 'digital_wallet' | 'credit_card'
          color: string
          balance: number
          currency: string
          closing_day: number | null
          due_day: number | null
          created_at: string
          updated_at: string
          archived_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          type: 'checking' | 'savings' | 'digital_wallet' | 'credit_card'
          color?: string
          balance?: number
          currency?: string
          closing_day?: number | null
          due_day?: number | null
          created_at?: string
          updated_at?: string
          archived_at?: string | null
        }
        Update: {
          name?: string
          type?: 'checking' | 'savings' | 'digital_wallet' | 'credit_card'
          color?: string
          balance?: number
          currency?: string
          closing_day?: number | null
          due_day?: number | null
          updated_at?: string
          archived_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'accounts_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      transactions: {
        Row: {
          id: string
          user_id: string
          account_id: string
          amount: number
          date: string
          description: string
          type: 'expense' | 'income'
          status: 'paid' | 'pending'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          account_id: string
          amount: number
          date: string
          description?: string
          type: 'expense' | 'income'
          status?: 'paid' | 'pending'
          created_at?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          date?: string
          description?: string
          type?: 'expense' | 'income'
          status?: 'paid' | 'pending'
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'transactions_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'transactions_account_id_fkey'
            columns: ['account_id']
            isOneToOne: false
            referencedRelation: 'accounts'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}
