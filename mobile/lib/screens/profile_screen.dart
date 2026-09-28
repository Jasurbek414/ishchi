import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';

import '../core/api_exception.dart';
import '../core/formatters.dart';
import '../core/theme.dart';
import '../l10n/l10n_x.dart';
import '../models/enums.dart';
import '../models/profile.dart';
import '../state/app_settings_provider.dart';
import '../state/core_providers.dart';
import '../state/auth_provider.dart';
import '../state/locale_provider.dart';
import '../state/profile_provider.dart';
import '../state/theme_provider.dart';
import '../state/wallet_provider.dart';
import '../widgets/async_view.dart';
import '../widgets/role_switch_sheet.dart';
import '../widgets/user_avatar.dart';
import '../widgets/app_bottom_nav.dart';

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  Future<void> _confirmLogout(BuildContext context, WidgetRef ref) async {
    final cs = Theme.of(context).colorScheme;
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: Text(context.l10n.logoutConfirmTitle),
        content: Text(context.l10n.logoutConfirmMessage),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: Text(context.l10n.commonCancel)),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: Text(context.l10n.logoutAction, style: TextStyle(color: cs.error)),
          ),
        ],
      ),
    );
    if (confirmed == true) {
      await ref.read(authNotifierProvider.notifier).logout();
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final cs = Theme.of(context).colorScheme;
    final profileAsync = ref.watch(profileProvider);
    final walletEnabled = ref.watch(appSettingsProvider).valueOrNull?.walletEnabled ?? false;
    final walletAsync = walletEnabled ? ref.watch(walletProvider) : null;

    return Scaffold(
      appBar: AppBar(
        title: Text(context.l10n.profileTitle),
        actions: [
          IconButton(
            icon: Icon(PhosphorIcons.pencilSimple()),
            onPressed: () => context.push('/profile/edit'),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          if (walletEnabled) ref.invalidate(walletProvider);
          ref.invalidate(appSettingsProvider);
          ref.invalidate(profileProvider);
          await ref.read(profileProvider.future);
        },
        child: AsyncView(
          value: profileAsync,
          onRetry: () => ref.invalidate(profileProvider),
          data: (profile) => ListView(
            padding: EdgeInsets.fromLTRB(20, 12, 20, 32 + bottomNavClearance(context)),
            children: [
              Center(
                child: Column(
                  children: [
                    UserAvatar(url: profile.avatarUrl, name: profile.fullName, radius: 42),
                    const SizedBox(height: 12),
                    Text(profile.fullName, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w800)),
                    const SizedBox(height: 4),
                    Text(profile.phone, style: TextStyle(color: cs.onSurfaceVariant)),
                    const SizedBox(height: 6),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                      decoration: BoxDecoration(
                        color: cs.primary.withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Text(
                        profile.role.label(context),
                        style: TextStyle(color: cs.primary, fontWeight: FontWeight.w700, fontSize: 12.5),
                      ),
                    ),
                  ],
                ),
              ),
              if (walletEnabled) ...[
                const SizedBox(height: 24),
                _WalletCard(walletAsync: walletAsync!),
              ],
              const SizedBox(height: 20),
              _SectionCard(
                children: [
                  _InfoTile(icon: PhosphorIcons.mapPin(), label: context.l10n.fieldRegion, value: '${profile.regionName}, ${profile.districtName}'),
                  if (profile.role == UserRole.worker) ...[
                    const Divider(height: 1),
                    _InfoTile(
                      icon: PhosphorIcons.medal(),
                      label: context.l10n.experienceLabel,
                      value: profile.experienceYears != null
                          ? context.l10n.experienceYearsValue(profile.experienceYears!)
                          : context.l10n.commonNotSpecified,
                    ),
                    const Divider(height: 1),
                    _InfoTile(
                      icon: PhosphorIcons.briefcase(),
                      label: context.l10n.professionsLabel,
                      value: profile.professions.isNotEmpty
                          ? profile.professions.map((p) => p.name).join(', ')
                          : context.l10n.commonNotSelected,
                    ),
                    const Divider(height: 1),
                    _InfoTile(
                      icon: PhosphorIcons.checkCircle(),
                      label: context.l10n.statusLabel,
                      value: (profile.available ?? true) ? context.l10n.availableForWork : context.l10n.busyStatus,
                    ),
                  ],
                ],
              ),
              if (profile.about != null && profile.about!.isNotEmpty) ...[
                const SizedBox(height: 16),
                _SectionCard(
                  children: [
                    Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(context.l10n.aboutMeLabel, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13.5)),
                          const SizedBox(height: 6),
                          Text(profile.about!, style: const TextStyle(height: 1.4, fontSize: 14)),
                        ],
                      ),
                    ),
                  ],
                ),
              ],
              if (profile.role == UserRole.worker) ...[
                const SizedBox(height: 20),
                _AvailableTodayCard(profile: profile),
              ],
              const SizedBox(height: 20),
              _SectionCard(
                children: [
                  _MenuTile(
                    icon: PhosphorIcons.userGear(),
                    label: context.l10n.editProfileMenu,
                    onTap: () => context.push('/profile/edit'),
                  ),
                  if (profile.role != UserRole.admin) ...[
                    const Divider(height: 1),
                    _MenuTile(
                      icon: PhosphorIcons.arrowsClockwise(),
                      label: profile.role == UserRole.worker
                          ? context.l10n.switchToEmployerMenu
                          : context.l10n.switchToWorkerMenu,
                      onTap: () => showModalBottomSheet(
                        context: context,
                        isScrollControlled: true,
                        builder: (_) => RoleSwitchSheet(currentRole: profile.role),
                      ),
                    ),
                  ],
                  if (profile.role == UserRole.worker) ...[
                    const Divider(height: 1),
                    _MenuTile(
                      icon: PhosphorIcons.checkCircle(),
                      label: context.l10n.myResponsesMenu,
                      onTap: () => context.push('/worker/my-applications'),
                    ),
                    const Divider(height: 1),
                    _MenuTile(
                      icon: PhosphorIcons.bellRinging(),
                      label: context.l10n.savedSearchesMenu,
                      onTap: () => context.push('/profile/saved-searches'),
                    ),
                  ],
                  const Divider(height: 1),
                  _MenuTile(
                    icon: PhosphorIcons.lock(),
                    label: context.l10n.changePasswordMenu,
                    onTap: () => context.push('/profile/change-password'),
                  ),
                  const Divider(height: 1),
                  _ThemeMenuTile(
                    onTap: () => context.push('/profile/theme'),
                  ),
                  const Divider(height: 1),
                  _LanguageMenuTile(
                    onTap: () => context.push('/profile/language'),
                  ),
                  const Divider(height: 1),
                  _MenuTile(
                    icon: PhosphorIcons.info(),
                    label: context.l10n.aboutAppMenu,
                    onTap: () => context.push('/profile/about'),
                  ),
                ],
              ),
              const SizedBox(height: 20),
              OutlinedButton.icon(
                onPressed: () => _confirmLogout(context, ref),
                icon: Icon(PhosphorIcons.signOut(), color: cs.error, size: 18),
                label: Text(context.l10n.logoutAction, style: TextStyle(color: cs.error)),
                style: OutlinedButton.styleFrom(side: BorderSide(color: cs.error)),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _WalletCard extends ConsumerWidget {
  const _WalletCard({required this.walletAsync});

  final AsyncValue walletAsync;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final cs = Theme.of(context).colorScheme;
    final hsl = HSLColor.fromColor(cs.primary);
    final lighter = hsl.withLightness((hsl.lightness + 0.20).clamp(0.0, 1.0)).toColor();

    return GestureDetector(
      onTap: () => context.push('/profile/wallet'),
      child: Container(
        padding: const EdgeInsets.all(18),
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: [lighter, cs.primary],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          borderRadius: BorderRadius.circular(20),
          boxShadow: [
            BoxShadow(color: cs.primary.withValues(alpha: 0.25), blurRadius: 16, offset: const Offset(0, 8)),
          ],
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.2), shape: BoxShape.circle),
              child: Icon(PhosphorIcons.wallet(PhosphorIconsStyle.fill), color: Colors.white, size: 22),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(context.l10n.walletBalanceLabel, style: const TextStyle(color: Colors.white70, fontSize: 12.5)),
                  const SizedBox(height: 2),
                  walletAsync.when(
                    data: (wallet) => Text(
                      Formatters.money(context, wallet.balance),
                      style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w800),
                    ),
                    loading: () => const SizedBox(
                      height: 18, width: 18,
                      child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                    ),
                    error: (e, _) => Text(context.l10n.viewAction, style: const TextStyle(color: Colors.white)),
                  ),
                ],
              ),
            ),
            Icon(PhosphorIcons.caretRight(), color: Colors.white, size: 18),
          ],
        ),
      ),
    );
  }
}

