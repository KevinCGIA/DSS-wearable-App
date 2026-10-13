package expo.modules.dssrecording

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.ServiceCompat
import com.facebook.react.HeadlessJsTaskService
import com.facebook.react.bridge.Arguments
import com.facebook.react.jstasks.HeadlessJsTaskConfig

/**
 * Keeps recording while the app is in the background. Android pauses JS timers there unless a
 * headless task is running, so this runs one ("DssRecording") until the service is stopped.
 */
class RecordingService : HeadlessJsTaskService() {
  private var taskStarted = false

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    val title = intent?.getStringExtra(EXTRA_TITLE) ?: "Recording"
    val text = intent?.getStringExtra(EXTRA_TEXT) ?: ""
    try {
      val type =
          if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            ServiceInfo.FOREGROUND_SERVICE_TYPE_CONNECTED_DEVICE
          } else {
            0
          }
      ServiceCompat.startForeground(this, NOTIFICATION_ID, buildNotification(title, text), type)
    } catch (error: Exception) {
      // refused by Android: recording continues only while the app is open
      stopSelf()
      return START_NOT_STICKY
    }
    // a repeat start only updates the notification
    if (!taskStarted) {
      taskStarted = true
      startTask(HeadlessJsTaskConfig(TASK_NAME, Arguments.createMap(), 0, true))
    }
    return START_NOT_STICKY
  }

  private fun buildNotification(title: String, text: String): Notification {
    val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      manager.createNotificationChannel(
          NotificationChannel(CHANNEL_ID, "Background recording", NotificationManager.IMPORTANCE_LOW)
              .apply {
                description = "Shown while the app records from your wearables in the background"
                setShowBadge(false)
              }
      )
    }
    val open =
        packageManager.getLaunchIntentForPackage(packageName)?.let { launch ->
          PendingIntent.getActivity(
              this,
              0,
              launch,
              PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
          )
        }
    return NotificationCompat.Builder(this, CHANNEL_ID)
        .setSmallIcon(R.drawable.ic_dss_recording)
        .setContentTitle(title)
        .setContentText(text)
        .setContentIntent(open)
        .setOngoing(true)
        .setOnlyAlertOnce(true)
        .setCategory(NotificationCompat.CATEGORY_SERVICE)
        .setPriority(NotificationCompat.PRIORITY_LOW)
        .build()
  }

  companion object {
    const val TASK_NAME = "DssRecording"
    const val EXTRA_TITLE = "title"
    const val EXTRA_TEXT = "text"
    private const val CHANNEL_ID = "dss-background-recording"
    private const val NOTIFICATION_ID = 7341
  }
}
