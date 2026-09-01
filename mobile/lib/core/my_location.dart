import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:latlong2/latlong.dart';

/// Requests location permission (if needed) and returns the device's current position,
/// or null with a snackbar explanation if permission/service is unavailable.
Future<LatLng?> requestCurrentLocation(BuildContext context) async {
  try {
    var permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
    }
    if (permission == LocationPermission.denied || permission == LocationPermission.deniedForever) {
      if (context.mounted) _showMessage(context, "Joylashuvga ruxsat berilmadi");
      return null;
    }
    final serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) {
      if (context.mounted) _showMessage(context, "Joylashuv xizmati o'chirilgan");
      return null;
    }
    final position = await Geolocator.getCurrentPosition();
    return LatLng(position.latitude, position.longitude);
  } catch (_) {
    if (context.mounted) _showMessage(context, "Joylashuvni aniqlab bo'lmadi");
    return null;
  }
}

void _showMessage(BuildContext context, String message) {
  ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(message)));
}