class _SectionCard extends StatelessWidget {
  const _SectionCard({required this.children});

  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    return Card(child: Column(children: children));
  }
}

class _InfoTile extends StatelessWidget {
  const _InfoTile({required this.icon, required this.label, required this.value});

  final IconData icon;
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: cs.onSurfaceVariant, size: 20),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(label, style: TextStyle(color: cs.onSurfaceVariant, fontSize: 12.5)),
                const SizedBox(height: 2),
                Text(value, style: const TextStyle(fontSize: 14.5)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

/// "Bugun bo'shman" — the same-day availability signal, with its own expiry.
///
/// The standing `available` flag is a preference a worker sets once and forgets; day labour is
/// decided the same morning, so this is the one that tells an employer somebody can be called today.
/// The server expires it at midnight in Tashkent, so nobody has to remember to turn it off.
class _AvailableTodayCard extends ConsumerStatefulWidget {
  const _AvailableTodayCard({required this.profile});

  final Profile profile;

  @override
  ConsumerState<_AvailableTodayCard> createState() => _AvailableTodayCardState();
}

class _AvailableTodayCardState extends ConsumerState<_AvailableTodayCard> {
  bool _busy = false;

  bool get _isOn {
    final until = widget.profile.availableUntil;
    return until != null && until.isAfter(DateTime.now());
  }

  Future<void> _toggle(bool value) async {
    setState(() => _busy = true);
    try {
      await ref.read(profileRepositoryProvider).updateProfile(availableToday: value);
      ref.invalidate(profileProvider);
    } on ApiException catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return _SectionCard(
      children: [
        SwitchListTile(
          value: _isOn,
          onChanged: _busy ? null : _toggle,
          title: Text(context.l10n.availableTodayToggle,
              style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14.5)),
          subtitle: Text(context.l10n.availableTodayHint,
              style: TextStyle(color: cs.onSurfaceVariant, fontSize: 12.5)),
          secondary: Icon(PhosphorIcons.calendarCheck(),
              color: _isOn ? context.themeSuccess : cs.onSurfaceVariant),
        ),
      ],
    );
  }
}

