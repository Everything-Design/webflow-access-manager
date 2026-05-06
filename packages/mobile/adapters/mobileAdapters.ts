import { Platform, Vibration } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import * as Notifications from 'expo-notifications'
import * as Device from 'expo-device'
import type { PlatformAdapters } from '@wam/shared'

const storage = {
  async getItem(key: string) {
    return AsyncStorage.getItem(key)
  },
  async setItem(key: string, value: string) {
    await AsyncStorage.setItem(key, value)
  },
  async removeItem(key: string) {
    await AsyncStorage.removeItem(key)
  },
}

const notification = {
  async send(title: string, body: string, data?: Record<string, string>) {
    // Vibrate to get attention
    Vibration.vibrate(Platform.OS === 'ios' ? 500 : [0, 300, 100, 300])

    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: 'default',
        data: data ?? {},
        // iOS-specific
        ...(Platform.OS === 'ios' && {
          interruptionLevel: 'timeSensitive' as const,
        }),
      },
      trigger: null,
    })
  },
}

const device = {
  async getDeviceId() {
    return Device.deviceName ?? Device.modelName ?? 'unknown-device'
  },
}

export const mobileAdapters: PlatformAdapters = { storage, notification, device }
