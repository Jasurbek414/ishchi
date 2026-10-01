import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import 'package:latlong2/latlong.dart';

import '../core/api_exception.dart';
import '../l10n/l10n_x.dart';
import '../models/enums.dart';
import '../models/work_experience.dart';
import '../state/profile_provider.dart';
import '../widgets/profession_multi_selector.dart';
import '../widgets/region_district_selector.dart';
import '../widgets/user_avatar.dart';
import '../widgets/work_experience_dialog.dart';
import '../widgets/map/location_preview.dart';

class EditProfileScreen extends ConsumerStatefulWidget {
  const EditProfileScreen({super.key});

  @override
  ConsumerState<EditProfileScreen> createState() => _EditProfileScreenState();
}

class _EditProfileScreenState extends ConsumerState<EditProfileScreen> {
  final _firstNameController = TextEditingController();
  final _lastNameController = TextEditingController();
  final _aboutController = TextEditingController();
  final _experienceController = TextEditingController();
  final _driverLicenseCategoriesController = TextEditingController();

  int? _regionId;
  int? _districtId;
  Set<int> _professionIds = {};
  LatLng? _location;
  WorkPreference? _workPreference;
  bool _available = true;
  bool _hasDriverLicense = false;
  bool _initialized = false;
  bool _saving = false;
  bool _uploadingAvatar = false;
  bool _savingExperience = false;
  String? _error;

  void _initFromProfile() {
    if (_initialized) return;
    final profile = ref.read(profileProvider).value;
    if (profile == null) return;
    _firstNameController.text = profile.firstName;
    _lastNameController.text = profile.lastName;
    _aboutController.text = profile.about ?? '';
    _experienceController.text = profile.experienceYears?.toString() ?? '';
    _regionId = profile.regionId;
    _districtId = profile.districtId;
    _professionIds = profile.professions.map((p) => p.id).toSet();
    _available = profile.available ?? true;
    _workPreference = profile.workPreference;
    _hasDriverLicense = profile.hasDriverLicense;
    _driverLicenseCategoriesController.text = profile.driverLicenseCategories ?? '';
    if (profile.latitude != null && profile.longitude != null) {
      _location = LatLng(profile.latitude!, profile.longitude!);
    }
    _initialized = true;
  }


