import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';

import '../core/api_exception.dart';
import '../state/profile_provider.dart';

class AvatarPresetItem {
  final String id;
  final String name;
  final String assetPath;
  final String serverUrl;

  const AvatarPresetItem({
    required this.id,
    required this.name,
    required this.assetPath,
    required this.serverUrl,
  });
}

const List<AvatarPresetItem> kPresetAvatars = [
  AvatarPresetItem(
    id: 'worker_1',
    name: 'Quruvchi / Usta',
    assetPath: 'assets/avatars/avatar_worker_1.png',
    serverUrl: '/assets/avatars/avatar_worker_1.png',
  ),
  AvatarPresetItem(
    id: 'worker_2',
    name: 'Usta / Duradgor',
    assetPath: 'assets/avatars/avatar_worker_2.png',
    serverUrl: '/assets/avatars/avatar_worker_2.png',
  ),
  AvatarPresetItem(
    id: 'electrician',
    name: 'Elektrik',
    assetPath: 'assets/avatars/avatar_electrician.png',
    serverUrl: '/assets/avatars/avatar_electrician.png',
  ),
  AvatarPresetItem(
    id: 'painter',
    name: 'Pardozchi',
    assetPath: 'assets/avatars/avatar_painter.png',
    serverUrl: '/assets/avatars/avatar_painter.png',
  ),
  AvatarPresetItem(
    id: 'mechanic',
    name: 'Avtochilanar',
    assetPath: 'assets/avatars/avatar_mechanic.png',
    serverUrl: '/assets/avatars/avatar_mechanic.png',
  ),
  AvatarPresetItem(
    id: 'driver',
    name: 'Haydovchi',
    assetPath: 'assets/avatars/avatar_driver.png',
    serverUrl: '/assets/avatars/avatar_driver.png',
  ),
  AvatarPresetItem(
    id: 'chef',
    name: 'Oshpaz',
    assetPath: 'assets/avatars/avatar_chef.png',
    serverUrl: '/assets/avatars/avatar_chef.png',
  ),
  AvatarPresetItem(
    id: 'tailor',
    name: 'Tikuvchi',
    assetPath: 'assets/avatars/avatar_tailor.png',
    serverUrl: '/assets/avatars/avatar_tailor.png',
  ),
  AvatarPresetItem(
    id: 'businessman',
    name: 'Ish beruvchi',
    assetPath: 'assets/avatars/avatar_businessman.png',
    serverUrl: '/assets/avatars/avatar_businessman.png',
  ),
  AvatarPresetItem(
    id: 'businesswoman',
    name: 'Ish beruvchi (A)',
    assetPath: 'assets/avatars/avatar_businesswoman.png',
    serverUrl: '/assets/avatars/avatar_businesswoman.png',
  ),
  AvatarPresetItem(
    id: 'young_man',
    name: 'Yordamchi',
    assetPath: 'assets/avatars/avatar_young_man.png',
    serverUrl: '/assets/avatars/avatar_young_man.png',
  ),
  AvatarPresetItem(
    id: 'neutral',
    name: 'Neytral',
    assetPath: 'assets/avatars/avatar_neutral.png',
    serverUrl: '/assets/avatars/avatar_neutral.png',
  ),
];

class AvatarPickerSheet extends ConsumerStatefulWidget {
  const AvatarPickerSheet({super.key, this.currentAvatarUrl});

  final String? currentAvatarUrl;

  static Future<void> show(BuildContext context, {String? currentAvatarUrl}) {
    return showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => AvatarPickerSheet(currentAvatarUrl: currentAvatarUrl),
    );
  }

  @override
  ConsumerState<AvatarPickerSheet> createState() => _AvatarPickerSheetState();
}

class _AvatarPickerSheetState extends ConsumerState<AvatarPickerSheet> {
  bool _loading = false;
  String? _selectedUrl;

  @override
  void initState() {
    super.initState();
    _selectedUrl = widget.currentAvatarUrl;
  }

