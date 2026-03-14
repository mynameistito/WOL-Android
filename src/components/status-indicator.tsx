import { StyleSheet, Text, View } from "react-native";

export type Status = "idle" | "sending" | "success" | "error";

interface Props {
  message: string;
  status: Status;
}

const STATUS_COLOR: Record<Status, string> = {
  idle: "transparent",
  sending: "#FFA726",
  success: "#66BB6A",
  error: "#EF5350",
};

const DOT_CHAR: Record<Status, string> = {
  idle: "",
  sending: "●",
  success: "●",
  error: "✗",
};

export default function StatusIndicator({ status, message }: Props) {
  if (status === "idle") {
    return null;
  }

  return (
    <View style={[styles.container, { borderColor: STATUS_COLOR[status] }]}>
      <Text style={[styles.dot, { color: STATUS_COLOR[status] }]}>
        {DOT_CHAR[status]}
      </Text>
      <Text style={[styles.message, { color: STATUS_COLOR[status] }]}>
        {message}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginVertical: 4,
  },
  dot: {
    fontSize: 14,
  },
  message: {
    fontSize: 14,
    fontWeight: "500",
    flexShrink: 1,
  },
});
