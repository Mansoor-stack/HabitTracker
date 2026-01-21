import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
  Switch,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Habit } from '../types';
import { useThemeStore, useHabitsStore, HabitFormData } from '../stores';

interface AddHabitModalProps {
  visible: boolean;
  onClose: () => void;
  editHabit?: Habit | null;
}

const DAYS_OF_WEEK = [
  { key: 0, label: 'Sun', short: 'S' },
  { key: 1, label: 'Mon', short: 'M' },
  { key: 2, label: 'Tue', short: 'T' },
  { key: 3, label: 'Wed', short: 'W' },
  { key: 4, label: 'Thu', short: 'T' },
  { key: 5, label: 'Fri', short: 'F' },
  { key: 6, label: 'Sat', short: 'S' },
];

const FREQUENCIES = [
  { key: 'daily', label: 'Daily', icon: 'calendar' },
  { key: 'weekly', label: 'Weekly', icon: 'calendar-outline' },
  { key: 'custom', label: 'Custom', icon: 'options' },
] as const;

export function AddHabitModal({ visible, onClose, editHabit }: AddHabitModalProps) {
  const { themeConfig } = useThemeStore();
  const { addHabit, updateHabit, isAdding, isUpdating } = useHabitsStore();

  const [name, setName] = useState(editHabit?.name || '');
  const [description, setDescription] = useState(editHabit?.description || '');
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'custom'>(
    editHabit?.frequency || 'daily'
  );
  const [targetDays, setTargetDays] = useState<number[]>(
    editHabit?.target_days || [1, 2, 3, 4, 5] // Default: Mon-Fri
  );
  const [targetCount, setTargetCount] = useState(editHabit?.target_count || 3);
  const [reminderEnabled, setReminderEnabled] = useState(!!editHabit?.reminder_time);
  const [reminderTime, setReminderTime] = useState(editHabit?.reminder_time || '09:00');

  const isEditing = !!editHabit;
  const isLoading = isAdding || isUpdating;

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a habit name');
      return;
    }

    const habitData: HabitFormData = {
      name: name.trim(),
      description: description.trim() || undefined,
      frequency,
      target_days: frequency === 'weekly' ? targetDays : undefined,
      target_count: frequency === 'custom' ? targetCount : undefined,
      reminder_time: reminderEnabled ? reminderTime : undefined,
    };

    try {
      if (isEditing) {
        await updateHabit(editHabit.id, habitData);
        Alert.alert('Success', 'Habit updated successfully');
      } else {
        await addHabit(habitData);
        Alert.alert('Success', 'Habit created successfully');
      }
      resetForm();
      onClose();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const resetForm = () => {
    setName('');
    setDescription('');
    setFrequency('daily');
    setTargetDays([1, 2, 3, 4, 5]);
    setTargetCount(3);
    setReminderEnabled(false);
    setReminderTime('09:00');
  };

  const toggleDay = (day: number) => {
    if (targetDays.includes(day)) {
      setTargetDays(targetDays.filter((d) => d !== day));
    } else {
      setTargetDays([...targetDays, day].sort());
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1, backgroundColor: themeConfig.colors.bgPrimary }}
      >
        {/* Header */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: 16,
            borderBottomWidth: 1,
            borderBottomColor: themeConfig.colors.border,
          }}
        >
          <TouchableOpacity onPress={onClose}>
            <Text style={{ color: themeConfig.colors.textSecondary, fontSize: 16 }}>
              Cancel
            </Text>
          </TouchableOpacity>
          <Text style={{ color: themeConfig.colors.textPrimary, fontSize: 18, fontWeight: '700' }}>
            {isEditing ? 'Edit Habit' : 'New Habit'}
          </Text>
          <TouchableOpacity onPress={handleSave} disabled={isLoading}>
            <Text style={{ color: themeConfig.colors.primary, fontSize: 16, fontWeight: '600' }}>
              {isLoading ? 'Saving...' : 'Save'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={{ flex: 1, padding: 16 }}>
          {/* Name Input */}
          <View style={{ marginBottom: 20 }}>
            <Text style={{ color: themeConfig.colors.textSecondary, fontSize: 14, marginBottom: 8 }}>
              Habit Name *
            </Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="e.g., Morning Exercise"
              placeholderTextColor={themeConfig.colors.textSecondary}
              style={{
                backgroundColor: themeConfig.colors.bgSecondary,
                borderRadius: 12,
                padding: 16,
                color: themeConfig.colors.textPrimary,
                fontSize: 16,
                borderWidth: 1,
                borderColor: themeConfig.colors.border,
              }}
            />
          </View>

          {/* Description Input */}
          <View style={{ marginBottom: 20 }}>
            <Text style={{ color: themeConfig.colors.textSecondary, fontSize: 14, marginBottom: 8 }}>
              Description (optional)
            </Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Add more details..."
              placeholderTextColor={themeConfig.colors.textSecondary}
              multiline
              numberOfLines={3}
              style={{
                backgroundColor: themeConfig.colors.bgSecondary,
                borderRadius: 12,
                padding: 16,
                color: themeConfig.colors.textPrimary,
                fontSize: 16,
                borderWidth: 1,
                borderColor: themeConfig.colors.border,
                minHeight: 80,
                textAlignVertical: 'top',
              }}
            />
          </View>

          {/* Frequency Selection */}
          <View style={{ marginBottom: 20 }}>
            <Text style={{ color: themeConfig.colors.textSecondary, fontSize: 14, marginBottom: 12 }}>
              Frequency
            </Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {FREQUENCIES.map((freq) => (
                <TouchableOpacity
                  key={freq.key}
                  onPress={() => setFrequency(freq.key)}
                  style={{
                    flex: 1,
                    backgroundColor:
                      frequency === freq.key
                        ? themeConfig.colors.primary
                        : themeConfig.colors.bgSecondary,
                    borderRadius: 12,
                    padding: 12,
                    alignItems: 'center',
                    borderWidth: 1,
                    borderColor:
                      frequency === freq.key
                        ? themeConfig.colors.primary
                        : themeConfig.colors.border,
                  }}
                >
                  <Ionicons
                    name={freq.icon as any}
                    size={20}
                    color={frequency === freq.key ? '#fff' : themeConfig.colors.textSecondary}
                  />
                  <Text
                    style={{
                      color: frequency === freq.key ? '#fff' : themeConfig.colors.textPrimary,
                      fontSize: 13,
                      fontWeight: '600',
                      marginTop: 4,
                    }}
                  >
                    {freq.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Weekly Day Selection */}
          {frequency === 'weekly' && (
            <View style={{ marginBottom: 20 }}>
              <Text style={{ color: themeConfig.colors.textSecondary, fontSize: 14, marginBottom: 12 }}>
                Target Days
              </Text>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                {DAYS_OF_WEEK.map((day) => (
                  <TouchableOpacity
                    key={day.key}
                    onPress={() => toggleDay(day.key)}
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      backgroundColor: targetDays.includes(day.key)
                        ? themeConfig.colors.primary
                        : themeConfig.colors.bgSecondary,
                      justifyContent: 'center',
                      alignItems: 'center',
                      borderWidth: 1,
                      borderColor: targetDays.includes(day.key)
                        ? themeConfig.colors.primary
                        : themeConfig.colors.border,
                    }}
                  >
                    <Text
                      style={{
                        color: targetDays.includes(day.key) ? '#fff' : themeConfig.colors.textPrimary,
                        fontSize: 14,
                        fontWeight: '600',
                      }}
                    >
                      {day.short}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Custom Target Count */}
          {frequency === 'custom' && (
            <View style={{ marginBottom: 20 }}>
              <Text style={{ color: themeConfig.colors.textSecondary, fontSize: 14, marginBottom: 12 }}>
                Times per week: {targetCount}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                <TouchableOpacity
                  onPress={() => setTargetCount(Math.max(1, targetCount - 1))}
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    backgroundColor: themeConfig.colors.bgSecondary,
                    justifyContent: 'center',
                    alignItems: 'center',
                    borderWidth: 1,
                    borderColor: themeConfig.colors.border,
                  }}
                >
                  <Ionicons name="remove" size={24} color={themeConfig.colors.textPrimary} />
                </TouchableOpacity>
                <View
                  style={{
                    flex: 1,
                    height: 8,
                    backgroundColor: themeConfig.colors.bgSecondary,
                    borderRadius: 4,
                    overflow: 'hidden',
                  }}
                >
                  <View
                    style={{
                      width: `${(targetCount / 7) * 100}%`,
                      height: '100%',
                      backgroundColor: themeConfig.colors.primary,
                      borderRadius: 4,
                    }}
                  />
                </View>
                <TouchableOpacity
                  onPress={() => setTargetCount(Math.min(7, targetCount + 1))}
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    backgroundColor: themeConfig.colors.bgSecondary,
                    justifyContent: 'center',
                    alignItems: 'center',
                    borderWidth: 1,
                    borderColor: themeConfig.colors.border,
                  }}
                >
                  <Ionicons name="add" size={24} color={themeConfig.colors.textPrimary} />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Reminder Toggle */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: themeConfig.colors.bgSecondary,
              borderRadius: 12,
              padding: 16,
              marginBottom: 20,
              borderWidth: 1,
              borderColor: themeConfig.colors.border,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Ionicons name="notifications-outline" size={22} color={themeConfig.colors.primary} />
              <Text style={{ color: themeConfig.colors.textPrimary, fontSize: 16 }}>
                Daily Reminder
              </Text>
            </View>
            <Switch
              value={reminderEnabled}
              onValueChange={setReminderEnabled}
              trackColor={{ false: themeConfig.colors.border, true: themeConfig.colors.primary }}
              thumbColor="#fff"
            />
          </View>

          {/* Spacer for keyboard */}
          <View style={{ height: 100 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}
