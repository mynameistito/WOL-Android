# Wake on LAN — Widget Addendum

> Append this to the main WakeOnLAN_App_Spec.md and include it in your Claude Code prompt.

---

## Overview

Add an Android home screen widget that displays the saved device name and a single large **Power** button. Tapping it sends the magic packet immediately — no need to open the app.

### Widget Preview

```text
┌─────────────────────────┐
│  ⚡ Wake on LAN         │
│  Gaming PC              │
│                         │
│     [ ⏻  WAKE UP ]      │
│                         │
│  Last woken: 2:34 PM    │
└─────────────────────────┘
```

---

## Why Native Kotlin (Not JS)

Android widgets are `AppWidgetProvider` classes that run on the Android system, not inside the React Native JS thread. They cannot call JavaScript. The widget must be written in Kotlin inside `android/app/src/main/java/`.

To share data between the React Native app and the widget, config is written to **SharedPreferences** (Android's native key-value store) every time the user saves in the app. The widget reads from SharedPreferences directly.

---

## Additional Dependencies

```bash
# In your RN project root:
npm install react-native-default-preference
```

`react-native-default-preference` lets React Native write to Android SharedPreferences, which the widget can then read natively.

---

## Data Sharing Architecture

```text
React Native App (JS)
  └── saves config via react-native-default-preference
        └── writes to SharedPreferences (file: com.wakeonlan_preferences.xml)

Android Widget (Kotlin)
  └── reads from SharedPreferences on tap
  └── builds & sends UDP magic packet natively (no JS needed)
```

---

## New Files to Create

```text
android/app/src/main/
├── java/com/wakeonlan/
│   ├── WolWidget.kt              ← AppWidgetProvider (handles button tap + sends WoL)
│   └── WolWidgetService.kt       ← (optional) background service for sending UDP
├── res/
│   ├── layout/
│   │   └── wol_widget.xml        ← Widget layout (RemoteViews XML)
│   └── xml/
│       └── wol_widget_info.xml   ← Widget metadata (size, update interval)
```

---

## 1. Widget Metadata — `wol_widget_info.xml`

```xml
<!-- android/app/src/main/res/xml/wol_widget_info.xml -->
<appwidget-provider
    xmlns:android="http://schemas.android.com/apk/res/android"
    android:minWidth="180dp"
    android:minHeight="110dp"
    android:targetCellWidth="3"
    android:targetCellHeight="2"
    android:updatePeriodMillis="0"
    android:initialLayout="@layout/wol_widget"
    android:resizeMode="horizontal|vertical"
    android:widgetCategory="home_screen"
    android:description="@string/app_name" />
```

---

## 2. Widget Layout — `wol_widget.xml`

```xml
<!-- android/app/src/main/res/layout/wol_widget.xml -->
<LinearLayout
    xmlns:android="http://schemas.android.com/apk/res/android"
    android:id="@+id/widget_root"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:orientation="vertical"
    android:background="@drawable/widget_background"
    android:padding="12dp"
    android:gravity="center">

    <TextView
        android:id="@+id/widget_label"
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:text="⚡ Wake on LAN"
        android:textColor="#AAAAAA"
        android:textSize="11sp"
        android:letterSpacing="0.08" />

    <TextView
        android:id="@+id/widget_device_name"
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:text="No device saved"
        android:textColor="#FFFFFF"
        android:textSize="15sp"
        android:textStyle="bold"
        android:layout_marginTop="2dp" />

    <Button
        android:id="@+id/widget_wake_button"
        android:layout_width="match_parent"
        android:layout_height="40dp"
        android:layout_marginTop="10dp"
        android:text="⏻  WAKE UP"
        android:textColor="#FFFFFF"
        android:backgroundTint="#1E88E5"
        android:textSize="13sp"
        android:textStyle="bold" />

    <TextView
        android:id="@+id/widget_last_woken"
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:text=""
        android:textColor="#666666"
        android:textSize="10sp"
        android:layout_marginTop="6dp" />

</LinearLayout>
```

Also create a widget background drawable:

```xml
<!-- android/app/src/main/res/drawable/widget_background.xml -->
<shape xmlns:android="http://schemas.android.com/apk/res/android"
    android:shape="rectangle">
    <solid android:color="#1A1A1A" />
    <corners android:radius="16dp" />
</shape>
```

---

## 3. Widget Provider — `WolWidget.kt`

```kotlin
// android/app/src/main/java/com/wakeonlan/WolWidget.kt
package com.wakeonlan

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.content.Intent
import android.widget.RemoteViews

class WolWidget : AppWidgetProvider() {
    companion object {
        const val ACTION_WAKE = "com.wakeonlan.ACTION_WAKE"
        const val PREFS_NAME = "com.wakeonlan_preferences"

        fun updateWidgetStatic(context: Context, widgetId: Int, lastWokenOverride: String?) {
            val manager = AppWidgetManager.getInstance(context)
            val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            val deviceName = prefs.getString("wol_name", context.getString(R.string.widget_no_device))
                ?: context.getString(R.string.widget_no_device)
            val lastWoken = lastWokenOverride ?: prefs.getString("wol_last_woken", "") ?: ""

            val views = RemoteViews(context.packageName, R.layout.wol_widget)
            views.setTextViewText(R.id.widget_device_name, deviceName)
            views.setTextViewText(
                R.id.widget_last_woken,
                if (lastWoken.isNotEmpty()) "Last woken: $lastWoken" else "",
            )

            // Wire up the wake button - targets WolWakeReceiver, not WolWidget
            val intent = Intent(context, WolWakeReceiver::class.java).apply {
                action = ACTION_WAKE
                putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, widgetId)
            }
            val pendingIntent = PendingIntent.getBroadcast(
                context,
                widgetId,
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
            )
            views.setOnClickPendingIntent(R.id.widget_wake_button, pendingIntent)

            manager.updateAppWidget(widgetId, views)
        }
    }

    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray,
    ) {
        for (id in appWidgetIds) {
            updateWidgetStatic(context, id, null)
        }
    }
}
```

### Wake Receiver — `WolWakeReceiver.kt`

The wake action is handled by a separate receiver with signature permission for security:

```kotlin
// android/app/src/main/java/com/wakeonlan/WolWakeReceiver.kt
package com.wakeonlan

import android.appwidget.AppWidgetManager
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import java.io.IOException
import java.net.DatagramPacket
import java.net.DatagramSocket
import java.net.InetAddress
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

class WolWakeReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action != WolWidget.ACTION_WAKE) return
        val widgetId = intent.getIntExtra(
            AppWidgetManager.EXTRA_APPWIDGET_ID,
            AppWidgetManager.INVALID_APPWIDGET_ID,
        )
        val prefs = context.getSharedPreferences(WolWidget.PREFS_NAME, Context.MODE_PRIVATE)
        val mac = prefs.getString("wol_mac", null)
        if (mac.isNullOrEmpty()) return
        val currentTime = SimpleDateFormat("h:mm a", Locale.getDefault()).format(Date())
        val pendingResult = goAsync()
        sendWakePacket(context, mac, prefs, currentTime) { success ->
            if (success) {
                WolWidget.updateWidgetStatic(context, widgetId, currentTime)
            }
            pendingResult.finish()
        }
    }

    private fun sendWakePacket(
        context: Context,
        mac: String,
        prefs: android.content.SharedPreferences,
        currentTime: String,
        onComplete: (Boolean) -> Unit,
    ) {
        val broadcast = prefs.getString("wol_broadcastAddress", "255.255.255.255") ?: "255.255.255.255"
        val port = prefs.getString("wol_port", "9")?.toIntOrNull() ?: 9

        Thread {
            var socket: DatagramSocket? = null
            try {
                val cleanMac = mac.replace(":", "").replace("-", "")
                if (cleanMac.length != 12 || !cleanMac.all { it.digitToIntOrNull(16) != null }) {
                    android.os.Handler(android.os.Looper.getMainLooper()).post {
                        onComplete(false)
                    }
                    return@Thread
                }
                val macBytes = cleanMac.chunked(2).map { it.toInt(16).toByte() }.toByteArray()
                val packet = ByteArray(102)
                for (i in 0..5) packet[i] = 0xFF.toByte()
                for (i in 0..15) {
                    System.arraycopy(macBytes, 0, packet, 6 + i * 6, 6)
                }
                socket = DatagramSocket()
                socket.broadcast = true
                val address = InetAddress.getByName(broadcast)
                val dp = DatagramPacket(packet, packet.size, address, port)
                socket.send(dp)
                prefs.edit().putString("wol_last_woken", currentTime).apply()
                android.os.Handler(android.os.Looper.getMainLooper()).post {
                    onComplete(true)
                }
            } catch (e: IOException) {
                e.printStackTrace()
                android.os.Handler(android.os.Looper.getMainLooper()).post {
                    onComplete(false)
                }
            } finally {
                socket?.close()
            }
        }.start()
    }
}
```

---

## 4. AndroidManifest.xml Additions

Inside the `<application>` tag, add:

```xml
<receiver
    android:name=".WolWidget"
    android:exported="true">
    <intent-filter>
        <action android:name="android.appwidget.action.APPWIDGET_UPDATE" />
        <action android:name="com.wakeonlan.ACTION_WAKE" />
    </intent-filter>
    <meta-data
        android:name="android.appwidget.provider"
        android:resource="@xml/wol_widget_info" />
</receiver>
```

---

## 5. React Native Side — Write to SharedPreferences on Save

Update `src/utils/storage.ts` to also write config to SharedPreferences so the widget can read it:

```typescript
import AsyncStorage from "@react-native-async-storage/async-storage";
import DefaultPreference from "react-native-default-preference";
import { DeviceConfig } from "../types";

const STORAGE_KEY = "@wol_device_config";
// Must match PREFS_NAME in WolWidget.kt
const PREFS_GROUP = "com.wakeonlan_preferences";

export async function saveConfig(config: DeviceConfig): Promise<void> {
  // Save to AsyncStorage (for the app UI)
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(config));

  // Also write individual fields to SharedPreferences (for the widget)
  await DefaultPreference.setName(PREFS_GROUP);
  await DefaultPreference.set("wol_name", config.name);
  await DefaultPreference.set("wol_mac", config.mac);
  await DefaultPreference.set("wol_broadcastAddress", config.broadcastAddress);
  await DefaultPreference.set("wol_port", config.port);
}

export async function loadConfig(): Promise<DeviceConfig | null> {
  const json = await AsyncStorage.getItem(STORAGE_KEY);
  return json ? JSON.parse(json) : null;
}
```

---

## 6. Widget Triggers Widget Refresh After App Save

After saving config in the app, you should trigger a widget refresh so it displays the new device name immediately:

```typescript
// In WakeOnLanScreen.tsx, after saveConfig():
import { NativeModules } from "react-native";

// After saving config,refresh the widget
NativeModules.WolWidgetModule?.refreshWidget();
```

You'll need to add a native module in WolWidget.kt:

```kotlin
companion object {
    fun updateAllWidgets(context: Context) {
        val manager = AppWidgetManager.getInstance(context)
        val ids = manager.getAppWidgetIds(
            android.content.ComponentName(context, WolWidget::class.java)
        )
        for (id in ids) {
            updateAllWidgets(context, manager, id)  // Call static helper
        }
    }

    // Static helper that accepts all parameters
    fun updateAllWidgets(context: Context, manager: AppWidgetManager, widgetId: Int) {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val deviceName = prefs.getString("wol_name", "No device saved") ?: "No device saved"
        val lastWoken = prefs.getString("wol_last_woken", "") ?: ""

        val views = RemoteViews(context.packageName, R.layout.wol_widget)
        views.setTextViewText(R.id.widget_device_name, deviceName)
        views.setTextViewText(
            R.id.widget_last_woken,
            if (lastWoken.isNotEmpty()) "Last woken: $lastWoken" else ""
        )

        // Reattach the wake button PendingIntent (required on every refresh)
        val intent = Intent(context, WolWidget::class.java).apply {
            action = ACTION_WAKE
            putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, widgetId)
        }
        val pendingIntent = PendingIntent.getBroadcast(
            context, widgetId, intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        views.setOnClickPendingIntent(R.id.widget_wake_button, pendingIntent)

        manager.updateAppWidget(widgetId, views)
    }
}
```

And create WolWidgetModule.kt as a React Native bridge:

````kotlin
package com.wakeonlan

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class WolWidgetModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    override fun getName() = "WolWidgetModule"

    @ReactMethod
    fun refreshWidget() {
        WolWidget.updateAllWidgets(reactApplicationContext)
    }
}

