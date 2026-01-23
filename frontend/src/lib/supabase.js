import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://qtwljshvyuskquniylfu.supabase.co'
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_h17IwC6X8TBwaemDEpXJsg_ffkCLCOM'

export const supabase = createClient(supabaseUrl, supabaseKey)
