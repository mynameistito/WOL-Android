// android/app/src/main/java/com/wakeonlan/WolWidget.kt
package com.wakeonlan

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.content.Intent
import android.widget.RemoteViews

class WolWidget : AppWidgetProvider() {companion object {
        const val ACTION_WAKE = "com.wakeonlan.ACTION_WAKE"
        const val PREFS_NAME = "com.wakeonlan_preferences"
fun updateWidgetStatic(context: Context, widgetId: Int, lastWokenOverride: String?) {
            val manager = AppWidgetManager.getInstance(context)
            val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            val deviceName = prefs.getString("wol_name", context.getString(R.string.widget_no_device)) ?: context.getString(R.string.widget_no_device)
            val lastWoken = lastWokenOverride ?: prefs.getString("wol_last_woken", "") ?: ""
val views = RemoteViews(context.packageName, R.layout.wol_widget)
            views.setTextViewText(R.id.widget_device_name, deviceName)
            views.setTextViewText(
                R.id.widget_last_woken,
                if (lastWoken.isNotEmpty()) "Last woken: $lastWoken" else "",
            )
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