package expo.modules.dssrecording

import android.content.Intent
import androidx.core.content.ContextCompat
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class RecordingServiceModule : Module() {
  private val context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

  override fun definition() = ModuleDefinition {
    Name("DssRecordingService")

    // Starts the service or updates its notification. Rejects if Android refuses the start.
    AsyncFunction("start") { title: String, text: String ->
      val intent =
          Intent(context, RecordingService::class.java)
              .putExtra(RecordingService.EXTRA_TITLE, title)
              .putExtra(RecordingService.EXTRA_TEXT, text)
      ContextCompat.startForegroundService(context, intent)
    }

    AsyncFunction("stop") {
      context.stopService(Intent(context, RecordingService::class.java))
    }
  }
}
