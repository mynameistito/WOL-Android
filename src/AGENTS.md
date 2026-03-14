# React Native Source Notes

## Async Storage

- `JSON.parse()` throws on corrupted data. Wrap in try-catch and return `null` to fall back to defaults.
- Status timers should skip terminal states (`idle`, `success`, `error`) — not `sending`. Auto-clearing during an active operation re-enables buttons prematurely.
- Loaded config may be partial (missing fields from older versions). Always merge with defaults: `setConfig({ ...DEFAULT_CONFIG, ...saved })`.
- Async persistence functions (`saveConfig`) can fail silently. Wrap calls in try-catch and surface errors to UI state.

## Keyboard Types

- `keyboardType="numeric"` shows only digits on Android. Use `"decimal-pad"` for IP address inputs (needs `.` separator).

## MAC Address Handling

- `normalizeMac()` should validate length (12 chars after stripping) before formatting. Invalid input should return the original string, not malformed output.

## UI Components

- `SafeAreaView` from `react-native` is deprecated. Use `SafeAreaView` from `react-native-safe-area-context` (already installed).

## Network Operations

- Create sockets after successful packet construction. If the socket is created before and packet building fails, the socket may leak or need explicit cleanup.
