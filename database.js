// ============================================
// Database Operations Module
// ============================================

// Load all user data from database
async function loadUserData() {
    if (!currentUser) return;
    
    try {
        showLoading(true);
        
        // Load habits
        const { data: habitsData, error: habitsError } = await supabaseClient
            .from('habits')
            .select('*')
            .eq('user_id', currentUser.id)
            .order('created_at', { ascending: true });

        if (habitsError) throw habitsError;
        
        habits = habitsData.map(h => ({
            id: h.id,
            name: h.name,
            description: h.description,
            category: h.category,
            frequency: h.frequency,
            days: h.days,
            color: h.color,
            icon: h.icon,
            createdAt: h.created_at,
            streak: h.streak || 0,
            bestStreak: h.best_streak || 0
        }));

        // Load completions
        const { data: completionsData, error: completionsError } = await supabaseClient
            .from('completions')
            .select('*')
            .eq('user_id', currentUser.id);

        if (completionsError) throw completionsError;
        
        completions = {};
        completionsData.forEach(c => {
            if (!completions[c.date]) {
                completions[c.date] = {};
            }
            completions[c.date][c.habit_id] = c.completed;
        });

        // Refresh UI
        refreshAll();
        
    } catch (error) {
        console.error('Error loading data:', error);
        showMessage('Error loading your data. Please refresh the page.', 'error');
    } finally {
        showLoading(false);
    }
}

// Save a new habit to database
async function saveHabitToDb(habit) {
    if (!currentUser) return null;
    
    try {
        const { data, error } = await supabaseClient
            .from('habits')
            .insert({
                user_id: currentUser.id,
                name: habit.name,
                description: habit.description,
                category: habit.category,
                frequency: habit.frequency,
                days: habit.days,
                color: habit.color,
                icon: habit.icon,
                streak: 0,
                best_streak: 0
            })
            .select()
            .single();

        if (error) throw error;
        
        return {
            id: data.id,
            name: data.name,
            description: data.description,
            category: data.category,
            frequency: data.frequency,
            days: data.days,
            color: data.color,
            icon: data.icon,
            createdAt: data.created_at,
            streak: data.streak || 0,
            bestStreak: data.best_streak || 0
        };
    } catch (error) {
        console.error('Error saving habit:', error);
        showMessage('Error saving habit. Please try again.', 'error');
        return null;
    }
}

// Update an existing habit
async function updateHabitInDb(habitId, updates) {
    if (!currentUser) return false;
    
    try {
        const { error } = await supabaseClient
            .from('habits')
            .update({
                name: updates.name,
                description: updates.description,
                category: updates.category,
                streak: updates.streak,
                best_streak: updates.bestStreak
            })
            .eq('id', habitId)
            .eq('user_id', currentUser.id);

        if (error) throw error;
        
        return true;
    } catch (error) {
        console.error('Error updating habit:', error);
        showMessage('Error updating habit. Please try again.', 'error');
        return false;
    }
}

// Delete a habit
async function deleteHabitFromDb(habitId) {
    if (!currentUser) return false;
    
    try {
        // Delete completions first
        await supabaseClient
            .from('completions')
            .delete()
            .eq('habit_id', habitId)
            .eq('user_id', currentUser.id);

        // Then delete the habit
        const { error } = await supabaseClient
            .from('habits')
            .delete()
            .eq('id', habitId)
            .eq('user_id', currentUser.id);

        if (error) throw error;
        
        return true;
    } catch (error) {
        console.error('Error deleting habit:', error);
        showMessage('Error deleting habit. Please try again.', 'error');
        return false;
    }
}

// Toggle habit completion
async function toggleCompletionInDb(habitId, date, completed) {
    if (!currentUser) return false;
    
    try {
        // Use upsert to insert or update
        const { error } = await supabaseClient
            .from('completions')
            .upsert({
                user_id: currentUser.id,
                habit_id: habitId,
                date: date,
                completed: completed
            }, {
                onConflict: 'user_id,habit_id,date'
            });

        if (error) throw error;
        
        return true;
    } catch (error) {
        console.error('Error saving completion:', error);
        showMessage('Error saving progress. Please try again.', 'error');
        return false;
    }
}

// Update habit streak in database
async function updateStreakInDb(habitId, streak, bestStreak) {
    if (!currentUser) return false;
    
    try {
        const { error } = await supabaseClient
            .from('habits')
            .update({
                streak: streak,
                best_streak: bestStreak
            })
            .eq('id', habitId)
            .eq('user_id', currentUser.id);

        if (error) throw error;
        
        return true;
    } catch (error) {
        console.error('Error updating streak:', error);
        return false;
    }
}

// Sync local data to database (for offline support)
async function syncToDatabase() {
    if (!currentUser) return;
    
    try {
        // This would sync any locally cached changes
        // Useful if you implement offline support later
        console.log('Data synced to database');
    } catch (error) {
        console.error('Sync error:', error);
    }
}
