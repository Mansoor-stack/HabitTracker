import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';

import { useThemeStore, useHabitsStore, useAuthStore } from '../../src/stores';
import { HabitCard, AddHabitModal } from '../../src/components';
import { Habit } from '../../src/types';

const { width: screenWidth } = Dimensions.get('window');
const isTablet = screenWidth >= 600;

export default function TodayScreen() {
  const { themeConfig } = useThemeStore();
  const { user, profile } = useAuthStore();
  const { 
    habits, 
    completions, 
    fetchHabits, 
    fetchCompletions, 
    deleteHabit,
    calculateStreak,
    isLoading 
  } = useHabitsStore();

  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);

  const today = new Date().toISOString().split('T')[0];
  const dayOfWeek = new Date().getDay();

  // Filter habits for today
  const todaysHabits = habits.filter((habit) => {
    if (habit.frequency === 'daily') return true;
    if (habit.frequency === 'weekly' && habit.target_days) {
      return habit.target_days.includes(dayOfWeek);
    }
    return true; // Show custom frequency habits every day
  });

  // Calculate completion stats
  const completedToday = todaysHabits.filter(
    (habit) => completions[`${habit.id}_${today}`]
  ).length;
  const completionRate = todaysHabits.length > 0 
    ? Math.round((completedToday / todaysHabits.length) * 100) 
    : 0;

  // Fetch data on focus
  useFocusEffect(
    useCallback(() => {
      if (user) {
        fetchHabits();
        fetchCompletions();
      }
    }, [user])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchHabits(), fetchCompletions()]);
    setRefreshing(false);
  };

  const handleEditHabit = (habit: Habit) => {
    setEditingHabit(habit);
    setShowAddModal(true);
  };

  const handleDeleteHabit = (habit: Habit) => {
    Alert.alert(
      'Delete Habit',
      `Are you sure you want to delete "${habit.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteHabit(habit.id);
            } catch (error: any) {
              Alert.alert('Error', error.message);
            }
          },
        },
      ]
    );
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setEditingHabit(null);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const formatDate = () => {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: themeConfig.colors.bgPrimary }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ 
          padding: 16,
          paddingBottom: 100,
          maxWidth: isTablet ? 700 : undefined,
          alignSelf: isTablet ? 'center' : undefined,
          width: isTablet ? '100%' : undefined,
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={themeConfig.colors.primary}
          />
        }
      >
        {/* Greeting Section */}
        <View style={{ marginBottom: 24 }}>
          <Text style={{ 
            fontSize: 28, 
            fontWeight: '700', 
            color: themeConfig.colors.textPrimary,
            marginBottom: 4,
          }}>
            {getGreeting()}, {profile?.name?.split(' ')[0] || 'there'}! 👋
          </Text>
          <Text style={{ fontSize: 16, color: themeConfig.colors.textSecondary }}>
            {formatDate()}
          </Text>
        </View>

        {/* Progress Card */}
        <View
          style={{
            backgroundColor: themeConfig.colors.primary,
            borderRadius: 20,
            padding: 20,
            marginBottom: 24,
            shadowColor: themeConfig.colors.primary,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 5,
          }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View>
              <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14, marginBottom: 4 }}>
                Today's Progress
              </Text>
              <Text style={{ color: '#fff', fontSize: 32, fontWeight: '700' }}>
                {completedToday}/{todaysHabits.length}
              </Text>
              <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14, marginTop: 4 }}>
                habits completed
              </Text>
            </View>
            
            {/* Circular Progress */}
            <View style={{ alignItems: 'center' }}>
              <View
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 40,
                  borderWidth: 6,
                  borderColor: 'rgba(255,255,255,0.3)',
                  justifyContent: 'center',
                  alignItems: 'center',
                  backgroundColor: 'rgba(255,255,255,0.1)',
                }}
              >
                <Text style={{ color: '#fff', fontSize: 24, fontWeight: '700' }}>
                  {completionRate}%
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Today's Habits Section */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Text style={{ 
            fontSize: 20, 
            fontWeight: '700', 
            color: themeConfig.colors.textPrimary 
          }}>
            Today's Habits
          </Text>
          <TouchableOpacity
            onPress={() => setShowAddModal(true)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: themeConfig.colors.primary,
              paddingHorizontal: 14,
              paddingVertical: 8,
              borderRadius: 20,
              gap: 6,
            }}
          >
            <Ionicons name="add" size={18} color="#fff" />
            <Text style={{ color: '#fff', fontWeight: '600', fontSize: 14 }}>
              Add
            </Text>
          </TouchableOpacity>
        </View>

        {/* Habits List */}
        {isLoading && habits.length === 0 ? (
          <View style={{ alignItems: 'center', paddingVertical: 40 }}>
            <Text style={{ color: themeConfig.colors.textSecondary }}>
              Loading habits...
            </Text>
          </View>
        ) : todaysHabits.length === 0 ? (
          <View 
            style={{ 
              alignItems: 'center', 
              paddingVertical: 60,
              backgroundColor: themeConfig.colors.bgSecondary,
              borderRadius: 20,
              borderWidth: 1,
              borderColor: themeConfig.colors.border,
            }}
          >
            <Ionicons 
              name="sparkles-outline" 
              size={48} 
              color={themeConfig.colors.textSecondary} 
            />
            <Text 
              style={{ 
                color: themeConfig.colors.textPrimary, 
                fontSize: 18, 
                fontWeight: '600',
                marginTop: 16,
                marginBottom: 8,
              }}
            >
              No habits yet
            </Text>
            <Text 
              style={{ 
                color: themeConfig.colors.textSecondary, 
                fontSize: 14,
                textAlign: 'center',
                paddingHorizontal: 40,
                marginBottom: 20,
              }}
            >
              Start building better habits today. Add your first habit to get started!
            </Text>
            <TouchableOpacity
              onPress={() => setShowAddModal(true)}
              style={{
                backgroundColor: themeConfig.colors.primary,
                paddingHorizontal: 24,
                paddingVertical: 12,
                borderRadius: 24,
              }}
            >
              <Text style={{ color: '#fff', fontWeight: '600', fontSize: 16 }}>
                Create First Habit
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {todaysHabits.map((habit) => (
              <HabitCard
                key={habit.id}
                habit={habit}
                isCompleted={!!completions[`${habit.id}_${today}`]}
                streak={calculateStreak(habit.id)}
                onPress={() => handleEditHabit(habit)}
                onLongPress={() => handleDeleteHabit(habit)}
              />
            ))}
            
            {/* Completion celebration */}
            {completedToday === todaysHabits.length && todaysHabits.length > 0 && (
              <View 
                style={{ 
                  alignItems: 'center', 
                  paddingVertical: 24,
                  marginTop: 8,
                }}
              >
                <Text style={{ fontSize: 40, marginBottom: 8 }}>🎉</Text>
                <Text 
                  style={{ 
                    color: themeConfig.colors.primary, 
                    fontSize: 18, 
                    fontWeight: '700',
                  }}
                >
                  All habits completed!
                </Text>
                <Text 
                  style={{ 
                    color: themeConfig.colors.textSecondary, 
                    fontSize: 14,
                    marginTop: 4,
                  }}
                >
                  Great job staying on track today
                </Text>
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Add/Edit Habit Modal */}
      <AddHabitModal
        visible={showAddModal}
        onClose={handleCloseModal}
        editHabit={editingHabit}
      />
    </View>
  );
}
