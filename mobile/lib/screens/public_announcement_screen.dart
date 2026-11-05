import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';
import 'package:intl/intl.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';

import '../core/api_config.dart';
import '../core/api_exception.dart';
import '../models/promo_request.dart';
import '../state/location_providers.dart';
import '../state/promo_request_providers.dart';
import '../widgets/async_view.dart';

class PublicAnnouncementScreen extends ConsumerStatefulWidget {
  const PublicAnnouncementScreen({super.key});

  @override
  ConsumerState<PublicAnnouncementScreen> createState() => _PublicAnnouncementScreenState();
}

class _PublicAnnouncementScreenState extends ConsumerState<PublicAnnouncementScreen>
    with SingleTickerProviderStateMixin {
  late final TabController _tabController;

  final _formKey = GlobalKey<FormState>();
  final _titleController = TextEditingController();
  final _subtitleController = TextEditingController();
  final _linkController = TextEditingController();

  String _audience = 'ALL';
  int? _selectedRegionId;
  int _durationDays = 7;
  String? _imagePath;
  bool _submitting = false;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    _titleController.dispose();
    _subtitleController.dispose();
    _linkController.dispose();
    super.dispose();
  }

  Future<void> _pickImage() async {
    final picked = await ImagePicker().pickImage(source: ImageSource.gallery, imageQuality: 85);
    if (picked != null) {
      setState(() => _imagePath = picked.path);
    }
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _submitting = true);
    try {
      await ref.read(promoRequestRepositoryProvider).submitRequest(
            title: _titleController.text.trim(),
            subtitle: _subtitleController.text.trim().isEmpty ? null : _subtitleController.text.trim(),
            linkUrl: _linkController.text.trim().isEmpty ? null : _linkController.text.trim(),
            audience: _audience,
            regionId: _selectedRegionId,
            durationDays: _durationDays,
            imagePath: _imagePath,
          );

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text("Arizangiz muvaffaqiyatli yuborildi! Tez orada moderator tomonidan ko'rib chiqiladi."),
            backgroundColor: Color(0xFF16A34A),
          ),
        );
        _titleController.clear();
        _subtitleController.clear();
        _linkController.clear();
        setState(() {
          _imagePath = null;
          _durationDays = 7;
          _selectedRegionId = null;
          _audience = 'ALL';
        });
        ref.invalidate(myPromoRequestsProvider);
        _tabController.animateTo(1);
      }
    } on ApiException catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.message), backgroundColor: Theme.of(context).colorScheme.error),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text("Xatolik yuz berdi: $e")),
        );
      }
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  Future<void> _cancelRequest(int id) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text("Arizani bekor qilish"),
        content: const Text("Ushbu e'lon arizasini bekor qilishni xohlaysizmi?"),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text("Yo'q")),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: Text("Ha, bekor qilish", style: TextStyle(color: Theme.of(ctx).colorScheme.error)),
          ),
        ],
      ),
    );

    if (confirm == true) {
      try {
        await ref.read(promoRequestRepositoryProvider).cancelRequest(id);
        ref.invalidate(myPromoRequestsProvider);
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text("Ariza bekor qilindi")),
          );
        }
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text("Xatolik: $e")),
          );
        }
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return Scaffold(
      appBar: AppBar(
        title: const Text(
          "Ommaviy e'lon",
          style: TextStyle(fontWeight: FontWeight.w700),
        ),
        bottom: TabBar(
          controller: _tabController,
          tabs: const [
            Tab(
              icon: Icon(Icons.add_circle_outline, size: 20),
              text: "Ariza qoldirish",
            ),
            Tab(
              icon: Icon(Icons.history_rounded, size: 20),
              text: "Mening e'lonlarim",
            ),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _buildFormTab(cs),
          _buildHistoryTab(cs),
        ],
      ),
    );
  }

  Widget _buildFormTab(ColorScheme cs) {
    final regionsAsync = ref.watch(regionsProvider);

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Form(
        key: _formKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Info banner
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: cs.primaryContainer.withValues(alpha: 0.3),
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: cs.primary.withValues(alpha: 0.2)),
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Icon(PhosphorIcons.megaphone(PhosphorIconsStyle.fill), color: cs.primary, size: 24),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          "Bosh sahifaga reklama joylash",
                          style: TextStyle(fontWeight: FontWeight.w700, fontSize: 14),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          "E'loningiz moderator tomonidan tekshirilib tasdiqlangach, ilova bosh sahifasidagi karuselda foydalanuvchilarga ko'rsatiladi.",
                          style: TextStyle(color: cs.onSurfaceVariant, fontSize: 12.5, height: 1.35),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // Image upload box
            const Text(
              "Banner rasmi",
              style: TextStyle(fontWeight: FontWeight.w700, fontSize: 14),
            ),
            const SizedBox(height: 8),
            GestureDetector(
              onTap: _pickImage,
              child: _imagePath != null
                  ? Stack(
                      children: [
                        ClipRRect(
                          borderRadius: BorderRadius.circular(16),
                          child: AspectRatio(
                            aspectRatio: 16 / 9,
                            child: Image.file(
                              File(_imagePath!),
                              fit: BoxFit.cover,
                              width: double.infinity,
                            ),
                          ),
                        ),
                        Positioned(
                          right: 8,
                          top: 8,
                          child: Row(
                            children: [
                              CircleAvatar(
                                backgroundColor: Colors.black54,
                                radius: 18,
                                child: IconButton(
                                  icon: const Icon(Icons.edit, size: 18, color: Colors.white),
                                  onPressed: _pickImage,
                                ),
                              ),
                              const SizedBox(width: 6),
                              CircleAvatar(
                                backgroundColor: Colors.black54,
                                radius: 18,
                                child: IconButton(
                                  icon: const Icon(Icons.close, size: 18, color: Colors.white),
                                  onPressed: () => setState(() => _imagePath = null),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    )
                  : Container(
                      height: 150,
                      width: double.infinity,
                      decoration: BoxDecoration(
                        color: cs.surfaceContainerHighest.withValues(alpha: 0.4),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(
                          color: cs.outlineVariant,
                          style: BorderStyle.solid,
                          width: 1.5,
                        ),
                      ),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.add_photo_alternate_outlined, size: 38, color: cs.primary),
                          const SizedBox(height: 8),
                          const Text(
                            "Banner rasmini tanlash",
                            style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            "Tavsiya: gorizontal (16:9) formatdagi rasm",
                            style: TextStyle(color: cs.onSurfaceVariant, fontSize: 12),
                          ),
                        ],
                      ),
                    ),
            ),
            const SizedBox(height: 20),

            // Sarlavha
            const Text(
              "E'lon sarlavhasi *",
              style: TextStyle(fontWeight: FontWeight.w700, fontSize: 14),
            ),
            const SizedBox(height: 8),
            TextFormField(
              controller: _titleController,
              decoration: const InputDecoration(
                hintText: "Masalan: Santexnika xizmatlari va aksiyalar",
                border: OutlineInputBorder(borderRadius: BorderRadius.all(Radius.circular(12))),
              ),
              validator: (v) => (v == null || v.trim().isEmpty) ? "Sarlavha kiritilishi shart" : null,
            ),
            const SizedBox(height: 16),

            // Tavsif
            const Text(
              "Qisqa tavsif / Matn",
              style: TextStyle(fontWeight: FontWeight.w700, fontSize: 14),
            ),
            const SizedBox(height: 8),
            TextFormField(
              controller: _subtitleController,
              maxLines: 3,
              decoration: const InputDecoration(
                hintText: "E'loningiz yoki xizmatingiz haqida qisqacha ma'lumot...",
                border: OutlineInputBorder(borderRadius: BorderRadius.all(Radius.circular(12))),
              ),
            ),
            const SizedBox(height: 16),

            // Bog'lanish / Havola
            const Text(
              "Bog'lanish yoki havola",
              style: TextStyle(fontWeight: FontWeight.w700, fontSize: 14),
            ),
            const SizedBox(height: 8),
            TextFormField(
              controller: _linkController,
              decoration: const InputDecoration(
                hintText: "+998901234567 yoki https://t.me/kanal",
                border: OutlineInputBorder(borderRadius: BorderRadius.all(Radius.circular(12))),
                prefixIcon: Icon(Icons.link),
              ),
            ),
            const SizedBox(height: 20),

            // Auditoriya
            const Text(
              "Mo'ljallangan auditoriya",
              style: TextStyle(fontWeight: FontWeight.w700, fontSize: 14),
            ),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              children: [
                ChoiceChip(
                  label: const Text("Barchaga"),
                  selected: _audience == 'ALL',
                  onSelected: (val) {
                    if (val) setState(() => _audience = 'ALL');
                  },
                ),
                ChoiceChip(
                  label: const Text("Faqat ishchilarga"),
                  selected: _audience == 'WORKER',
                  onSelected: (val) {
                    if (val) setState(() => _audience = 'WORKER');
                  },
                ),
                ChoiceChip(
                  label: const Text("Faqat ish beruvchilarga"),
                  selected: _audience == 'EMPLOYER',
                  onSelected: (val) {
                    if (val) setState(() => _audience = 'EMPLOYER');
                  },
                ),
              ],
            ),
            const SizedBox(height: 20),

            // Hudud
            const Text(
              "Qaysi hududga ko'rinsin?",
              style: TextStyle(fontWeight: FontWeight.w700, fontSize: 14),
            ),
            const SizedBox(height: 8),
            regionsAsync.when(
              data: (regions) => DropdownButtonFormField<int?>(
                value: _selectedRegionId,
                decoration: const InputDecoration(
                  border: OutlineInputBorder(borderRadius: BorderRadius.all(Radius.circular(12))),
                ),
                items: [
                  const DropdownMenuItem<int?>(
                    value: null,
                    child: Text("Barcha viloyatlar (Butun O'zbekiston)"),
                  ),
                  for (final r in regions)
                    DropdownMenuItem<int?>(
                      value: r.id,
                      child: Text(r.name),
                    ),
                ],
                onChanged: (val) => setState(() => _selectedRegionId = val),
              ),
              loading: () => const LinearProgressIndicator(),
              error: (_, __) => const SizedBox.shrink(),
            ),
            const SizedBox(height: 20),

            // Davomiyligi
            const Text(
              "E'lon davomiyligi",
              style: TextStyle(fontWeight: FontWeight.w700, fontSize: 14),
            ),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              children: [
                for (final days in [3, 7, 15, 30])
                  ChoiceChip(
                    label: Text("$days kun"),
                    selected: _durationDays == days,
                    onSelected: (val) {
                      if (val) setState(() => _durationDays = days);
                    },
                  ),
              ],
            ),
            const SizedBox(height: 32),

            // Submit button
            SizedBox(
              width: double.infinity,
              height: 52,
              child: FilledButton.icon(
                onPressed: _submitting ? null : _submit,
                icon: _submitting
                    ? const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                      )
                    : const Icon(Icons.send_rounded),
                label: Text(
                  _submitting ? "Yuborilmoqda..." : "Arizani yuborish",
                  style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                ),
              ),
            ),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }

  Widget _buildHistoryTab(ColorScheme cs) {
    final requestsAsync = ref.watch(myPromoRequestsProvider);

    return RefreshIndicator(
      onRefresh: () async => ref.refresh(myPromoRequestsProvider.future),
      child: AsyncView(
        value: requestsAsync,
        data: (list) {
          if (list.isEmpty) {
            return Center(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 32),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(
                      width: 76,
                      height: 76,
                      decoration: BoxDecoration(
                        color: cs.surfaceContainerHighest.withValues(alpha: 0.5),
                        shape: BoxShape.circle,
                      ),
                      child: Icon(
                        PhosphorIcons.megaphone(),
                        size: 38,
                        color: cs.onSurfaceVariant.withValues(alpha: 0.6),
                      ),
                    ),
                    const SizedBox(height: 16),
                    const Text(
                      "Hozircha arizalar yo'q",
                      style: TextStyle(fontSize: 17, fontWeight: FontWeight.w700),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      "Bosh sahifaga o'z e'loningizni joylashtirish uchun birinchi arizangizni qoldiring.",
                      textAlign: TextAlign.center,
                      style: TextStyle(color: cs.onSurfaceVariant, fontSize: 13.5),
                    ),
                    const SizedBox(height: 20),
                    OutlinedButton.icon(
                      onPressed: () => _tabController.animateTo(0),
                      icon: const Icon(Icons.add),
                      label: const Text("Yangi e'lon berish"),
                    ),
                  ],
                ),
              ),
            );
          }

          return ListView.separated(
            padding: const EdgeInsets.all(16),
            itemCount: list.length,
            separatorBuilder: (_, __) => const SizedBox(height: 12),
            itemBuilder: (context, index) {
              final item = list[index];
              final dateStr = DateFormat('dd.MM.yyyy, HH:mm').format(item.createdAt);

              Color statusBg;
              Color statusFg;
              IconData statusIcon;

              switch (item.status) {
                case PromoRequestStatus.approved:
                  statusBg = const Color(0xFFDCFCE7);
                  statusFg = const Color(0xFF15803D);
                  statusIcon = Icons.check_circle_outline;
                  break;
                case PromoRequestStatus.rejected:
                  statusBg = const Color(0xFFFEE2E2);
                  statusFg = const Color(0xFFB91C1C);
                  statusIcon = Icons.highlight_off;
                  break;
                case PromoRequestStatus.cancelled:
                  statusBg = const Color(0xFFF1F5F9);
                  statusFg = const Color(0xFF64748B);
                  statusIcon = Icons.cancel_outlined;
                  break;
                case PromoRequestStatus.pending:
                  statusBg = const Color(0xFFFEF3C7);
                  statusFg = const Color(0xFFB45309);
                  statusIcon = Icons.schedule;
                  break;
              }

              return Card(
                elevation: 0,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                  side: BorderSide(color: cs.outlineVariant.withValues(alpha: 0.5)),
                ),
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          if (item.imageUrl != null)
                            ClipRRect(
                              borderRadius: BorderRadius.circular(10),
                              child: Image.network(
                                ApiConfig.resolveMediaUrl(item.imageUrl!),
                                width: 64,
                                height: 64,
                                fit: BoxFit.cover,
                                errorBuilder: (_, __, ___) => Container(
                                  width: 64,
                                  height: 64,
                                  color: cs.surfaceContainerHighest,
                                  child: const Icon(Icons.broken_image, size: 24),
                                ),
                              ),
                            )
                          else
                            Container(
                              width: 64,
                              height: 64,
                              decoration: BoxDecoration(
                                color: cs.primaryContainer.withValues(alpha: 0.4),
                                borderRadius: BorderRadius.circular(10),
                              ),
                              child: Icon(Icons.campaign, color: cs.primary, size: 30),
                            ),
                          const SizedBox(width: 14),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  item.title,
                                  style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15),
                                ),
                                if (item.subtitle != null) ...[
                                  const SizedBox(height: 3),
                                  Text(
                                    item.subtitle!,
                                    maxLines: 2,
                                    overflow: TextOverflow.ellipsis,
                                    style: TextStyle(color: cs.onSurfaceVariant, fontSize: 13),
                                  ),
                                ],
                                const SizedBox(height: 6),
                                Text(
                                  dateStr,
                                  style: TextStyle(color: cs.onSurfaceVariant.withValues(alpha: 0.7), fontSize: 11),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 14),
                      const Divider(height: 1),
                      const SizedBox(height: 12),
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                            decoration: BoxDecoration(
                              color: statusBg,
                              borderRadius: BorderRadius.circular(20),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(statusIcon, size: 14, color: statusFg),
                                const SizedBox(width: 4),
                                Text(
                                  item.status.label,
                                  style: TextStyle(
                                    color: statusFg,
                                    fontSize: 12,
                                    fontWeight: FontWeight.w700,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const Spacer(),
                          Text(
                            "${item.durationDays} kun",
                            style: TextStyle(
                              color: cs.onSurfaceVariant,
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                          if (item.status == PromoRequestStatus.pending) ...[
                            const SizedBox(width: 10),
                            TextButton(
                              onPressed: () => _cancelRequest(item.id),
                              style: TextButton.styleFrom(
                                foregroundColor: cs.error,
                                padding: const EdgeInsets.symmetric(horizontal: 8),
                                minimumSize: const Size(0, 32),
                              ),
                              child: const Text("Bekor qilish", style: TextStyle(fontSize: 12)),
                            ),
                          ],
                        ],
                      ),
                      if (item.status == PromoRequestStatus.rejected && item.rejectionReason != null) ...[
                        const SizedBox(height: 10),
                        Container(
                          width: double.infinity,
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(
                            color: cs.errorContainer.withValues(alpha: 0.3),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Text(
                            "Rad etish sababi: ${item.rejectionReason}",
                            style: TextStyle(color: cs.error, fontSize: 12),
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
              );
            },
          );
        },
      ),
    );
  }
}
