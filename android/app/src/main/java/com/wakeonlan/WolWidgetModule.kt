package com.wakeonlan

import android.appwidget.AppWidgetManager
import android.content.ComponentName
import android.content.Context
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class WolWidgetModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    override fun getName() = "WolWidgetModule"

    @ReactMethod
    fun refreshWidget() {
        val context: Context = reactApplicationContext
        val manager = AppWidgetManager.getInstance(context)
        val componentName = ComponentName(context, WolWidget::class.java)
        val widgetIds = manager.getAppWidgetIds(componentName)
        for (id in widgetIds) {
            WolWidget.updateWidgetStatic(context, id, null)
        }
    }
}