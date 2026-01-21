import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';

import { useThemeStore, useHabitsStore, useAuthStore } from '../../src/stores';

const { width: screenWidth } = Dimensions.get('window');
const isTablet = screenWidth >= 600;

type TimeFilter = '7d' | '30d' | '90d' | 'all';

export default function AnalyticsScreen() {
  const { themeConfig } = useThemeStore();
  const { user } = useAuthStore();
  const { habits, completions, fetchHabits, fetchCompletions, calculateStreak, isLoading } = useHabitsStore();

  const [refreshing, setRefreshing] = useState(false);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('30d');

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

  // Calculate date range based on filter
  const dateRange = useMemo(() => {
    const end = new Date();
    const start = new Date();
    switch (timeFilter) {
      case '7d':
        start.setDate(end.getDate() - 7);
        break;
      case '30d':
        start.setDate(end.getDate() - 30);
        break;
      case '90d':
        start.setDate(end.getDate() - 90);
        break;
      case 'all':
        start.setFullYear(2020);
        break;
    }
    return { start, end };
  }, [timeFilter]);

  // Calculate stats
  const stats = useMemo(() => {
    if (habits.length === 0) {
      return {
        totalCompletions: 0,
        averageCompletion: 0,
        currentStreak: 0,
        bestStreak: 0,
        habitStats: [],
      };
    }

    let totalCompletions = 0;
    let totalPossible = 0;
    let bestStreak = 0;
    const habitStats: Array<{
      id: string;
      name: string;
      completions: number;
      rate: number;
      streak: number;
    }> = [];

    habits.forEach((habit) => {
      const streak = calculateStreak(habit.id);
      if (streak > bestStreak) bestStreak = streak;

      let habitCompletions = 0;
      let habitPossible = 0;

      // Count completions within date range
      const current = new Date(dateRange.start);
      while (current <= dateRange.end) {
        const dateStr = current.toISOString().split('T')[0];
        const key = `${habit.id}_${dateStr}`;

        // Check if habit should be done this day
        const dayOfWeek = current.getDay();
        let shouldCount = false;
        if (habit.frequency === 'daily') {
          shouldCount = true;
        } else if (habit.frequency === 'weekly' && habit.target_days?.includes(dayOfWeek)) {
          shouldCount = true;
        } else if (habit.frequency === 'custom') {
          shouldCount = true; // Simplified: count all days for custom
        }

        if (shouldCount) {
          habitPossible++;
          if (completions[key]) {
            habitCompletions++;
            totalCompletions++;
          }
        }
        current.setDate(current.getDate() + 1);
      }

      totalPossible += habitPossible;

      habitStats.push({
        id: habit.id,
        name: habit.name,
        completions: habitCompletions,
        rate: habitPossible > 0 ? Math.round((habitCompletions / habitPossible) * 100) : 0,
        streak,
      });
    });

    // Sort by completion rate
    habitStats.sort((a, b) => b.rate - a.rate);

    return {
      totalCompletions,
      averageCompletion: totalPossible > 0 ? Math.round((totalCompletions / totalPossible) * 100) : 0,
      currentStreak: Math.max(...habits.map((h) => calculateStreak(h.id)), 0),
      bestStreak,
      habitStats,
    };
  }, [habits, completions, dateRange, calculateStreak]);

  const TIME_FILTERS: { key: TimeFilter; label: string }[] = [
    { key: '7d', label: '7 Days' },
    { key: '30d', label: '30 Days' },
    { key: '90d', label: '90 Days' },
    { key: 'all', label: 'All Time' },
  ];

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
        {/* Time Filter */}
        <View style={{ flexDirection: 'row', marginBottom: 20, gap: 8 }}>
          {TIME_FILTERS.map((filter) => (
            <TouchableOpacity
              key={filter.key}
              onPress={() => setTimeFilter(filter.key)}
              style={{
                flex: 1,
                paddingVertical: 10,
                paddingHorizontal: 12,
                borderRadius: 12,
                backgroundColor:
                  timeFilter === filter.key
                    ? themeConfig.colors.primary
                    : themeConfig.colors.bgSecondary,
                borderWidth: 1,
                borderColor:
                  timeFilter === filter.key
                    ? themeConfig.colors.primary
                    : themeConfig.colors.border,
                alignItems: 'center',
              }}
            >
              <Text
                style={{
                  color: timeFilter === filter.key ? '#fff' : themeConfig.colors.textPrimary,
                  fontWeight: '600',
                  fontSize: 13,
                }}
              >
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Stats Grid */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
          <StatCard
            themeConfig={themeConfig}
            icon="checkmark-circle"
            iconColor="#10B981"
            label="Completions"
            value={stats.totalCompletions.toString()}
          />
          <StatCard
            themeConfig={themeConfig}
            icon="trending-up"
            iconColor="#3B82F6"
            label="Avg. Rate"
            value={`${stats.averageCompletion}%`}
          />
          <StatCard
            themeConfig={themeConfig}
            icon="flame"
            iconColor="#F59E0B"
            label="Current Streak"
            value={`${stats.currentStreak} days`}
          />
          <StatCard
            themeConfig={themeConfig}
            icon="trophy"
            iconColor="#8B5CF6"
            label="Best Streak"
            value={`${stats.bestStreak} days`}
          />
        </View>

        {/* Habit Performance */}
        <Text
          style={{
            fontSize: 20,
            fontWeight: '700',
            color: themeConfig.colors.textPrimary,
            marginBottom: 16,
          }}
        >
          Habit Performance
        </Text>

        {habits.length === 0 ? (
          <View
            style={{
              alignItems: 'center',
              paddingVertical: 40,
              backgroundColor: themeConfig.colors.bgSecondary,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: themeConfig.colors.border,
            }}
          >
            <Ionicons name="bar-chart-outline" size={48} color={themeConfig.colors.textSecondary} />
            <Text
              style={{
                color: themeConfig.colors.textPrimary,
                fontSize: 16,
                fontWeight: '600',
                marginTop: 16,
              }}
            >
              No data yet
            </Text>
            <Text
              style={{
                color: themeConfig.colors.textSecondary,
                fontSize: 14,
                marginTop: 4,
                textAlign: 'center',
                paddingHorizontal: 32,
              }}
            >
              Add habits and track your progress to see analytics
            </Text>
          </View>
        ) : (
          stats.habitStats.map((habit, index) => (
            <View
              key={habit.id}
              style={{
                backgroundColor: themeConfig.colors.bgSecondary,
                borderRadius: 14,
                padding: 16,
                marginBottom: 12,
                borderWidth: 1,
                borderColor: themeConfig.colors.border,
              }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: '600',
                      color: themeConfig.colors.textPrimary,
                      marginBottom: 4,
                    }}
                  >
                    {habit.name}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <Text style={{ fontSize: 13, color: themeConfig.colors.textSecondary }}>
                      {habit.completions} completions
                    </Text>
                    {habit.streak > 0 && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Ionicons name="flame" size={14} color="#F59E0B" />
                        <Text style={{ fontSize: 13, color: '#F59E0B', fontWeight: '600' }}>
                          {habit.streak}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
                <View
                  style={{
                    backgroundColor: getProgressColor(habit.rate) + '20',
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 12,
                  }}
                >
                  <Text
                    style={{
                      color: getProgressColor(habit.rate),
                      fontWeight: '700',
                      fontSize: 16,
                    }}
                  >
                    {habit.rate}%
                  </Text>
                </View>
              </View>

              {/* Progress Bar */}
              <View
                style={{
                  height: 8,
                  backgroundColor: themeConfig.colors.border,
                  borderRadius: 4,
                  overflow: 'hidden',
                }}
              >
                <View
                  style={{
                    width: `${habit.rate}%`,
                    height: '100%',
                    backgroundColor: getProgressColor(habit.rate),
                    borderRadius: 4,
                  }}
                />
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

function getProgressColor(rate: number): string {
  if (rate >= 80) return '#10B981';
  if (rate >= 60) return '#3B82F6';
  if (rate >= 40) return '#F59E0B';
  return '#EF4444';
}

interface StatCardProps {
  themeConfig: any;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  iconColor: string;
  label: string;
  value: string;
}

function StatCard({ themeConfig, icon, iconColor, label, value }: StatCardProps) {
  return (
    <View
      style={{
        flex: 1,
        minWidth: '45%',
        backgroundColor: themeConfig.colors.bgSecondary,
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: themeConfig.colors.border,
      }}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 12,
          backgroundColor: iconColor + '20',
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: 12,
        }}
      >
        <Ionicons name={icon} size={22} color={iconColor} />
      </View>
      <Text
        style={{
          fontSize: 24,
          fontWeight: '700',
          color: themeConfig.colors.textPrimary,
          marginBottom: 4,
        }}
      >
        {value}
      </Text>
      <Text style={{ fontSize: 13, color: themeConfig.colors.textSecondary }}>
        {label}
      </Text>
    </View>
  );
}
