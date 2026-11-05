import 'package:flutter/material.dart';

import '../core/device_integrity.dart';
import '../l10n/gen/app_localizations.dart';

/// Wraps the app with a dismissible top banner when the device looks
/// rooted/jailbroken or is an emulator. Advisory only — see
/// [DeviceIntegrity] for why this never blocks usage.
class DeviceIntegrityBanner extends StatefulWidget {
  const DeviceIntegrityBanner({super.key, required this.child});

  final Widget child;

  @override
  State<DeviceIntegrityBanner> createState() => _DeviceIntegrityBannerState();
}

class _DeviceIntegrityBannerState extends State<DeviceIntegrityBanner> {
  bool _visible = false;

  @override
  void initState() {
    super.initState();
    DeviceIntegrity.isCompromised().then((compromised) {
      if (mounted && compromised) setState(() => _visible = true);
    });
  }

  @override
  Widget build(BuildContext context) {
    if (!_visible) return widget.child;
    final l10n = AppLocalizations.of(context);
    return Column(
      children: [
        Material(
          color: Colors.amber.shade800,
          child: SafeArea(
            bottom: false,
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              child: Row(
                children: [
                  const Icon(Icons.warning_amber_rounded, color: Colors.white, size: 20),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      l10n.deviceIntegrityWarning,
                      style: const TextStyle(color: Colors.white, fontSize: 12),
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close, color: Colors.white, size: 18),
                    onPressed: () => setState(() => _visible = false),
                    padding: EdgeInsets.zero,
                    constraints: const BoxConstraints(),
                  ),
                ],
              ),
            ),
          ),
        ),
        Expanded(child: widget.child),
      ],
    );
  }
}
