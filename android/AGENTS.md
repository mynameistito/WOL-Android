# Android Development Notes

## SharedPreferences

- `react-native-default-preference` stores all values as strings. In Kotlin, use `getString()` with `toIntOrNull()` — `getInt()` throws `ClassCastException` on string values.
- `SharedPreferences.apply()` is async on disk but updates in-memory immediately. Same-process readers (like widgets) see new values right away — no need to pass values directly. The disk flush is async only.

## AppWidget

- AppWidgets do NOT auto-refresh when SharedPreferences changes. Must call `AppWidgetManager.updateAppWidget()` explicitly after config changes.
- Exported receivers with custom broadcast actions are callable by any app. Use signature-level permissions: `<permission android:name="..." android:protectionLevel="signature" />`
- When rebuilding RemoteViews programmatically (e.g., in `onUpdate` or a refresh method), all click listeners are lost. Always reattach `PendingIntent` with `setOnClickPendingIntent` on every update.
- Secure exported receivers with signature permissions by adding both the `<permission>` declaration AND `android:permission="..."` attribute on the `<receiver>` tag.

## React Native Native Modules

- Custom native modules must be added to the package list without replacing autolinked packages. Use `PackageList(this).packages.apply { add(MyPackage()) }` or `PackageList(this).packages.toMutableList().apply { add(MyPackage()) }`.

## Strings

- Widget labels should use string resources (`@string/...`) not hardcoded text for localization support.

## Network Operations

- `DatagramSocket` should be closed in a `finally` block, not just on success. Use `use` extension or try/finally.
- Catch `IOException` specifically for network errors, not generic `Exception`. Other exceptions should propagate.
- Validate MAC address format (12 hex chars) before parsing. `String.toInt(16)` throws on invalid hex.
- For hex validation, `String.digitToIntOrNull(16)` alone is sufficient — `isLetterOrDigit()` is redundant.
- Widget updates from background threads require callbacks. Pass a lambda to the background function and invoke `runOnUiThread` or update directly since widget runs on main looper.
