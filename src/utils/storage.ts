import AsyncStorage from "@react-native-async-storage/async-storage";
import DefaultPreference from "react-native-default-preference";
import type { DeviceConfig } from "../types.ts";

const STORAGE_KEY = "@wol_device_config";
// Must match PREFS_NAME in WolWidget.kt
const PREFS_GROUP = "com.wakeonlan_preferences";

export async function saveConfig(config: DeviceConfig): Promise<void> {
  // Save to AsyncStorage for the app UI
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(config));

  // Write individual fields to SharedPreferences so the home screen widget can read them
  await DefaultPreference.setName(PREFS_GROUP);
  await DefaultPreference.set("wol_name", config.name);
  await DefaultPreference.set("wol_mac", config.mac);
  await DefaultPreference.set("wol_broadcastAddress", config.broadcastAddress);
  await DefaultPreference.set("wol_port", config.port);
}

export async function loadConfig(): Promise<DeviceConfig | null> {
  const json = await AsyncStorage.getItem(STORAGE_KEY);
  if (!json) {
    return null;
  }
  try {
    return JSON.parse(json) as DeviceConfig;
  } catch {
    return null;
  }
}
