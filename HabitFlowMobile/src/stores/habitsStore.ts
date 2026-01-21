// Habits Store - Manages habit data and completions
import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { Habit } from '../types';

// Simplified form data for creating/updating habits
export interface HabitFormData {
  name: string;
  description?: string;
  frequency: 'daily' | 'weekly' | 'custom';
  target_days?: number[]; // For weekly: 0-6 (Sun-Sat)
  target_count?: number; // For custom: times per week
  reminder_time?: string;
}

interface HabitsState {
  habits: Habit[];
  completions: Record<string, boolean>; // { habitId_date: completed }
  isLoading: boolean;
  isAdding: boolean;
  isUpdating: boolean;
  isToggling: boolean;
  error: string | null;
  
  // Actions
  fetchHabits: () => Promise<void>;
  fetchCompletions: (startDate?: string, endDate?: string) => Promise<void>;
  addHabit: (data: HabitFormData) => Promise<Habit>;
  updateHabit: (id: string, data: Partial<HabitFormData>) => Promise<void>;
  deleteHabit: (id: string) => Promise<void>;
  toggleCompletion: (habitId: string, date?: string) => Promise<void>;
  calculateStreak: (habitId: string) => number;
  clearError: () => void;
}

// Get today's date in YYYY-MM-DD format
const getTodayDate = (): string => {
  return new Date().toISOString().split('T')[0];
};

// Get date 90 days ago
const getStartDate = (): string => {
  const date = new Date();
  date.setDate(date.getDate() - 90);
  return date.toISOString().split('T')[0];
};

export const useHabitsStore = create<HabitsState>((set, get) => ({
  habits: [],
  completions: {},
  isLoading: false,
  isAdding: false,
  isUpdating: false,
  isToggling: false,
  error: null,

  fetchHabits: async () => {
    try {
      set({ isLoading: true, error: null });
      
      const { data, error } = await supabase
        .from('habits')
        .select('*')
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      
      set({ habits: (data || []) as Habit[] });
    } catch (error) {
      console.error('Fetch habits error:', error);
      set({ error: (error as Error).message });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchCompletions: async (startDate?: string, endDate?: string) => {
    try {
      const start = startDate || getStartDate();
      const end = endDate || getTodayDate();
      
      const { data, error } = await supabase
        .from('completions')
        .select('*')
        .gte('date', start)
        .lte('date', end);
      
      if (error) throw error;
      
      // Transform to lookup object with habitId_date keys
      const completionsMap: Record<string, boolean> = {};
      
      (data || []).forEach((c: any) => {
        const key = `${c.habit_id}_${c.date}`;
        completionsMap[key] = c.completed;
      });
      
      set(state => ({
        completions: { ...state.completions, ...completionsMap },
      }));
    } catch (error) {
      console.error('Fetch completions error:', error);
    }
  },

  addHabit: async (data: HabitFormData) => {
    try {
      set({ isAdding: true, error: null });
      
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Not authenticated');
      
      const newHabit = {
        user_id: userData.user.id,
        name: data.name,
        description: data.description || null,
        frequency: data.frequency,
        target_days: data.target_days || null,
        target_count: data.target_count || null,
        reminder_time: data.reminder_time || null,
      };
      
      const { data: habit, error } = await supabase
        .from('habits')
        .insert(newHabit)
        .select()
        .single();
      
      if (error) throw error;
      
      set(state => ({
        habits: [...state.habits, habit as Habit],
      }));
      
      return habit as Habit;
    } catch (error) {
      console.error('Create habit error:', error);
      set({ error: (error as Error).message });
      throw error;
    } finally {
      set({ isAdding: false });
    }
  },

  updateHabit: async (id: string, data: Partial<HabitFormData>) => {
    try {
      set({ isUpdating: true, error: null });
      
      const updateData: any = { updated_at: new Date().toISOString() };
      if (data.name !== undefined) updateData.name = data.name;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.frequency !== undefined) updateData.frequency = data.frequency;
      if (data.target_days !== undefined) updateData.target_days = data.target_days;
      if (data.target_count !== undefined) updateData.target_count = data.target_count;
      if (data.reminder_time !== undefined) updateData.reminder_time = data.reminder_time;
      
      const { error } = await supabase
        .from('habits')
        .update(updateData)
        .eq('id', id);
      
      if (error) throw error;
      
      set(state => ({
        habits: state.habits.map(h => 
          h.id === id ? { ...h, ...updateData } : h
        ),
      }));
    } catch (error) {
      console.error('Update habit error:', error);
      set({ error: (error as Error).message });
      throw error;
    } finally {
      set({ isUpdating: false });
    }
  },

  deleteHabit: async (id: string) => {
    try {
      set({ isLoading: true, error: null });
      
      const { error } = await supabase
        .from('habits')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      set(state => ({
        habits: state.habits.filter(h => h.id !== id),
      }));
    } catch (error) {
      console.error('Delete habit error:', error);
      set({ error: (error as Error).message });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  toggleCompletion: async (habitId: string, date?: string) => {
    const targetDate = date || getTodayDate();
    const key = `${habitId}_${targetDate}`;
    const currentCompleted = get().completions[key] || false;
    const newCompleted = !currentCompleted;
    
    // Optimistic update
    set(state => ({
      isToggling: true,
      completions: {
        ...state.completions,
        [key]: newCompleted,
      },
    }));
    
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Not authenticated');
      
      if (newCompleted) {
        // Insert/upsert completion
        const { error } = await supabase
          .from('completions')
          .upsert({
            user_id: userData.user.id,
            habit_id: habitId,
            date: targetDate,
            completed: true,
          });
        
        if (error) throw error;
      } else {
        // Delete completion
        const { error } = await supabase
          .from('completions')
          .delete()
          .eq('habit_id', habitId)
          .eq('date', targetDate);
        
        if (error) throw error;
      }
    } catch (error) {
      console.error('Toggle completion error:', error);
      
      // Revert optimistic update
      set(state => ({
        completions: {
          ...state.completions,
          [key]: currentCompleted,
        },
      }));
      throw error;
    } finally {
      set({ isToggling: false });
    }
  },

  calculateStreak: (habitId: string) => {
    const { completions } = get();
    let streak = 0;
    let currentDate = new Date();
    
    // Go back through dates checking for consecutive completions
    while (true) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const key = `${habitId}_${dateStr}`;
      
      if (completions[key]) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        // If today is not completed, check if yesterday was to continue streak
        if (streak === 0) {
          currentDate.setDate(currentDate.getDate() - 1);
          const yesterdayKey = `${habitId}_${currentDate.toISOString().split('T')[0]}`;
          if (completions[yesterdayKey]) {
            streak++;
            currentDate.setDate(currentDate.getDate() - 1);
            continue;
          }
        }
        break;
      }
      
      // Safety limit
      if (streak > 365) break;
    }
    
    return streak;
  },

  clearError: () => set({ error: null }),
}));
