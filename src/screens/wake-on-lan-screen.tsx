import { useCallback, useEffect, useRef, useState } from "react";
import {
  NativeModules,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import DeviceForm from "../components/device-form.tsx";
import StatusIndicator, {
  type Status,
} from "../components/status-indicator.tsx";
import WakeButton from "../components/wake-button.tsx";
import type { DeviceConfig } from "../types.ts";
import { normalizeMac } from "../utils/magic-packet.ts";
import { loadConfig, saveConfig } from "../utils/storage.ts";
import { sendWakePacket } from "../utils/udp-send.ts";

const MAC_STRIP_REGEX = /[:-]/g;
const MAC_VALID_REGEX = /^[0-9A-Fa-f]+$/;

function validateMac(mac: string): boolean {
  const cleanMac = mac.replace(MAC_STRIP_REGEX, "");
  return cleanMac.length === 12 && MAC_VALID_REGEX.test(cleanMac);
}

const DEFAULT_CONFIG: DeviceConfig = {
  name: "",
  mac: "",
  broadcastAddress: "255.255.255.255",
  port: "9",
  ipAddress: "",
};

export default function WakeOnLanScreen() {
  const [config, setConfig] = useState<DeviceConfig>(DEFAULT_CONFIG);
  const [macError, setMacError] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [statusMessage, setStatusMessage] = useState("");
  const clearTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    loadConfig()
      .then((saved) => {
        if (saved) {
          setConfig({ ...DEFAULT_CONFIG, ...saved });
        }
      })
      .catch(() => {
        // Silently fall back to defaults on load failure
      });
    return () => {
      if (clearTimer.current) {
        clearTimeout(clearTimer.current);
      }
    };
  }, []);

  const handleChange = useCallback(
    (field: keyof DeviceConfig, value: string) => {
      setConfig((prev) => ({ ...prev, [field]: value }));
      if (field === "mac") {
        setMacError("");
      }
    },
    []
  );

  const showStatus = (s: Status, msg: string) => {
    setStatus(s);
    setStatusMessage(msg);
    if (clearTimer.current) {
      clearTimeout(clearTimer.current);
    }
    if (s !== "sending") {
      clearTimer.current = setTimeout(() => {
        setStatus("idle");
        setStatusMessage("");
      }, 5000);
    }
  };

  const validateAndSaveMac = async (): Promise<string | null> => {
    if (!validateMac(config.mac)) {
      setMacError("Invalid MAC address — use AA:BB:CC:DD:EE:FF");
      return null;
    }
    setMacError("");
    const normalized = normalizeMac(config.mac);
    const updatedConfig = { ...config, mac: normalized };
    setConfig(updatedConfig);
    try {
      await saveConfig(updatedConfig);
      NativeModules.WolWidgetModule?.refreshWidget?.();
      return normalized;
    } catch {
      setMacError("Failed to save configuration");
      return null;
    }
  };

  const handleSave = async () => {
    const normalized = await validateAndSaveMac();
    if (normalized === null) {
      return;
    }
    showStatus("success", "Config saved!");
  };

  const handleWake = async () => {
    const normalized = await validateAndSaveMac();
    if (normalized === null) {
      return;
    }

    showStatus("sending", "Sending magic packet…");
    try {
      await sendWakePacket(config.broadcastAddress, config.port, normalized);
      showStatus("success", "Magic packet sent!");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Network error";
      showStatus("error", msg);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        style={styles.scroll}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Wake on LAN</Text>
          <Text style={styles.subtitle}>
            Send a magic packet to wake your PC
          </Text>
        </View>

        <View style={styles.card}>
          <DeviceForm
            config={config}
            macError={macError}
            onChange={handleChange}
          />
        </View>

        <WakeButton onPress={handleWake} sending={status === "sending"} />

        <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
          <Text style={styles.saveButtonText}>Save</Text>
        </TouchableOpacity>

        <StatusIndicator message={statusMessage} status={status} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#111111",
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 24,
    marginTop: 8,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 26,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
  subtitle: {
    color: "#666",
    fontSize: 13,
    marginTop: 4,
  },
  saveButton: {
    borderWidth: 1,
    borderColor: "#444",
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: "center",
    marginBottom: 8,
  },
  saveButtonText: {
    color: "#AAAAAA",
    fontSize: 14,
    fontWeight: "600",
  },
  card: {
    backgroundColor: "#171717",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#222",
    marginBottom: 8,
  },
});
