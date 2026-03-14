# Android Development Notes

## SharedPreferences

- `react-native-default-preference` stores all values as strings. In Kotlin, use `getString()` with `toIntOrNull()` — `getInt()` throws `ClassCastException` on string values.
- `SharedPreferences.apply()` is async. Widget updates after `apply()` may read stale data — pass values directly or update in the background thread after write completes.

## AppWidget

- AppWidgets do NOT auto-refresh when SharedPreferences changes. Must call `AppWidgetManager.updateAppWidget()` explicitly after config changes.
- Exported receivers with custom broadcast actions are callable by any app. Use signature-level permissions: `<permission android:name="..." android:protectionLevel="signature" />`

## Strings

- Widget labels should use string resources (`@string/...`) not hardcoded text for localization support.

## Network Operations

- `DatagramSocket` should be closed in a `finally` block, not just on success. Use `use` extension or try/finally.
- Catch `IOException` specifically for network errors, not generic `Exception`. Other exceptions should propagate.
- Validate MAC address format (12 hex chars) before parsing. `String.toInt(16)` throws on invalid hex.
