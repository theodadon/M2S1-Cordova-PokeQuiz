package com.example.advvibration;

import android.content.Context;
import android.os.Build;
import android.os.VibrationEffect;
import android.os.Vibrator;
import org.apache.cordova.*;
import org.json.JSONArray;
import org.json.JSONException;

public class AdvVibration extends CordovaPlugin {
  private Vibrator vibrator;

  @Override protected void pluginInitialize() {
    vibrator = (Vibrator) cordova.getActivity().getSystemService(Context.VIBRATOR_SERVICE);
  }

  @Override public boolean execute(String action, JSONArray args, CallbackContext cb) throws JSONException {
    if (!"vibrate".equals(action)) return false;

    if (vibrator == null || !vibrator.hasVibrator()) { cb.success(); return true; }

    JSONArray arr = args.getJSONArray(0);
    if (arr.length() == 0) { cb.success(); return true; }

    // Web Vibrations API: [vibre, pause, vibre, ...]
    // Android createWaveform: [delaiInitial, vibre, pause, vibre, ...]
    long[] pattern = new long[arr.length() + 1];
    pattern[0] = 0; // pas de délai initial
    for (int i = 0; i < arr.length(); i++) pattern[i + 1] = arr.getLong(i);

    if (Build.VERSION.SDK_INT >= 26) {
      VibrationEffect effect = VibrationEffect.createWaveform(pattern, -1);
      vibrator.vibrate(effect);
    } else {
      vibrator.vibrate(pattern, -1);
    }
    cb.success();
    return true;
  }
}
