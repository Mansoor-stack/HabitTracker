// Authentication Store
import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { User, Profile } from '../types';

interface AuthState {
  user: User | null;
  profile: Profile | null;
  session: any | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  
  // Actions
  initialize: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, name?: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  updatePassword: (password: string) => Promise<{ error: Error | null }>;
  fetchProfile: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: Error | null }>;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  session: null,
  isLoading: true,
  isAuthenticated: false,

  initialize: async () => {
    try {
      set({ isLoading: true });
      
      // Add timeout for web - getSession can hang
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Session timeout')), 5000)
      );
      
      try {
        // Get current session with timeout
        const { data: { session }, error } = await Promise.race([
          supabase.auth.getSession(),
          timeoutPromise,
        ]) as any;
        
        if (error) throw error;
        
        if (session?.user) {
          set({ 
            user: session.user as User,
            session,
            isAuthenticated: true,
          });
          
          // Fetch profile
          await get().fetchProfile();
        }
      } catch (sessionError) {
        console.log('Session check skipped:', sessionError);
        // Continue without session - user can login
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
    } finally {
      set({ isLoading: false });
    }
    
    // Listen for auth changes
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        set({
          user: session.user as User,
          session,
          isAuthenticated: true,
        });
        await get().fetchProfile();
      } else if (event === 'SIGNED_OUT') {
        set({
          user: null,
          profile: null,
          session: null,
          isAuthenticated: false,
        });
      } else if (event === 'TOKEN_REFRESHED' && session) {
        set({ session });
      }
    });
  },

  signIn: async (email: string, password: string) => {
    try {
      set({ isLoading: true });
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      
      if (data.user) {
        set({
          user: data.user as User,
          session: data.session,
          isAuthenticated: true,
        });
        await get().fetchProfile();
      }
      
      return { error: null };
    } catch (error) {
      console.error('Sign in error:', error);
      return { error: error as Error };
    } finally {
      set({ isLoading: false });
    }
  },

  signUp: async (email: string, password: string, name?: string) => {
    try {
      set({ isLoading: true });
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name },
        },
      });
      
      if (error) throw error;
      
      if (data.user) {
        set({
          user: data.user as User,
          session: data.session,
          isAuthenticated: true,
        });
      }
      
      return { error: null };
    } catch (error) {
      console.error('Sign up error:', error);
      return { error: error as Error };
    } finally {
      set({ isLoading: false });
    }
  },

  signOut: async () => {
    try {
      set({ isLoading: true });
      await supabase.auth.signOut();
      set({
        user: null,
        profile: null,
        session: null,
        isAuthenticated: false,
      });
    } catch (error) {
      console.error('Sign out error:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  resetPassword: async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'habitflow://reset-password',
      });
      
      if (error) throw error;
      return { error: null };
    } catch (error) {
      console.error('Reset password error:', error);
      return { error: error as Error };
    }
  },

  updatePassword: async (password: string) => {
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      return { error: null };
    } catch (error) {
      console.error('Update password error:', error);
      return { error: error as Error };
    }
  },

  fetchProfile: async () => {
    const { user } = get();
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        set({ profile: data as Profile });
      }
    } catch (error) {
      console.error('Fetch profile error:', error);
    }
  },

  updateProfile: async (updates: Partial<Profile>) => {
    const { user } = get();
    if (!user) return { error: new Error('Not authenticated') };
    
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          ...updates,
          updated_at: new Date().toISOString(),
        });
      
      if (error) throw error;
      
      // Update local state
      set(state => ({
        profile: state.profile ? { ...state.profile, ...updates } : null,
      }));
      
      return { error: null };
    } catch (error) {
      console.error('Update profile error:', error);
      return { error: error as Error };
    }
  },

  setLoading: (loading: boolean) => set({ isLoading: loading }),
}));
