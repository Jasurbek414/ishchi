import 'dart:io';

import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import 'package:latlong2/latlong.dart';

import '../../core/api_config.dart';
import '../../core/api_exception.dart';
import '../../core/formatters.dart';
import '../../l10n/l10n_x.dart';
import '../../models/enums.dart';
import '../../models/job.dart';
import '../../state/app_settings_provider.dart';
import '../../state/core_providers.dart';
import '../../state/job_providers.dart';
import '../../widgets/profession_dropdown.dart';
import '../../widgets/region_district_selector.dart';
import '../location_picker_screen.dart';

class JobFormScreen extends ConsumerStatefulWidget {
  const JobFormScreen({super.key, this.jobId});

  final int? jobId;

  @override
  ConsumerState<JobFormScreen> createState() => _JobFormScreenState();
}

class _JobFormScreenState extends ConsumerState<JobFormScreen> {
  final _formKey = GlobalKey<FormState>();
  final _titleController = TextEditingController();
  final _descriptionController = TextEditingController();
  final _paymentController = TextEditingController();
  final _workersNeededController = TextEditingController(text: '1');
  final _durationValueController = TextEditingController();

  int? _professionId;
  int? _regionId;
  int? _districtId;
  PaymentType _paymentType = PaymentType.fixed;
  JobType _jobType = JobType.daily;
  DurationUnit _durationUnit = DurationUnit.day;
  DateTime? _startDate;
  LatLng? _location;

  bool _loaded = false;
  bool _saving = false;
  String? _error;

  final List<JobImage> _existingImages = [];
  final List<XFile> _pendingImages = [];
  final Set<int> _removingImageIds = {};
  bool _uploadingImages = false;

  bool get _isEdit => widget.jobId != null;

  @override
  void initState() {
    super.initState();
    if (_isEdit) {
      _loadExisting();
    } else {
      _loaded = true;
    }
  }

  Future<void> _loadExisting() async {
    try {
      final job = await ref.read(jobRepositoryProvider).getById(widget.jobId!);
      _titleController.text = job.title;
      _descriptionController.text = job.description;
      _paymentController.text = job.payment.toString();
      _workersNeededController.text = job.workersNeeded.toString();
      _professionId = job.professionId;
      _regionId = job.regionId;
      _districtId = job.districtId;
      _paymentType = job.paymentType;
      _jobType = job.jobType;
      _startDate = job.startDate;
      _durationValueController.text = job.durationValue?.toString() ?? '';
      _durationUnit = job.durationUnit ?? DurationUnit.day;
      if (job.latitude != null && job.longitude != null) {
        _location = LatLng(job.latitude!, job.longitude!);
      }
      _existingImages
        ..clear()
        ..addAll(job.images);
    } on ApiException catch (e) {
      setState(() => _error = e.message);
    } finally {
      if (mounted) setState(() => _loaded = true);
    }
  }

  @override
  void dispose() {
    _titleController.dispose();
    _descriptionController.dispose();
    _paymentController.dispose();
    _workersNeededController.dispose();
    _durationValueController.dispose();
    super.dispose();
  }

  Future<void> _pickImages() async {
    final picked = await ImagePicker().pickMultiImage(imageQuality: 85);
    if (picked.isEmpty) return;
    setState(() => _pendingImages.addAll(picked));
  }

  void _removePendingImage(XFile file) {
    setState(() => _pendingImages.remove(file));
  }

  Future<void> _removeExistingImage(JobImage image) async {
    setState(() => _removingImageIds.add(image.id));
    try {
      await ref.read(jobRepositoryProvider).deleteImage(widget.jobId!, image.id);
      if (mounted) setState(() => _existingImages.removeWhere((i) => i.id == image.id));
    } on ApiException catch (e) {
      if (mounted) setState(() => _error = e.message);
    } finally {
      if (mounted) setState(() => _removingImageIds.remove(image.id));
    }
  }

  Future<void> _pickLocation() async {
    final picked = await Navigator.push<LatLng>(
      context,
      MaterialPageRoute(builder: (_) => LocationPickerScreen(initial: _location)),
    );
    if (picked != null) setState(() => _location = picked);
  }

