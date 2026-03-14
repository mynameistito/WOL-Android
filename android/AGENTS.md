# Android Development Notes

## SharedPreferences

- `react-native-default-preference` stores all values as strings. In Kotlin, use `getString()` with `toIntOrNull()` — `getInt()` throws `ClassCastException` on string values.
- `SharedPreferences.apply()` is async on disk but updates in-memory immediately. Same-process readers (like widgets) see new values right away — no need to pass values directly. The disk flush is async only.

## AppWidget

- AppWidgets do NOT auto-refresh when SharedPreferences changes. Must call `AppWidgetManager.updateAppWidget()` explicitly after config changes.
- When rebuilding RemoteViews programmatically (e.g., in `onUpdate` or a refresh method), all click listeners are lost. Always reattach `PendingIntent` with `setOnClickPendingIntent` on every update.
- **CRITICAL**: Never apply `android:permission` to an AppWidgetProvider receiver. System broadcasts like `APPWIDGET_UPDATE` come from the Android system, which doesn't hold your app's signature permission. Use a separate receiver for custom broadcasts that need protection:
  - `WolWidget` (AppWidgetProvider): No permission, handles `APPWIDGET_UPDATE` from system
  - `WolWakeReceiver` (BroadcastReceiver): Signature permission, handles custom `ACTION_WAKE` from PendingIntent
- PendingIntents created by your app execute with your app's identity, passing signature permission checks even when triggered by the system (e.g., widget button clicks).
- `WolWidget`'s PendingIntent targets `WolWakeReceiver`, not itself. Modifying the wake action requires updating both `ACTION_WAKE` constant in `WolWidget.kt` and the intent-filter in `AndroidManifest.xml`.

## React Native Native Modules

- Custom native modules must be added to the package list without replacing autolinked packages. Use `PackageList(this).packages.apply { add(MyPackage()) }` or `PackageList(this).packages.toMutableList().apply { add(MyPackage()) }`.

## Strings

- Widget labels should use string resources (`@string/...`) not hardcoded text for localization support.

## BroadcastReceiver

- `goAsync()` must be paired with `pendingResult.finish()` on **every** code path. If a callback has early returns, ensure `finish()` is called even when skipping the main work — otherwise the pending result leaks and Android eventually kills the process.
- When passing validated SharedPreferences values to async helper functions, pass the value directly rather than re-reading with `!!`. The `!!` appears safe due to upstream validation but is fragile if the call flow changes.

## Network Operations

- `DatagramSocket` should be closed in a `finally` block, not just on success. Use `use` extension or try/finally.
- Catch `IOException` specifically for network errors, not generic `Exception`. Other exceptions should propagate.
- Validate MAC address format (12 hex chars) before parsing. `String.toInt(16)` throws on invalid hex.
- For hex validation, `String.digitToIntOrNull(16)` alone is sufficient — `isLetterOrDigit()` is redundant.
- Widget updates from background threads require callbacks. Pass a lambda to the background function and invoke `runOnUiThread` or update directly since widget runs on main looper.

## Signing Configuration

- Release signing should be conditional: if `keystore.properties` exists, use release keystore; otherwise leave unsigned.
- Never fall back to debug keystore for release builds — unsigned is safer than debug-signed.
- Errors thrown during Gradle configuration phase affect ALL build types. Use `afterEvaluate { tasks.matching { ... }.configureEach { doFirst { ... } } }` for execution-phase checks, or use conditional signing config assignment instead of throwing.