class _MenuTile extends StatelessWidget {
  const _MenuTile({required this.icon, required this.label, required this.onTap});

  final IconData icon;
  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        child: Row(
          children: [
            Icon(icon, color: cs.onSurface, size: 20),
            const SizedBox(width: 14),
            Expanded(child: Text(label, style: const TextStyle(fontSize: 14.5, fontWeight: FontWeight.w500))),
            Icon(PhosphorIcons.caretRight(), color: cs.onSurfaceVariant, size: 16),
          ],
        ),
      ),
    );
  }
}

class _ThemeMenuTile extends ConsumerWidget {
  const _ThemeMenuTile({required this.onTap});

  final VoidCallback onTap;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final themeState = ref.watch(themeProvider);
    final cs = Theme.of(context).colorScheme;

    final modeLabel = switch (themeState.themeMode) {
      ThemeMode.light => context.l10n.themeModeLight,
      ThemeMode.dark => context.l10n.themeModeDark,
      _ => context.l10n.themeModeAuto,
    };

    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        child: Row(
          children: [
            Icon(PhosphorIcons.palette(), color: cs.onSurface, size: 20),
            const SizedBox(width: 14),
            Expanded(
              child: Text(
                context.l10n.themeMenu,
                style: const TextStyle(fontSize: 14.5, fontWeight: FontWeight.w500),
              ),
            ),
            Container(
              width: 18,
              height: 18,
              decoration: BoxDecoration(
                color: themeState.seedColor,
                shape: BoxShape.circle,
              ),
            ),
            const SizedBox(width: 6),
            Text(
              modeLabel,
              style: TextStyle(fontSize: 12, color: cs.onSurfaceVariant),
            ),
            const SizedBox(width: 4),
            Icon(PhosphorIcons.caretRight(), color: cs.onSurfaceVariant, size: 16),
          ],
        ),
      ),
    );
  }
}

class _LanguageMenuTile extends ConsumerWidget {
  const _LanguageMenuTile({required this.onTap});

  final VoidCallback onTap;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final language = ref.watch(localeProvider);
    final cs = Theme.of(context).colorScheme;

    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        child: Row(
          children: [
            Icon(PhosphorIcons.globe(), color: cs.onSurface, size: 20),
            const SizedBox(width: 14),
            Expanded(
              child: Text(
                context.l10n.languageSettingsTitle,
                style: const TextStyle(fontSize: 14.5, fontWeight: FontWeight.w500),
              ),
            ),
            Text(
              language.nativeName,
              style: TextStyle(fontSize: 12, color: cs.onSurfaceVariant),
            ),
            const SizedBox(width: 4),
            Icon(PhosphorIcons.caretRight(), color: cs.onSurfaceVariant, size: 16),
          ],
        ),
      ),
    );
  }
}