  Future<void> _pickStartDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _startDate ?? DateTime.now(),
      firstDate: DateTime.now().subtract(const Duration(days: 1)),
      lastDate: DateTime.now().add(const Duration(days: 365)),
    );
    if (picked != null) setState(() => _startDate = picked);
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    if (_professionId == null || _regionId == null || _districtId == null) {
      setState(() => _error = context.l10n.selectProfessionRegionDistrictError);
      return;
    }
    setState(() {
      _saving = true;
      _error = null;
    });
    final payment = num.tryParse(_paymentController.text.trim()) ?? 0;
    final workersNeeded = int.tryParse(_workersNeededController.text.trim()) ?? 1;
    final durationValue = int.tryParse(_durationValueController.text.trim());

    try {
      final repo = ref.read(jobRepositoryProvider);
      int jobId;
      if (_isEdit) {
        jobId = widget.jobId!;
        await repo.update(
          jobId,
          title: _titleController.text.trim(),
          description: _descriptionController.text.trim(),
          professionId: _professionId,
          regionId: _regionId,
          districtId: _districtId,
          payment: payment,
          paymentType: _paymentType,
          jobType: _jobType,
          workersNeeded: workersNeeded,
          startDate: _startDate,
          durationValue: durationValue,
          durationUnit: durationValue != null ? _durationUnit : null,
          latitude: _location?.latitude,
          longitude: _location?.longitude,
        );
      } else {
        final created = await repo.create(
          title: _titleController.text.trim(),
          description: _descriptionController.text.trim(),
          professionId: _professionId!,
          regionId: _regionId!,
          districtId: _districtId!,
          payment: payment,
          paymentType: _paymentType,
          jobType: _jobType,
          workersNeeded: workersNeeded,
          startDate: _startDate,
          durationValue: durationValue,
          durationUnit: durationValue != null ? _durationUnit : null,
          latitude: _location?.latitude,
          longitude: _location?.longitude,
        );
        jobId = created.id;
      }

      if (_pendingImages.isNotEmpty) {
        setState(() => _uploadingImages = true);
        await repo.uploadImages(jobId, _pendingImages.map((f) => f.path).toList());
      }

      for (final s in [null, ...JobStatus.values]) {
        ref.invalidate(myJobsProvider(s));
      }
      ref.invalidate(jobDetailProvider(jobId));
      if (mounted) context.pop();
    } on ApiException catch (e) {
      if (e.errorCode == 'INSUFFICIENT_BALANCE' && mounted) {
        showDialog<void>(
          context: context,
          builder: (dialogContext) => AlertDialog(
            title: Text(context.l10n.insufficientBalanceTitle),
            content: Text(e.message),
            actions: [
              TextButton(onPressed: () => Navigator.pop(dialogContext), child: Text(context.l10n.commonClose)),
              FilledButton(
                onPressed: () {
                  Navigator.pop(dialogContext);
                  context.push('/profile/wallet');
                },
                child: Text(context.l10n.topUpWalletAction),
              ),
            ],
          ),
        );
      } else {
        setState(() => _error = e.message);
      }
    } finally {
      if (mounted) {
        setState(() {
          _saving = false;
          _uploadingImages = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (!_loaded) {
      final cs = Theme.of(context).colorScheme;
      return Scaffold(body: Center(child: CircularProgressIndicator(color: cs.primary)));
    }

    final cs = Theme.of(context).colorScheme;

    return Scaffold(
      appBar: AppBar(title: Text(_isEdit ? context.l10n.editJobTitle : context.l10n.newJobTitle)),
      body: SafeArea(
        child: Form(
          key: _formKey,
          child: ListView(
            padding: const EdgeInsets.all(20),
            children: [
              TextFormField(
                controller: _titleController,
                decoration: InputDecoration(labelText: context.l10n.jobTitleFieldLabel),
                validator: (v) => (v == null || v.trim().isEmpty) ? context.l10n.requiredFieldError : null,
              ),
              const SizedBox(height: 14),
              TextFormField(
                controller: _descriptionController,
                maxLines: 4,
                decoration: InputDecoration(labelText: context.l10n.jobDescriptionFieldLabel),
                validator: (v) => (v == null || v.trim().isEmpty) ? context.l10n.requiredFieldError : null,
              ),
              const SizedBox(height: 14),
              ProfessionDropdown(value: _professionId, onChanged: (v) => setState(() => _professionId = v)),
              const SizedBox(height: 14),
              RegionDistrictSelector(
                regionId: _regionId,
                districtId: _districtId,
                onChanged: (r, d) => setState(() {
                  _regionId = r;
                  _districtId = d;
                }),
              ),
              const SizedBox(height: 14),
              InkWell(
                onTap: _pickLocation,
                child: InputDecorator(
                  decoration: InputDecoration(labelText: context.l10n.workLocationOnMapLabel),
                  child: Row(
                    children: [
                      Icon(Icons.map_outlined, size: 18, color: cs.primary),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          _location == null
                              ? context.l10n.pickOnMapAction
                              : "${_location!.latitude.toStringAsFixed(5)}, ${_location!.longitude.toStringAsFixed(5)}",
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 14),
              Row(
                children: [
                  Expanded(
                    child: TextFormField(
                      controller: _paymentController,
                      keyboardType: TextInputType.number,
                      decoration: InputDecoration(labelText: context.l10n.paymentSomFieldLabel),
                      validator: (v) => (v == null || num.tryParse(v.trim()) == null) ? context.l10n.enterValidNumberError : null,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: DropdownButtonFormField<PaymentType>(
                      value: _paymentType,
                      isExpanded: true,
                      decoration: InputDecoration(labelText: context.l10n.paymentTypeFieldLabel),
                      items: PaymentType.values
                          .map((t) => DropdownMenuItem(value: t, child: Text(t.label(context), overflow: TextOverflow.ellipsis)))
                          .toList(),
                      onChanged: (v) => setState(() => _paymentType = v ?? _paymentType),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 14),
              DropdownButtonFormField<JobType>(
                value: _jobType,
                isExpanded: true,
                decoration: InputDecoration(labelText: context.l10n.jobTypeLabel),
                items: JobType.values.map((t) => DropdownMenuItem(value: t, child: Text(t.label(context)))).toList(),
                onChanged: (v) => setState(() => _jobType = v ?? _jobType),
              ),
              const SizedBox(height: 14),
              TextFormField(
                controller: _workersNeededController,
                keyboardType: TextInputType.number,
                decoration: InputDecoration(labelText: context.l10n.workersNeededFieldLabel),
              ),
              const SizedBox(height: 14),
              InkWell(
                onTap: _pickStartDate,
                child: InputDecorator(
                  decoration: InputDecoration(labelText: context.l10n.jobStartDateFieldLabel),
                  child: Text(_startDate == null
                      ? context.l10n.commonNotSelected
                      : '${_startDate!.day.toString().padLeft(2, '0')}.${_startDate!.month.toString().padLeft(2, '0')}.${_startDate!.year}'),
                ),
              ),
              const SizedBox(height: 14),
              Row(
                children: [
                  Expanded(
                    child: TextFormField(
                      controller: _durationValueController,
                      keyboardType: TextInputType.number,
                      decoration: InputDecoration(labelText: context.l10n.durationOptionalFieldLabel),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: DropdownButtonFormField<DurationUnit>(
                      value: _durationUnit,
                      isExpanded: true,
                      decoration: InputDecoration(labelText: context.l10n.unitFieldLabel),
                      items: DurationUnit.values.map((u) => DropdownMenuItem(value: u, child: Text(u.label(context)))).toList(),
                      onChanged: (v) => setState(() => _durationUnit = v ?? _durationUnit),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 14),
              Text(context.l10n.photosOptionalLabel, style: Theme.of(context).textTheme.labelLarge),
              const SizedBox(height: 8),
              _buildImagesPicker(cs),
              if (!_isEdit) ..._buildPostingFeeNotice(context, cs),
              if (_error != null) ...[
                const SizedBox(height: 12),
                Text(_error!, style: TextStyle(color: cs.error)),
              ],
              const SizedBox(height: 20),
              ElevatedButton(
                onPressed: _saving ? null : _submit,
                child: _saving
                    ? Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const SizedBox(height: 22, width: 22, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white)),
                          if (_uploadingImages) ...[
                            const SizedBox(width: 10),
                            Text(context.l10n.uploadingPhotosStatus, style: const TextStyle(color: Colors.white)),
                          ],
                        ],
                      )
                    : Text(_isEdit ? context.l10n.saveAction : context.l10n.publishJobAction),
              ),
            ],
          ),
        ),
      ),
    );
  }

  List<Widget> _buildPostingFeeNotice(BuildContext context, ColorScheme cs) {
    final settings = ref.watch(appSettingsProvider).valueOrNull;
    if (settings == null || !settings.jobPostingFeeEnabled || settings.jobPostingFee <= 0) return const [];
    return [
      const SizedBox(height: 14),
      Container(
        width: double.infinity,
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: cs.primaryContainer.withValues(alpha: 0.4),
          borderRadius: BorderRadius.circular(14),
        ),
        child: Row(
          children: [
            Icon(Icons.info_outline, color: cs.primary, size: 20),
            const SizedBox(width: 10),
            Expanded(
              child: Text(
                context.l10n.jobPostingFeeNotice(Formatters.money(context, settings.jobPostingFee)),
                style: TextStyle(color: cs.onSurfaceVariant, fontSize: 13, height: 1.4),
              ),
            ),
          ],
        ),
      ),
    ];
  }

  Widget _buildImagesPicker(ColorScheme cs) {
    return SizedBox(
      height: 96,
      child: ListView(
        scrollDirection: Axis.horizontal,
        children: [
          for (final image in _existingImages)
            Padding(
              padding: const EdgeInsets.only(right: 10),
              child: _ImageThumb(
                image: ClipRRect(
                  borderRadius: BorderRadius.circular(12),
                  child: CachedNetworkImage(
                    imageUrl: ApiConfig.resolveMediaUrl(image.url),
                    width: 88,
                    height: 88,
                    fit: BoxFit.cover,
                  ),
                ),
                loading: _removingImageIds.contains(image.id),
                onRemove: () => _removeExistingImage(image),
              ),
            ),
          for (final file in _pendingImages)
            Padding(
              padding: const EdgeInsets.only(right: 10),
              child: _ImageThumb(
                image: ClipRRect(
                  borderRadius: BorderRadius.circular(12),
                  child: Image.file(File(file.path), width: 88, height: 88, fit: BoxFit.cover),
                ),
                onRemove: () => _removePendingImage(file),
              ),
            ),
          GestureDetector(
            onTap: _pickImages,
            child: Container(
              width: 88,
              height: 88,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: cs.outlineVariant),
              ),
              child: Icon(Icons.add_photo_alternate_outlined, color: cs.primary, size: 32),
            ),
          ),
        ],
      ),
    );
  }
}

class _ImageThumb extends StatelessWidget {
  const _ImageThumb({required this.image, required this.onRemove, this.loading = false});

  final Widget image;
  final VoidCallback onRemove;
  final bool loading;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 88,
      height: 88,
      child: Stack(
        clipBehavior: Clip.none,
        children: [
          image,
          if (loading)
            Positioned.fill(
              child: Container(
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(12),
                  color: Colors.black.withValues(alpha: 0.4),
                ),
                child: const Center(
                  child: SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                  ),
                ),
              ),
            )
          else
            Positioned(
              top: -6,
              right: -6,
              child: GestureDetector(
                onTap: onRemove,
                child: Container(
                  padding: const EdgeInsets.all(2),
                  decoration: const BoxDecoration(color: Colors.black87, shape: BoxShape.circle),
                  child: const Icon(Icons.close, color: Colors.white, size: 16),
                ),
              ),
            ),
        ],
      ),
    );
  }
}
