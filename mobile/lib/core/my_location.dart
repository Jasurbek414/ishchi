import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:latlong2/latlong.dart';

import '../l10n/l10n_x.dart';

/// Where the phone is, with how sure it is (in metres) so the map can draw the accuracy halo.
class UserLocation {
  const UserLocation(this.point, this.accuracy);

  final LatLng point;
  final double accuracy;
}

/// Asks for permission when needed and returns the current position. When it cannot, it says why
/// in a snackbar, with a shortcut to the setting that would fix it.
Future<UserLocation?> requestUserLocation(BuildContext context) async {
  final l10n = context.l10n;
  final messenger = ScaffoldMessenger.of(context);
  void say(String message, {Future<bool> Function()? fix}) {
    messenger.showSnackBar(SnackBar(
      content: Text(message),
      action: fix == null ? null : SnackBarAction(label: l10n.openSettingsAction, onPressed: () => fix()),
    ));
  }

  try {
    if (!await Geolocator.isLocationServiceEnabled()) {
      say(l10n.locationServiceOff, fix: Geolocator.openLocationSettings);
      return null;
    }
    var permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
    }
    if (permission == LocationPermission.deniedForever) {
      say(l10n.locationPermissionBlocked, fix: Geolocator.openAppSettings);
      return null;
    }
    if (permission == LocationPermission.denied || permission == LocationPermission.unableToDetermine) {
      say(l10n.locationPermissionDenied);
      return null;
    }
    final position = await Geolocator.getCurrentPosition(
      locationSettings: const LocationSettings(accuracy: LocationAccuracy.high, timeLimit: Duration(seconds: 15)),
    );
    return UserLocation(LatLng(position.latitude, position.longitude), position.accuracy);
  } catch (_) {
    say(l10n.locationUnavailable);
    return null;
  }
}

/// Kept for callers that only need the point.
Future<LatLng?> requestCurrentLocation(BuildContext context) async =>
    (await requestUserLocation(context))?.point;

/// The position without asking for anything: only when permission was already given, and the
/// last known fix when there is one, so opening a map does not pop a dialog or wait for GPS.
Future<UserLocation?> quietUserLocation() async {
  try {
    if (!await Geolocator.isLocationServiceEnabled()) return null;
    final permission = await Geolocator.checkPermission();
    if (permission != LocationPermission.always && permission != LocationPermission.whileInUse) return null;
    final position = await Geolocator.getLastKnownPosition() ??
        await Geolocator.getCurrentPosition(
          locationSettings: const LocationSettings(accuracy: LocationAccuracy.medium, timeLimit: Duration(seconds: 6)),
        );
    return UserLocation(LatLng(position.latitude, position.longitude), position.accuracy);
  } catch (_) {
    return null;
  }
}

/// Straight-line distance in metres.
double distanceBetween(LatLng a, LatLng b) =>
    Geolocator.distanceBetween(a.latitude, a.longitude, b.latitude, b.longitude);

/// "350 m" under a kilometre, "1.2 km" up to ten, then whole kilometres.
String formatDistance(BuildContext context, double meters) {
  final l10n = context.l10n;
  if (meters < 1000) return l10n.distanceMeters((meters / 10).round() * 10);
  final km = meters / 1000;
  final text = km < 10 ? km.toStringAsFixed(1) : km.round().toString();
  final decimal = Localizations.localeOf(context).languageCode == 'en' ? text : text.replaceAll('.', ',');
  return l10n.distanceKilometers(decimal);
}
