// Supabase Configuration
// Replace these with your actual Supabase project credentials
const SUPABASE_URL = 'https://cypzfugpznoyxxnjtuji.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_0Cz5EjaY2d1DNvyCWZHXmg_RG-qi_D3';

// Initialize Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Export for use in other files
window.supabaseClient = supabase;