  Future<void> _pickFromGallery() async {
    final picker = ImagePicker();
    final file = await picker.pickImage(
      source: ImageSource.gallery,
      imageQuality: 85,
      maxWidth: 1024,
    );
    if (file == null) return;

    setState(() => _loading = true);
    try {
      await ref.read(profileProvider.notifier).uploadAvatar(file.path);
      if (mounted) {
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text("Profil rasmi muvaffaqiyatli yuklandi!"),
            backgroundColor: Colors.green,
          ),
        );
      }
    } on ApiException catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _selectPreset(AvatarPresetItem item) async {
    setState(() {
      _selectedUrl = item.serverUrl;
      _loading = true;
    });

    try {
      await ref.read(profileProvider.notifier).setPresetAvatar(item.serverUrl);
      if (mounted) {
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text("${item.name} avatari tanlandi!"),
            backgroundColor: Colors.green,
          ),
        );
      }
    } on ApiException catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _deleteAvatar() async {
    setState(() => _loading = true);
    try {
      await ref.read(profileProvider.notifier).deleteAvatar();
      if (mounted) {
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text("Profil rasmi o'chirildi"),
            backgroundColor: Colors.orange,
          ),
        );
      }
    } on ApiException catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final cs = theme.colorScheme;

    return Container(
      decoration: BoxDecoration(
        color: theme.scaffoldBackgroundColor,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
      ),
      padding: EdgeInsets.only(
        top: 12,
        left: 20,
        right: 20,
        bottom: MediaQuery.of(context).viewInsets.bottom + 24,
      ),
      constraints: BoxConstraints(
        maxHeight: MediaQuery.of(context).size.height * 0.85,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Drag handle
          Center(
            child: Container(
              width: 40,
              height: 4,
              margin: const EdgeInsets.only(bottom: 16),
              decoration: BoxDecoration(
                color: cs.onSurface.withValues(alpha: 0.2),
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),

          // Header
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                "Profil rasmini tanlang",
                style: theme.textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.w800,
                  fontSize: 18,
                ),
              ),
              if (_loading)
                const SizedBox(
                  width: 20,
                  height: 20,
                  child: CircularProgressIndicator(strokeWidth: 2.5),
                )
              else
                IconButton(
                  icon: const Icon(Icons.close),
                  onPressed: () => Navigator.pop(context),
                  visualDensity: VisualDensity.compact,
                ),
            ],
          ),
          const SizedBox(height: 16),

          // Action Buttons: Gallery & Delete
          Row(
            children: [
              Expanded(
                child: ElevatedButton.icon(
                  onPressed: _loading ? null : _pickFromGallery,
                  icon: const Icon(PhosphorIconsBold.image, size: 20),
                  label: const Text("Galereyadan"),
                  style: ElevatedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  ),
                ),
              ),
              if (widget.currentAvatarUrl != null && widget.currentAvatarUrl!.isNotEmpty) ...[
                const SizedBox(width: 10),
                OutlinedButton.icon(
                  onPressed: _loading ? null : _deleteAvatar,
                  icon: Icon(PhosphorIconsBold.trash, size: 18, color: cs.error),
                  label: Text("O'chirish", style: TextStyle(color: cs.error)),
                  style: OutlinedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 14),
                    side: BorderSide(color: cs.error.withValues(alpha: 0.5)),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  ),
                ),
              ],
            ],
          ),

          const SizedBox(height: 20),
          Row(
            children: [
              Text(
                "Yoki tayyor avatarlardan tanlang:",
                style: theme.textTheme.bodyMedium?.copyWith(
                  fontWeight: FontWeight.w700,
                  color: cs.onSurface.withValues(alpha: 0.8),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),

          // Grid of Preset Avatars
          Flexible(
            child: SingleChildScrollView(
              child: GridView.builder(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 3,
                  crossAxisSpacing: 12,
                  mainAxisSpacing: 14,
                  childAspectRatio: 0.88,
                ),
                itemCount: kPresetAvatars.length,
                itemBuilder: (context, index) {
                  final item = kPresetAvatars[index];
                  final isSelected = _selectedUrl == item.serverUrl;

                  return InkWell(
                    onTap: _loading ? null : () => _selectPreset(item),
                    borderRadius: BorderRadius.circular(16),
                    child: Container(
                      decoration: BoxDecoration(
                        color: isSelected
                            ? cs.primary.withValues(alpha: 0.12)
                            : cs.surfaceContainerHighest.withValues(alpha: 0.35),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(
                          color: isSelected ? cs.primary : Colors.transparent,
                          width: 2.5,
                        ),
                      ),
                      padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 6),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Expanded(
                            child: ClipOval(
                              child: Image.asset(
                                item.assetPath,
                                fit: BoxFit.cover,
                              ),
                            ),
                          ),
                          const SizedBox(height: 6),
                          Text(
                            item.name,
                            style: theme.textTheme.bodySmall?.copyWith(
                              fontSize: 11,
                              fontWeight: isSelected ? FontWeight.w800 : FontWeight.w600,
                              color: isSelected ? cs.primary : null,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            textAlign: TextAlign.center,
                          ),
                        ],
                      ),
                    ),
                  );
                },
              ),
            ),
          ),
        ],
      ),
    );
  }
}
