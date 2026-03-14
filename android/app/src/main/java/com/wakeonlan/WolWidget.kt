// android/app/src/main/java/com/wakeonlan/WolWidget.kt
package com.wakeonlan

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.content.Intent
import android.widget.RemoteViews
import java.io.IOException
import java.net.DatagramPacket
import java.net.DatagramSocket
import java.net.InetAddress
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

class WolWidget : AppWidgetProvider() {

    companion object {
        const val ACTION_WAKE = "com.wakeonlan.ACTION_WAKE"
        const val PREFS_NAME = "com.wakeonlan_preferences" // must match RN app's prefs group
    }

    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray,
    ) {
        for (id in appWidgetIds) {
            updateWidget(context, appWidgetManager, id)
        }
    }

    override fun onReceive(context: Context, intent: Intent) {
        super.onReceive(context, intent)
        if (intent.action == ACTION_WAKE) {
            val widgetId = intent.getIntExtra(
                AppWidgetManager.EXTRA_APPWIDGET_ID,
                AppWidgetManager.INVALID_APPWIDGET_ID,
            )
            val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            val mac = prefs.getString("wol_mac", null)

            if (mac.isNullOrEmpty()) {
                return
            }

            val currentTime = SimpleDateFormat("h:mm a", Locale.getDefault()).format(Date())
            sendWakePacket(context, currentTime) { success ->
                val manager = AppWidgetManager.getInstance(context)
                if (success) {
                    updateWidget(context, manager, widgetId, currentTime)
                }
            }
        }
    }

    private fun updateWidget(
        context: Context,
        manager: AppWidgetManager,
        widgetId: Int,
        lastWokenOverride: String? = null,
    ) {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val deviceName = prefs.getString("wol_name", "No device saved") ?: "No device saved"
        val lastWoken = lastWokenOverride ?: prefs.getString("wol_last_woken", "") ?: ""

        val views = RemoteViews(context.packageName, R.layout.wol_widget)
        views.setTextViewText(R.id.widget_device_name, deviceName)
        views.setTextViewText(
            R.id.widget_last_woken,
            if (lastWoken.isNotEmpty()) "Last woken: $lastWoken" else "",
        )

        // Wire the wake button to broadcast ACTION_WAKE
        val intent = Intent(context, WolWidget::class.java).apply {
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

    private fun sendWakePacket(context: Context, currentTime: String, onComplete: (Boolean) -> Unit) {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val mac = prefs.getString("wol_mac", null) ?: return
        val broadcast = prefs.getString("wol_broadcastAddress", "255.255.255.255") ?: "255.255.255.255"
        val port = prefs.getString("wol_port", "9")?.toIntOrNull() ?: 9

        Thread {
            var socket: DatagramSocket? = null
            try {
                val cleanMac = mac.replace(":", "").replace("-", "")
                if (cleanMac.length != 12 || !cleanMac.all { it.digitToIntOrNull(16) != null }) {
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
                onComplete(true)

            } catch (e: IOException) {
                e.printStackTrace()
                onComplete(false)
            } finally {
                socket?.close()
            }
        }.start()
    }
}
