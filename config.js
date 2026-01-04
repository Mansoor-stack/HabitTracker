// Supabase Configuration
// Replace these with your actual Supabase project credentials
const SUPABASE_URL = 'https://cypzfugpznoyxxnjtuji.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_0Cz5EjaY2d1DNvyCWZHXmg_RG-qi_D3';

// Initialize Supabase client
// Using a different variable name to avoid conflict with the supabase library global
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Export for use in other files
window.supabaseClient = supabaseClient;
