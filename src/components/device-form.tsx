import {
  type KeyboardTypeOptions,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import type { DeviceConfig } from "../types.ts";

interface Props {
  config: DeviceConfig;
  macError: string;
  onChange: (field: keyof DeviceConfig, value: string) => void;
}

interface FieldSpec {
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  key: keyof DeviceConfig;
  keyboardType: KeyboardTypeOptions;
  label: string;
  monospace?: boolean;
  optional?: boolean;
  placeholder: string;
}

const FIELDS: FieldSpec[] = [
  {
    key: "name",
    label: "Device Name",
    placeholder: "Gaming PC",
    keyboardType: "default",
    autoCapitalize: "words",
  },
  {
    key: "mac",
    label: "MAC Address",
    placeholder: "AA:BB:CC:DD:EE:FF",
    keyboardType: "default",
    autoCapitalize: "characters",
    monospace: true,
  },
  {
    key: "broadcastAddress",
    label: "Broadcast Address",
    placeholder: "192.168.1.255",
    keyboardType: "decimal-pad",
    autoCapitalize: "none",
  },
  {
    key: "port",
    label: "Port",
    placeholder: "9",
    keyboardType: "numeric",
  },
  {
    key: "ipAddress",
    label: "IP Address",
    placeholder: "192.168.1.100 (optional)",
    keyboardType: "decimal-pad",
    autoCapitalize: "none",
    optional: true,
  },
];

export default function DeviceForm({ config, macError, onChange }: Props) {
  return (
    <View style={styles.container}>
      {FIELDS.map((field) => (
        <View key={field.key} style={styles.fieldWrapper}>
          <Text style={styles.label}>
            {field.label}
            {field.optional && (
              <Text style={styles.optionalTag}> (optional)</Text>
            )}
          </Text>
          <TextInput
            autoCapitalize={field.autoCapitalize ?? "none"}
            autoCorrect={false}
            keyboardType={field.keyboardType}
            onChangeText={(val) => onChange(field.key, val)}
            placeholder={field.placeholder}
            placeholderTextColor="#555"
            spellCheck={false}
            style={[
              styles.input,
              field.monospace && styles.monospace,
              field.key === "mac" && macError ? styles.inputError : null,
            ]}
            value={config[field.key]}
          />
          {field.key === "mac" && macError ? (
            <Text style={styles.errorText}>{macError}</Text>
          ) : null}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 8,
  },
  fieldWrapper: {
    marginBottom: 14,
  },
  label: {
    color: "#AAAAAA",
    fontSize: 12,
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  optionalTag: {
    color: "#555",
    fontSize: 11,
    textTransform: "none",
  },
  input: {
    backgroundColor: "#1E1E1E",
    borderWidth: 1,
    borderColor: "#333",
    borderRadius: 8,
    color: "#FFFFFF",
    fontSize: 15,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  monospace: {
    fontFamily: "monospace",
    letterSpacing: 1,
  },
  inputError: {
    borderColor: "#EF5350",
  },
  errorText: {
    color: "#EF5350",
    fontSize: 12,
    marginTop: 4,
  },
});