  Future<void> _pickAvatar() async {
    final picker = ImagePicker();
    final file = await picker.pickImage(source: ImageSource.gallery, imageQuality: 85, maxWidth: 1024);
    if (file == null) return;
    setState(() => _uploadingAvatar = true);
    try {
      await ref.read(profileProvider.notifier).uploadAvatar(file.path);
    } on ApiException catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
    } finally {
      if (mounted) setState(() => _uploadingAvatar = false);
    }
  }

  Future<void> _save() async {
    if (_regionId == null || _districtId == null) {
      setState(() => _error = context.l10n.selectRegionDistrictError);
      return;
    }
    setState(() {
      _saving = true;
      _error = null;
    });
    final role = ref.read(profileProvider).value?.role;
    try {
      await ref.read(profileProvider.notifier).updateProfile(
            firstName: _firstNameController.text.trim(),
            lastName: _lastNameController.text.trim(),
            regionId: _regionId,
            districtId: _districtId,
            about: _aboutController.text.trim(),
            experienceYears: role == UserRole.worker ? int.tryParse(_experienceController.text.trim()) : null,
            available: role == UserRole.worker ? _available : null,
            professionIds: role == UserRole.worker ? _professionIds.toList() : null,
            latitude: _location?.latitude,
            longitude: _location?.longitude,
            clearLocation: _location == null,
            workPreference: role == UserRole.worker ? _workPreference : null,
            hasDriverLicense: role == UserRole.worker ? _hasDriverLicense : null,
            driverLicenseCategories: role == UserRole.worker
                ? (_hasDriverLicense ? _driverLicenseCategoriesController.text.trim() : '')
                : null,
          );
      if (mounted) context.pop();
    } on ApiException catch (e) {
      setState(() => _error = e.message);
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  Future<void> _addExperience() async {
    final result = await showWorkExperienceDialog(context);
    if (result == null) return;
    setState(() => _savingExperience = true);
    try {
      await ref.read(profileProvider.notifier).addExperience(
            companyName: result.companyName,
            positionTitle: result.positionTitle,
            description: result.description,
            startDate: result.startDate,
            endDate: result.endDate,
          );
    } on ApiException catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
    } finally {
      if (mounted) setState(() => _savingExperience = false);
    }
  }

  Future<void> _editExperience(WorkExperience experience) async {
    final result = await showWorkExperienceDialog(context, initial: experience);
    if (result == null) return;
    setState(() => _savingExperience = true);
    try {
      await ref.read(profileProvider.notifier).updateExperience(
            experience.id,
            companyName: result.companyName,
            positionTitle: result.positionTitle,
            description: result.description,
            startDate: result.startDate,
            endDate: result.endDate,
          );
    } on ApiException catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
    } finally {
      if (mounted) setState(() => _savingExperience = false);
    }
  }

  Future<void> _deleteExperience(WorkExperience experience) async {
    setState(() => _savingExperience = true);
    try {
      await ref.read(profileProvider.notifier).deleteExperience(experience.id);
    } on ApiException catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
    } finally {
      if (mounted) setState(() => _savingExperience = false);
    }
  }

  @override
  void dispose() {
    _firstNameController.dispose();
    _lastNameController.dispose();
    _aboutController.dispose();
    _experienceController.dispose();
    _driverLicenseCategoriesController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    _initFromProfile();
    final cs = Theme.of(context).colorScheme;
    final profile = ref.watch(profileProvider).value;
    final isWorker = profile?.role == UserRole.worker;

    return Scaffold(
      appBar: AppBar(title: Text(context.l10n.editProfileMenu)),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: [
            Center(
              child: Stack(
                children: [
                  UserAvatar(url: profile?.avatarUrl, name: profile?.fullName ?? '', radius: 48),
                  Positioned(
                    bottom: 0,
                    right: 0,
                    child: InkWell(
                      onTap: _uploadingAvatar ? null : _pickAvatar,
                      child: CircleAvatar(
                        radius: 16,
                        backgroundColor: cs.primary,
                        child: _uploadingAvatar
                            ? const SizedBox(height: 14, width: 14, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                            : const Icon(Icons.camera_alt, size: 16, color: Colors.white),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),
            Row(
              children: [
                Expanded(
                  child: TextField(controller: _firstNameController, decoration: InputDecoration(labelText: context.l10n.firstNameFieldLabel)),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: TextField(controller: _lastNameController, decoration: InputDecoration(labelText: context.l10n.lastNameFieldLabel)),
                ),
              ],
            ),
            const SizedBox(height: 14),
            RegionDistrictSelector(
              regionId: _regionId,
              districtId: _districtId,
              onChanged: (region, district) => setState(() {
                _regionId = region;
                _districtId = district;
              }),
            ),
            const SizedBox(height: 14),
            TextField(
              controller: _aboutController,
              maxLines: 3,
              decoration: InputDecoration(labelText: context.l10n.aboutMeFieldLabel),
            ),
            if (isWorker) ...[
              const SizedBox(height: 14),
              TextField(
                controller: _experienceController,
                keyboardType: TextInputType.number,
                decoration: InputDecoration(labelText: context.l10n.experienceYearsFieldLabel),
              ),
              const SizedBox(height: 8),
              SwitchListTile(
                contentPadding: EdgeInsets.zero,
                title: Text(context.l10n.readyForWorkSwitch),
                value: _available,
                onChanged: (v) => setState(() => _available = v),
              ),
              const SizedBox(height: 8),
              Text(context.l10n.whatWorkLookingForQuestion, style: const TextStyle(fontWeight: FontWeight.w700)),
              const SizedBox(height: 8),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: WorkPreference.values.map((wp) {
                  final selected = _workPreference == wp;
                  return FilterChip(
                    label: Text(wp.label(context)),
                    selected: selected,
                    onSelected: (value) => setState(() => _workPreference = value ? wp : null),
                  );
                }).toList(),
              ),
              const SizedBox(height: 14),
              Text(context.l10n.professionsLabel, style: const TextStyle(fontWeight: FontWeight.w700)),
              const SizedBox(height: 8),
              ProfessionMultiSelector(
                selectedIds: _professionIds,
                onChanged: (ids) => setState(() => _professionIds = ids),
              ),
              const SizedBox(height: 18),
              const Divider(),
              const SizedBox(height: 8),
              SwitchListTile(
                contentPadding: EdgeInsets.zero,
                title: Text(context.l10n.hasDriverLicenseSwitch),
                value: _hasDriverLicense,
                onChanged: (v) => setState(() => _hasDriverLicense = v),
              ),
              if (_hasDriverLicense) ...[
                const SizedBox(height: 4),
                TextField(
                  controller: _driverLicenseCategoriesController,
                  decoration: InputDecoration(labelText: context.l10n.driverLicenseCategoriesFieldLabel),
                ),
              ],
              const SizedBox(height: 18),
              const Divider(),
              const SizedBox(height: 8),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(context.l10n.workExperienceSectionTitle, style: const TextStyle(fontWeight: FontWeight.w700)),
                  IconButton(
                    onPressed: _savingExperience ? null : _addExperience,
                    icon: Icon(Icons.add_circle, color: cs.primary),
                    tooltip: context.l10n.commonAdd,
                  ),
                ],
              ),
              if (profile?.experiences.isEmpty ?? true)
                Padding(
                  padding: const EdgeInsets.symmetric(vertical: 8),
                  child: Text(context.l10n.noWorkExperienceYet, style: TextStyle(color: cs.onSurfaceVariant, fontSize: 13)),
                )
              else
                ...profile!.experiences.map((exp) => Card(
                      margin: const EdgeInsets.only(top: 8),
                      child: ListTile(
                        title: Text(exp.positionTitle, style: const TextStyle(fontWeight: FontWeight.w700)),
                        subtitle: Text(
                          '${exp.companyName}\n${exp.startDate.year} — ${exp.isCurrent ? context.l10n.presentDate : exp.endDate!.year}',
                        ),
                        isThreeLine: true,
                        trailing: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            IconButton(
                              onPressed: _savingExperience ? null : () => _editExperience(exp),
                              icon: const Icon(Icons.edit_outlined, size: 20),
                            ),
                            IconButton(
                              onPressed: _savingExperience ? null : () => _deleteExperience(exp),
                              icon: Icon(Icons.delete_outline, size: 20, color: cs.error),
                            ),
                          ],
                        ),
                      ),
                    )),
            ],
            const SizedBox(height: 14),
            LocationField(
              label: isWorker ? context.l10n.workLocationOnMapLabel : context.l10n.addressOnMapLabel,
              value: _location,
              onChanged: (point) => setState(() => _location = point),
            ),
            if (_error != null) ...[
              const SizedBox(height: 8),
              Text(_error!, style: TextStyle(color: cs.error)),
            ],
            const SizedBox(height: 20),
            ElevatedButton(
              onPressed: _saving ? null : _save,
              child: _saving
                  ? const SizedBox(height: 22, width: 22, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                  : Text(context.l10n.saveAction),
            ),
          ],
        ),
      ),
    );
  }
}
