import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface Props {
  onPress: () => void;
  sending: boolean;
}

export default function WakeButton({ onPress, sending }: Props) {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      disabled={sending}
      onPress={onPress}
      style={[styles.button, sending && styles.buttonDisabled]}
    >
      {sending ? (
        <View style={styles.row}>
          <ActivityIndicator color="#FFFFFF" size="small" />
          <Text style={[styles.label, styles.labelSending]}>Sending…</Text>
        </View>
      ) : (
        <Text style={styles.label}>WAKE UP</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: "#1E88E5",
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 8,
  },
  buttonDisabled: {
    backgroundColor: "#1565C0",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  label: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  labelSending: {
    fontSize: 15,
  },
});
