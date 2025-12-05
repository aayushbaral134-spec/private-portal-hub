import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://cdcxqitxntlxvkwsnxsk.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNkY3hxaXR4bnRseHZrd3NueHNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ5MDM2OTcsImV4cCI6MjA4MDQ3OTY5N30.awZuO4dFOM09HW_J5XuBPJc4Z5FuUy38irKtWbqlR5E'

// We set persistSession to false to ensure you are logged out on refresh.
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
  },
})