import 'package:flutter/foundation.dart';
import 'package:safe_device/safe_device.dart';

/// Best-effort check for a rooted/jailbroken device or emulator.
///
/// This is advisory only — it drives a dismissible in-app warning, never a
/// hard block. Root/jailbreak checks are trivially bypassable and this is a
/// job-listing app, not a payments app: locking out real users on rooted or
/// custom-ROM phones (common in this market) would cost more than the
/// detection is worth.
class DeviceIntegrity {
  static Future<bool> isCompromised() async {
    try {
      final results = await Future.wait([
        SafeDevice.isJailBroken,
        SafeDevice.isRealDevice,
      ]);
      final isJailBroken = results[0];
      final isRealDevice = results[1];
      return isJailBroken || !isRealDevice;
    } catch (e) {
      // Platform check failed (unsupported OS/emulator quirk) — don't warn on
      // uncertainty, only on a confirmed positive.
      debugPrint('DeviceIntegrity check skipped: $e');
      return false;
    }
  }
}