And register it with a package:

```kotlin
package com.wakeonlan

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager

class WolWidgetPackage : ReactPackage {
    override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> {
        return listOf(WolWidgetModule(reactContext))
    }

    override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> {
        return emptyList()
    }
}
````

Then register this package in your `MainApplication.kt`. Use the `DefaultNewArchitectureEntryPoint` pattern to preserve autolinked packages:

```kotlin
override fun getPackages(): List<ReactPackage> {
    return PackageList(this).packages.apply {
        add(WolWidgetPackage())  // Add this to preserve autolinked modules
    }
}
```

Or if using the new architecture directly:

```kotlin
override fun getPackages(): List<ReactPackage> {
    val packages = PackageList(this).packages.toMutableList()
    packages.add(WolWidgetPackage())
    return packages
}
```

**Note:** AppWidgets do NOT auto-refresh when SharedPreferences changes. You must call `AppWidgetManager.updateAppWidget()` explicitly.

---

## 7. Updated Package.json Dependencies

```json
{
  "dependencies": {
    "react": "19.2.3",
    "react-native": "0.84.1",
    "react-native-udp": "^4.1.7",
    "@react-native-async-storage/async-storage": "^2.2.0",
    "react-native-vector-icons": "^10.x",
    "react-native-default-preference": "^1.4.4"
  }
}
```

---

## 8. How to Add Widget to Home Screen (After Build)

1. Long press your Android home screen
2. Tap **Widgets**
3. Find **Wake on LAN** in the list
4. Drag it to your home screen
5. The widget auto-reads your saved config — no extra setup needed

> ⚠️ Config must be saved in the app at least once before the widget will show your device name and work correctly.

---

## 9. Updated Prompt for Claude Code

> "Build the React Native Android app from the main spec AND this widget addendum. The widget is implemented natively in Kotlin as an AppWidgetProvider in `android/app/src/main/java/com/wakeonlan/WolWidget.kt`. It reads device config from SharedPreferences (key group: `com.wakeonlan_preferences`). The React Native app writes config to SharedPreferences using `react-native-default-preference` in addition to AsyncStorage. The widget shows the device name, a Wake Up button, and the last woken time. Tapping the button sends the UDP magic packet directly from Kotlin — no JS involved. Include all layout XML, drawable XML, manifest registration, and updated storage.ts."
