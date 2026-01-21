import React from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Habit } from '../types';
import { useThemeStore, useHabitsStore } from '../stores';

interface HabitCardProps {
  habit: Habit;
  isCompleted: boolean;
  streak: number;
  onPress?: () => void;
  onLongPress?: () => void;
}

export function HabitCard({ habit, isCompleted, streak, onPress, onLongPress }: HabitCardProps) {
  const { themeConfig } = useThemeStore();
  const { toggleCompletion, isToggling } = useHabitsStore();
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const handleToggle = async () => {
    // Animate the card
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    await toggleCompletion(habit.id);
  };

  const getFrequencyLabel = () => {
    switch (habit.frequency) {
      case 'daily':
        return 'Daily';
      case 'weekly':
        return `${habit.target_days?.length || 0} days/week`;
      case 'custom':
        return `${habit.target_count || 1}x per week`;
      default:
        return habit.frequency;
    }
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        onPress={onPress}
        onLongPress={onLongPress}
        activeOpacity={0.8}
        style={{
          backgroundColor: themeConfig.colors.bgSecondary,
          borderRadius: 16,
          padding: 16,
          marginBottom: 12,
          borderWidth: 1,
          borderColor: isCompleted ? themeConfig.colors.primary : themeConfig.colors.border,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {/* Completion Toggle */}
          <TouchableOpacity
            onPress={handleToggle}
            disabled={isToggling}
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              borderWidth: 2,
              borderColor: isCompleted ? themeConfig.colors.primary : themeConfig.colors.textSecondary,
              backgroundColor: isCompleted ? themeConfig.colors.primary : 'transparent',
              justifyContent: 'center',
              alignItems: 'center',
              marginRight: 14,
            }}
          >
            {isCompleted && (
              <Ionicons name="checkmark" size={24} color="#fff" />
            )}
          </TouchableOpacity>

          {/* Habit Info */}
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: 17,
                fontWeight: '600',
                color: isCompleted ? themeConfig.colors.textSecondary : themeConfig.colors.textPrimary,
                textDecorationLine: isCompleted ? 'line-through' : 'none',
                marginBottom: 4,
              }}
            >
              {habit.name}
            </Text>
            
            {habit.description && (
              <Text
                style={{
                  fontSize: 14,
                  color: themeConfig.colors.textSecondary,
                  marginBottom: 6,
                }}
                numberOfLines={1}
              >
                {habit.description}
              </Text>
            )}

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              {/* Frequency Badge */}
              <View
                style={{
                  backgroundColor: themeConfig.colors.primary + '20',
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  borderRadius: 8,
                }}
              >
                <Text style={{ fontSize: 12, color: themeConfig.colors.primary, fontWeight: '500' }}>
                  {getFrequencyLabel()}
                </Text>
              </View>

              {/* Streak */}
              {streak > 0 && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Ionicons name="flame" size={16} color="#FF6B35" />
                  <Text style={{ fontSize: 13, color: themeConfig.colors.textSecondary, fontWeight: '600' }}>
                    {streak} day{streak > 1 ? 's' : ''}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Arrow for detail view */}
          <Ionicons 
            name="chevron-forward" 
            size={20} 
            color={themeConfig.colors.textSecondary} 
          />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}
