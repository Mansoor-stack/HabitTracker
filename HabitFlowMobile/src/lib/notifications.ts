// Push Notifications Service
// Note: expo-notifications requires a development build, not Expo Go
import { Platform } from 'react-native';
import { supabase } from './supabase';

// Lazy load notifications to avoid breaking Expo Go
let NotificationsModule: typeof import('expo-notifications') | null = null;
let DeviceModule: typeof import('expo-device') | null = null;
let isInitialized = false;

const loadNotificationModules = async (): Promise<boolean> => {
  if (isInitialized) return NotificationsModule !== null;
  isInitialized = true;
  
  try {
    NotificationsModule = await import('expo-notifications');
    DeviceModule = await import('expo-device');
    
    // Configure notification behavior
    NotificationsModule.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
    return true;
  } catch (e) {
    console.log('Notifications not available (Expo Go mode)');
    return false;
  }
};

export interface NotificationSettings {
  enabled: boolean;
  time: string; // HH:MM format
}

class PushNotificationService {
  private expoPushToken: string | null = null;

  // Check if notifications are available
  async isAvailable(): Promise<boolean> {
    return await loadNotificationModules();
  }

  // Register for push notifications
  async registerForPushNotifications(): Promise<string | null> {
    const available = await loadNotificationModules();
    if (!available || !NotificationsModule || !DeviceModule) {
      console.log('Notifications not available');
      return null;
    }

    if (!DeviceModule.isDevice) {
      console.log('Push notifications require a physical device');
      return null;
    }

    try {
      // Check existing permissions
      const { status: existingStatus } = await NotificationsModule.getPermissionsAsync();
      let finalStatus = existingStatus;

      // Request permissions if not granted
      if (existingStatus !== 'granted') {
        const { status } = await NotificationsModule.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Push notification permissions not granted');
        return null;
      }

      // Get the token
      const token = await NotificationsModule.getExpoPushTokenAsync({
        projectId: 'your-eas-project-id', // Replace with your EAS project ID
      });

      this.expoPushToken = token.data;

      // Configure Android channel
      if (Platform.OS === 'android') {
        await NotificationsModule.setNotificationChannelAsync('habit-reminders', {
          name: 'Habit Reminders',
          importance: NotificationsModule.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#6366f1',
          sound: 'default',
        });
      }

      return this.expoPushToken;
    } catch (error) {
      console.error('Error registering for push notifications:', error);
      return null;
    }
  }

  // Save push token to server
  async savePushTokenToServer(userId: string, token: string): Promise<void> {
    try {
      await supabase
        .from('profiles')
        .update({
          push_token: token,
          last_platform: Platform.OS,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);
    } catch (error) {
      console.error('Error saving push token:', error);
    }
  }

  // Schedule a daily reminder
  async scheduleDailyReminder(time: string, habitNames: string[]): Promise<string | null> {
    const available = await loadNotificationModules();
    if (!available || !NotificationsModule) return null;

    try {
      // Cancel existing reminders first
      await this.cancelAllReminders();

      const [hours, minutes] = time.split(':').map(Number);

      const trigger = {
        type: 'daily' as const,
        hour: hours,
        minute: minutes,
      };

      const habitList = habitNames.length > 0 
        ? habitNames.slice(0, 3).join(', ') + (habitNames.length > 3 ? '...' : '')
        : 'your habits';

      const id = await NotificationsModule.scheduleNotificationAsync({
        content: {
          title: '⏰ Time to build good habits!',
          body: `Don't forget to complete ${habitList} today.`,
          data: { type: 'daily-reminder' },
          sound: 'default',
        },
        trigger,
      });

      return id;
    } catch (error) {
      console.error('Error scheduling daily reminder:', error);
      return null;
    }
  }

  // Cancel all scheduled reminders
  async cancelAllReminders(): Promise<void> {
    const available = await loadNotificationModules();
    if (!available || !NotificationsModule) return;

    try {
      await NotificationsModule.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error canceling reminders:', error);
    }
  }

  // Get all scheduled notifications
  async getScheduledNotifications(): Promise<any[]> {
    const available = await loadNotificationModules();
    if (!available || !NotificationsModule) return [];

    try {
      return await NotificationsModule.getAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error getting scheduled notifications:', error);
      return [];
    }
  }

  // Add notification listeners
  addNotificationListeners(
    onReceived?: (notification: any) => void,
    onResponse?: (response: any) => void
  ): () => void {
    // Return empty cleanup if not available
    if (!NotificationsModule) {
      return () => {};
    }

    const receivedListener = NotificationsModule.addNotificationReceivedListener((notification) => {
      console.log('Notification received:', notification);
      onReceived?.(notification);
    });

    const responseListener = NotificationsModule.addNotificationResponseReceivedListener((response) => {
      console.log('Notification response:', response);
      onResponse?.(response);
    });

    // Return cleanup function
    return () => {
      receivedListener.remove();
      responseListener.remove();
    };
  }

  // Send a local notification immediately (for testing)
  async sendTestNotification(): Promise<void> {
    const available = await loadNotificationModules();
    if (!available || !NotificationsModule) return;

    await NotificationsModule.scheduleNotificationAsync({
      content: {
        title: '🎉 Test Notification',
        body: 'Push notifications are working!',
        sound: 'default',
      },
      trigger: null, // Immediate
    });
  }
}

export const pushNotificationService = new PushNotificationService();
export default pushNotificationService;
