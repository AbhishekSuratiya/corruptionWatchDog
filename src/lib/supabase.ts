import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://piivdfsycglbouofmhly.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBpaXZkZnN5Y2dsYm91b2ZtaGx5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTE0MTgwMywiZXhwIjoyMDY2NzE3ODAzfQ.U8KaxP3XH2eJguLojlL7lr-VRqRR4KWJ4c_2yMqXK5w';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
