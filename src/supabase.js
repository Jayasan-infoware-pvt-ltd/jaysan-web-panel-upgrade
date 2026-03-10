import { createClient } from '@supabase/supabase-js'

// These should be in a .env file locally
// VITE_SUPABASE_URL=your_project_url
// VITE_SUPABASE_ANON_KEY=your_anon_key

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://bdeunlnorxdjbswfckhx.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_zXvQAX4BAqBCdf_9yswoLA_i5qNT8V7';

export const supabase = createClient(supabaseUrl, supabaseKey);
