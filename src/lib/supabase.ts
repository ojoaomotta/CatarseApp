import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ltvqklvtoufhracpwmor.supabase.co';
const supabaseAnonKey = 'sb_publishable_uFkOQNB6eZF4FRBemyt7-A_fx9_ENMt';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
