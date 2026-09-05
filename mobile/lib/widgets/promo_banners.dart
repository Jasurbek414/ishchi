import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import 'package:url_launcher/url_launcher.dart';

import '../core/api_config.dart';
import '../l10n/l10n_x.dart';
import '../models/promo_banner.dart';
import '../state/core_providers.dart';
import 'promo_carousel.dart';

class PromoBanners {
  static const _teal = [Color(0xFF4DC9C0), Color(0xFF1E8F87)];
  static const _violet = [Color(0xFF9C7CE8), Color(0xFF6C4BC7)];

  static List<Color> _primaryGradient(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final hsl = HSLColor.fromColor(cs.primary);
    final lighter = hsl.withLightness((hsl.lightness + 0.20).clamp(0.0, 1.0)).toColor();
    return [lighter, cs.primary];
  }

  /// Converts admin-managed banners into carousel entries. Since the admin panel doesn't
  /// let admins pick a color/icon per banner, these rotate through the same palette used
  /// for the built-in fallback banners below.
  static List<PromoBanner> fromApi(BuildContext context, WidgetRef ref, List<ApiPromoBanner> banners) {
    final palettes = [_primaryGradient(context), _teal, _violet];
    return [
      for (final (i, b) in banners.indexed)
        PromoBanner(
          title: b.title,
          subtitle: b.subtitle ?? '',
          icon: PhosphorIcons.megaphone(PhosphorIconsStyle.fill),
          colors: palettes[i % palettes.length],
          imageUrl: b.imageUrl != null ? ApiConfig.resolveMediaUrl(b.imageUrl!) : null,
          onTap: b.linkUrl == null || b.linkUrl!.isEmpty
              ? null
              : () {
                  ref.read(promoBannerRepositoryProvider).recordClick(b.id);
                  _openLink(context, b.linkUrl!);
                },
        ),
    ];
  }

  static void _openLink(BuildContext context, String link) {
    if (link.startsWith('/')) {
      context.push(link);
    } else {
      launchUrl(Uri.parse(link), mode: LaunchMode.externalApplication);
    }
  }

  static List<PromoBanner> workerFor(BuildContext context) => [
        PromoBanner(
          title: context.l10n.promoWorkerDailyJobsTitle,
          subtitle: context.l10n.promoWorkerDailyJobsSubtitle,
          icon: PhosphorIcons.sparkle(PhosphorIconsStyle.fill),
          colors: _primaryGradient(context),
        ),
        PromoBanner(
          title: context.l10n.promoWorkerFillProfileTitle,
          subtitle: context.l10n.promoWorkerFillProfileSubtitle,
          icon: PhosphorIcons.userGear(PhosphorIconsStyle.fill),
          colors: _teal,
          onTap: () => context.push('/profile/edit'),
        ),
        PromoBanner(
          title: context.l10n.promoFreeTitle,
          subtitle: context.l10n.promoFreeSubtitle,
          icon: PhosphorIcons.sealCheck(PhosphorIconsStyle.fill),
          colors: _violet,
          onTap: () => context.push('/profile/about'),
        ),
      ];

  static List<PromoBanner> employerFor(BuildContext context) => [
        PromoBanner(
          title: context.l10n.promoEmployerThousandsTitle,
          subtitle: context.l10n.promoEmployerThousandsSubtitle,
          icon: PhosphorIcons.usersThree(PhosphorIconsStyle.fill),
          colors: _violet,
        ),
        PromoBanner(
          title: context.l10n.promoEmployerDirectContactTitle,
          subtitle: context.l10n.promoEmployerDirectContactSubtitle,
          icon: PhosphorIcons.phoneCall(PhosphorIconsStyle.fill),
          colors: _teal,
          onTap: () => context.push('/profile/about'),
        ),
        PromoBanner(
          title: context.l10n.promoEmployerFreePostTitle,
          subtitle: context.l10n.promoEmployerFreePostSubtitle,
          icon: PhosphorIcons.megaphone(PhosphorIconsStyle.fill),
          colors: _primaryGradient(context),
          onTap: () => context.push('/employer/jobs/new'),
        ),
      ];
}
