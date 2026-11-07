import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';

import '../core/api_config.dart';

class UserAvatar extends StatelessWidget {
  const UserAvatar({super.key, required this.name, this.url, this.radius = 24});

  final String? url;
  final String name;
  final double radius;

  String get _initials {
    final parts = name.trim().split(RegExp(r'\s+')).where((p) => p.isNotEmpty).toList();
    if (parts.isEmpty) return '?';
    final first = parts.first.substring(0, 1);
    final second = parts.length > 1 ? parts.last.substring(0, 1) : '';
    return (first + second).toUpperCase();
  }

  String? get _fullUrl {
    if (url == null || url!.isEmpty) return null;
    if (url!.startsWith('http')) return url;
    final base = ApiConfig.baseUrl.replaceFirst(RegExp(r'/api/?$'), '');
    return '$base$url';
  }

  bool get _isLocalPreset {
    if (url == null) return false;
    return url!.startsWith('/assets/avatars/') || url!.startsWith('assets/avatars/');
  }

  String get _localAssetPath {
    if (url == null) return '';
    if (url!.startsWith('/')) {
      return url!.substring(1);
    }
    return url!;
  }

  Widget _buildFallback(ColorScheme cs) {
    return CircleAvatar(
      radius: radius,
      backgroundColor: cs.primary.withValues(alpha: 0.12),
      child: Text(
        _initials,
        style: TextStyle(
          color: cs.primary,
          fontWeight: FontWeight.w700,
          fontSize: radius * 0.6,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final resolvedUrl = _fullUrl;
    if (resolvedUrl == null) {
      return _buildFallback(cs);
    }

    if (_isLocalPreset) {
      return ClipOval(
        child: Image.asset(
          _localAssetPath,
          width: radius * 2,
          height: radius * 2,
          fit: BoxFit.cover,
          errorBuilder: (context, error, stackTrace) {
            return CachedNetworkImage(
              imageUrl: resolvedUrl,
              width: radius * 2,
              height: radius * 2,
              fit: BoxFit.cover,
              placeholder: (context, _) => CircleAvatar(
                radius: radius,
                backgroundColor: cs.surfaceContainerLowest,
              ),
              errorWidget: (context, _, __) => _buildFallback(cs),
            );
          },
        ),
      );
    }

    return ClipOval(
      child: CachedNetworkImage(
        imageUrl: resolvedUrl,
        width: radius * 2,
        height: radius * 2,
        fit: BoxFit.cover,
        placeholder: (context, _) => CircleAvatar(
          radius: radius,
          backgroundColor: cs.surfaceContainerLowest,
        ),
        errorWidget: (context, _, __) => _buildFallback(cs),
      ),
    );
  }
}
