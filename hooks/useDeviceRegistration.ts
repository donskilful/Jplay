import { useEffect } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Device from 'expo-device';
import * as Localization from 'expo-localization';
import { BACKEND_URL } from '../constants/config';

const KEY = '@jsplay_device_id';

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

export function useDeviceRegistration(): void {
  useEffect(() => {
    void (async () => {
      try {
        let deviceId = await AsyncStorage.getItem(KEY);
        if (!deviceId) {
          deviceId = generateId();
          await AsyncStorage.setItem(KEY, deviceId);
        }

        const region = Localization.getLocales()[0]?.regionCode ?? null;

        await fetch(`${BACKEND_URL}/devices`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            deviceId,
            platform: Platform.OS,
            deviceName: Device.deviceName ?? null,
            region,
          }),
        });
      } catch {
        // silently fail — tracking is non-critical
      }
    })();
  }, []);
}
