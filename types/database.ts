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
          updated_at?: string
          archived_at?: string | null
        }
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
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}
