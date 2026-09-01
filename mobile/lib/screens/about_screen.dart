import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:package_info_plus/package_info_plus.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import 'package:url_launcher/url_launcher.dart';

import '../l10n/l10n_x.dart';
import '../state/app_settings_provider.dart';

class AboutScreen extends ConsumerWidget {
  const AboutScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final cs = Theme.of(context).colorScheme;
    final hsl = HSLColor.fromColor(cs.primary);
    final lighter = hsl.withLightness((hsl.lightness + 0.20).clamp(0.0, 1.0)).toColor();
    final settingsAsync = ref.watch(appSettingsProvider);
    final settings = settingsAsync.valueOrNull;

    return Scaffold(
      appBar: AppBar(title: Text(context.l10n.aboutAppMenu)),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(24),
          children: [
            Center(
              child: Column(
                children: [
                  Container(
                    width: 84,
                    height: 84,
                    decoration: BoxDecoration(
                      gradient: LinearGradient(colors: [lighter, cs.primary]),
                      borderRadius: BorderRadius.circular(22),
                      boxShadow: [BoxShadow(color: cs.primary.withValues(alpha: 0.30), blurRadius: 18, offset: const Offset(0, 8))],
                    ),
                    child: Icon(PhosphorIcons.handshake(PhosphorIconsStyle.fill), color: Colors.white, size: 38),
                  ),
                  const SizedBox(height: 16),
                  const Text('Ishchi', style: TextStyle(fontSize: 24, fontWeight: FontWeight.w800)),
                  const SizedBox(height: 4),
                  Text(
                    context.l10n.appTagline,
                    style: TextStyle(color: cs.onSurfaceVariant, fontSize: 13),
                  ),
                  const SizedBox(height: 6),
                  FutureBuilder<PackageInfo>(
                    future: PackageInfo.fromPlatform(),
                    builder: (context, snapshot) {
                      final info = snapshot.data;
                      if (info == null) return const SizedBox.shrink();
                      return Text(
                        context.l10n.appVersionLabel(info.version, info.buildNumber),
                        style: TextStyle(color: cs.onSurfaceVariant, fontSize: 11.5),
                      );
                    },
                  ),
                ],
              ),
            ),
            const SizedBox(height: 28),
            if (settingsAsync.isLoading)
              const Center(child: Padding(padding: EdgeInsets.all(24), child: CircularProgressIndicator()))
            else
              _AboutCard(
                text: settings?.aboutText?.trim().isNotEmpty == true
                    ? settings!.aboutText!
                    : context.l10n.aboutFallbackText,
              ),
            const SizedBox(height: 24),
            Text(context.l10n.contactUsSection, style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: cs.onSurfaceVariant)),
            const SizedBox(height: 8),
            _ContactCard(
              children: [
                if (settings?.supportPhone?.isNotEmpty == true)
                  _InfoRow(
                    icon: PhosphorIcons.phone(PhosphorIconsStyle.fill),
                    label: context.l10n.supportLabel,
                    value: settings!.supportPhone!,
                    onTap: () => launchUrl(Uri.parse('tel:${settings.supportPhone}')),
                  ),
                if (settings?.supportEmail?.isNotEmpty == true)
                  _InfoRow(
                    icon: PhosphorIcons.envelopeSimple(PhosphorIconsStyle.fill),
                    label: context.l10n.emailLabel,
                    value: settings!.supportEmail!,
                    onTap: () => launchUrl(Uri.parse('mailto:${settings.supportEmail}')),
                  ),
                if (settings?.supportTelegram?.isNotEmpty == true)
                  _InfoRow(
                    icon: PhosphorIcons.telegramLogo(PhosphorIconsStyle.fill),
                    label: 'Telegram',
                    value: '@${settings!.supportTelegram}',
                    onTap: () => launchUrl(
                      Uri.parse('https://t.me/${settings.supportTelegram}'),
                      mode: LaunchMode.externalApplication,
                    ),
                  ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _AboutCard extends StatelessWidget {
  const _AboutCard({required this.text});

  final String text;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: cs.surfaceContainerHigh,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Text(
        text,
        style: TextStyle(color: cs.onSurfaceVariant, height: 1.6, fontSize: 13.5),
      ),
    );
  }
}

class _ContactCard extends StatelessWidget {
  const _ContactCard({required this.children});

  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    if (children.isEmpty) return const SizedBox.shrink();
    final cs = Theme.of(context).colorScheme;
    return Container(
      decoration: BoxDecoration(
        color: cs.surfaceContainerHigh,
        borderRadius: BorderRadius.circular(16),
      ),
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 4),
      child: Column(
        children: [
          for (var i = 0; i < children.length; i++) ...[
            children[i],
            if (i != children.length - 1) Divider(height: 1, color: cs.outlineVariant.withValues(alpha: 0.4)),
          ],
        ],
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  const _InfoRow({required this.icon, required this.label, required this.value, this.onTap});

  final IconData icon;
  final String label;
  final String value;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 10),
        child: Row(
          children: [
            Container(
              width: 38,
              height: 38,
              decoration: BoxDecoration(color: cs.primary.withValues(alpha: 0.12), shape: BoxShape.circle),
              child: Icon(icon, color: cs.primary, size: 19),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(label, style: TextStyle(color: cs.onSurfaceVariant, fontSize: 12)),
                  const SizedBox(height: 2),
                  Text(value, style: const TextStyle(fontSize: 14.5, fontWeight: FontWeight.w700)),
                ],
              ),
            ),
            if (onTap != null) Icon(PhosphorIcons.caretRight(), size: 16, color: cs.onSurfaceVariant),
          ],
        ),
      ),
    );
  }
}
