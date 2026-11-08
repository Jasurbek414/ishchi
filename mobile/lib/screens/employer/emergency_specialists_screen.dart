import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../l10n/l10n_x.dart';
import '../../models/worker.dart';
import '../../state/worker_providers.dart';
import '../../widgets/async_view.dart';
import '../../widgets/user_avatar.dart';

class EmergencySpecialistsScreen extends ConsumerStatefulWidget {
  const EmergencySpecialistsScreen({super.key});

  @override
  ConsumerState<EmergencySpecialistsScreen> createState() => _EmergencySpecialistsScreenState();
}

class _EmergencySpecialistsScreenState extends ConsumerState<EmergencySpecialistsScreen> {
  final _searchController = TextEditingController();
  String _selectedCategory = 'ALL';

  static const _categories = [
    ('ALL', '🚨 Barchasi', ''),
    ('SANTEXNIK', '💧 Santexnik', 'santexnik'),
    ('ELEKTRIK', '⚡ Elektrik', 'elektrik'),
    ('QULF', '🔑 Qulf ustasi', 'qulf'),
    ('GAZ', '🔥 Gaz va isitish', 'gaz'),
    ('EVAKUATOR', '🚗 Evakuator / SOS', 'evakuator'),
    ('KONDITSIONER', '❄️ Konditsioner', 'konditsioner'),
    ('TEXNIKA', '🧰 Maishiy texnika', 'maishiy'),
  ];

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _makeCall(BuildContext context, String? phone) async {
    if (phone == null || phone.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Telefon raqami ko'rsatilmagan")),
      );
      return;
    }
    final cleanPhone = phone.replaceAll(RegExp(r'[^\d+]'), '');
    final uri = Uri(scheme: 'tel', path: cleanPhone);
    if (!await launchUrl(uri)) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text("Qo'ng'iroq qilib bo'lmadi: $phone")),
        );
      }
    }
  }

  void _showInfoDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Row(
          children: [
            Icon(PhosphorIconsBold.siren, color: Color(0xFFE11D48)),
            SizedBox(width: 8),
            Text("Tezkor xizmat haqida", style: TextStyle(fontSize: 18)),
          ],
        ),
        content: const Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              "Favqulodda mutaxassislar bo'limi shoshilinch avariya yoki zaruriyat holatlarida (suv toshishi, qulf buzilishi, elektr uzilishi, avtomobil nosozligi va h.k.) tezkor usta topish uchun mo'ljallangan.",
              style: TextStyle(fontSize: 14, height: 1.4),
            ),
            SizedBox(height: 12),
            Text(
              "Ustalar bilan to'g'ridan-to'g'ri bog'lanishingiz mumkin. Xizmat haqi va shartlari o'zaro kelishiladi.",
              style: TextStyle(fontSize: 13, color: Colors.grey, height: 1.4),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text("Tushunarli"),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    // Search query combines category keyword and search input
    final categoryKeyword = _categories.firstWhere((c) => c.$1 == _selectedCategory).$3;
    final userSearch = _searchController.text.trim();
    final combinedSearch = userSearch.isNotEmpty
        ? userSearch
        : (categoryKeyword.isNotEmpty ? categoryKeyword : null);

    final emergencyAsync = ref.watch(
      emergencySpecialistsProvider((
        regionId: null,
        professionId: null,
        search: combinedSearch,
      )),
    );

    return Scaffold(
      appBar: AppBar(
        title: const Row(
          children: [
            Icon(PhosphorIconsBold.siren, color: Color(0xFFE11D48), size: 22),
            SizedBox(width: 8),
            Text("Favqulodda mutaxassis", style: TextStyle(fontWeight: FontWeight.bold)),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.info_outline),
            tooltip: "Ma'lumot",
            onPressed: () => _showInfoDialog(context),
          ),
        ],
      ),
      body: Column(
        children: [
          // Banner
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 10),
            child: Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFFE11D48), Color(0xFFF97316)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(16),
                boxShadow: [
                  BoxShadow(
                    color: const Color(0xFFE11D48).withValues(alpha: 0.25),
                    blurRadius: 10,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.2),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(PhosphorIconsBold.phoneCall, color: Colors.white, size: 24),
                  ),
                  const SizedBox(width: 12),
                  const Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          "24/7 Tezkor chaqiruv",
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 15,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                        SizedBox(height: 2),
                        Text(
                          "Avariya, nosozlik yoki shoshilinch vaziyatlarda to'g'ridan-to'g'ri usta chaqiring",
                          style: TextStyle(color: Colors.white, fontSize: 11.5, height: 1.2),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),

          // Search Field
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: TextField(
              controller: _searchController,
              decoration: InputDecoration(
                hintText: "Mutaxassis yoki xizmat qidirish...",
                prefixIcon: const Icon(Icons.search, size: 20),
                suffixIcon: _searchController.text.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Icons.clear, size: 18),
                        onPressed: () {
                          _searchController.clear();
                          setState(() {});
                        },
                      )
                    : null,
                contentPadding: const EdgeInsets.symmetric(vertical: 10, horizontal: 14),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              ),
              onSubmitted: (_) => setState(() {}),
            ),
          ),

          const SizedBox(height: 10),

          // Categories horizontal scroll
          SizedBox(
            height: 38,
            child: ListView.separated(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              scrollDirection: Axis.horizontal,
              itemCount: _categories.length,
              separatorBuilder: (_, __) => const SizedBox(width: 8),
              itemBuilder: (context, i) {
                final cat = _categories[i];
                final isSelected = _selectedCategory == cat.$1;
                return ChoiceChip(
                  label: Text(cat.$2),
                  selected: isSelected,
                  selectedColor: const Color(0xFFE11D48),
                  labelStyle: TextStyle(
                    color: isSelected ? Colors.white : (isDark ? Colors.white70 : Colors.black80),
                    fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                    fontSize: 12.5,
                  ),
                  onSelected: (selected) {
                    if (selected) {
                      setState(() => _selectedCategory = cat.$1);
                    }
                  },
                );
              },
            ),
          ),

          const SizedBox(height: 10),

          // Specialists List
          Expanded(
            child: RefreshIndicator(
              onRefresh: () => ref.refresh(emergencySpecialistsProvider((
                regionId: null,
                professionId: null,
                search: combinedSearch,
              )).future),
              child: AsyncView(
                value: emergencyAsync,
                onRetry: () => ref.invalidate(emergencySpecialistsProvider),
                data: (specialists) {
                  if (specialists.isEmpty) {
                    return ListView(
                      padding: const EdgeInsets.all(24),
                      children: [
                        const SizedBox(height: 40),
                        Center(
                          child: Icon(
                            PhosphorIconsLight.magnifyingGlass,
                            size: 64,
                            color: Colors.grey.shade400,
                          ),
                        ),
                        const SizedBox(height: 16),
                        const Center(
                          child: Text(
                            "Mutaxassis topilmadi",
                            style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                          ),
                        ),
                        const SizedBox(height: 6),
                        Center(
                          child: Text(
                            _selectedCategory != 'ALL' || userSearch.isNotEmpty
                                ? "Boshqa toifa tanlab ko'ring yoki qidiruvni tozalang"
                                : "Hozircha favqulodda toifadagi ustalar mavjud emas",
                            style: const TextStyle(fontSize: 13, color: Colors.grey),
                            textAlign: TextAlign.center,
                          ),
                        ),
                        const SizedBox(height: 20),
                        if (_selectedCategory != 'ALL' || userSearch.isNotEmpty)
                          Center(
                            child: OutlinedButton.icon(
                              icon: const Icon(Icons.refresh, size: 16),
                              label: const Text("Barchasini ko'rsatish"),
                              onPressed: () {
                                _searchController.clear();
                                setState(() => _selectedCategory = 'ALL');
                              },
                            ),
                          ),
                        const SizedBox(height: 40),
                        _buildJoinBanner(context, isDark),
                      ],
                    );
                  }

                  return ListView.builder(
                    padding: const EdgeInsets.fromLTRB(16, 4, 16, 24),
                    itemCount: specialists.length + 1,
                    itemBuilder: (context, i) {
                      if (i == specialists.length) {
                        return Padding(
                          padding: const EdgeInsets.only(top: 16),
                          child: _buildJoinBanner(context, isDark),
                        );
                      }
                      final worker = specialists[i];
                      return _buildSpecialistCard(context, worker, isDark);
                    },
                  );
                },
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSpecialistCard(BuildContext context, Worker worker, bool isDark) {
    final phone = worker.phone;

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1E2128) : Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: const Color(0xFFE11D48).withValues(alpha: 0.25),
          width: 1.2,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: isDark ? 0.2 : 0.04),
            blurRadius: 8,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(16),
          onTap: () => context.push('/employer/workers/${worker.id}'),
          child: Padding(
            padding: const EdgeInsets.all(14),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Avatar
                    UserAvatar(
                      name: worker.fullName,
                      url: worker.avatarUrl,
                      radius: 26,
                    ),
                    const SizedBox(width: 12),

                    // Info
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Expanded(
                                child: Text(
                                  worker.fullName,
                                  style: const TextStyle(
                                    fontSize: 16,
                                    fontWeight: FontWeight.bold,
                                  ),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                              if (worker.verified)
                                const Padding(
                                  padding: EdgeInsets.only(left: 4),
                                  child: Icon(Icons.verified, size: 16, color: Color(0xFF0284C7)),
                                ),
                            ],
                          ),
                          const SizedBox(height: 3),

                          // Profession & Tag
                          Row(
                            children: [
                              Flexible(
                                child: Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                                  decoration: BoxDecoration(
                                    color: const Color(0xFFE11D48).withValues(alpha: 0.1),
                                    borderRadius: BorderRadius.circular(6),
                                  ),
                                  child: Text(
                                    worker.professions.isNotEmpty
                                        ? worker.professions.first.name
                                        : "Mutaxassis",
                                    style: const TextStyle(
                                      fontSize: 11.5,
                                      fontWeight: FontWeight.w700,
                                      color: Color(0xFFE11D48),
                                    ),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ),
                              ),
                              const SizedBox(width: 6),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                decoration: BoxDecoration(
                                  color: const Color(0xFF16A34A).withValues(alpha: 0.12),
                                  borderRadius: BorderRadius.circular(6),
                                ),
                                child: const Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Icon(Icons.bolt, size: 11, color: Color(0xFF16A34A)),
                                    SizedBox(width: 2),
                                    Text(
                                      "Tezkor",
                                      style: TextStyle(
                                        fontSize: 10,
                                        fontWeight: FontWeight.bold,
                                        color: Color(0xFF16A34A),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: 10),

                // Location & Experience Row
                Row(
                  children: [
                    if (worker.region != null) ...[
                      Icon(Icons.location_on_outlined, size: 14, color: Colors.grey.shade500),
                      const SizedBox(width: 3),
                      Flexible(
                        child: Text(
                          worker.district != null
                              ? "${worker.region!.name}, ${worker.district!.name}"
                              : worker.region!.name,
                          style: TextStyle(fontSize: 12, color: Colors.grey.shade600),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      const SizedBox(width: 10),
                    ],
                    if (worker.experienceYears != null && worker.experienceYears! > 0) ...[
                      Icon(Icons.work_outline, size: 14, color: Colors.grey.shade500),
                      const SizedBox(width: 3),
                      Text(
                        "${worker.experienceYears} yil staj",
                        style: TextStyle(fontSize: 12, color: Colors.grey.shade600),
                      ),
                    ],
                    const Spacer(),
                    if (worker.rating != null && worker.rating! > 0)
                      Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(Icons.star, size: 14, color: Color(0xFFF59E0B)),
                          const SizedBox(width: 2),
                          Text(
                            worker.rating!.toStringAsFixed(1),
                            style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
                          ),
                        ],
                      ),
                  ],
                ),

                const Divider(height: 20),

                // Action Buttons
                Row(
                  children: [
                    Expanded(
                      flex: 3,
                      child: ElevatedButton.icon(
                        icon: const Icon(Icons.call, size: 18),
                        label: Text(
                          phone != null && phone.isNotEmpty ? "Qo'ng'iroq" : "Bog'lanish",
                          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                        ),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF16A34A),
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 10),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                          elevation: 0,
                        ),
                        onPressed: () => _makeCall(context, phone),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      flex: 2,
                      child: OutlinedButton(
                        style: OutlinedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(vertical: 10),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                        ),
                        onPressed: () => context.push('/employer/workers/${worker.id}'),
                        child: const Text("Profil", style: TextStyle(fontWeight: FontWeight.w600)),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildJoinBanner(BuildContext context, bool isDark) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1E2128) : const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: isDark ? Colors.white12 : Colors.grey.shade300,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(
            children: [
              Icon(PhosphorIconsBold.handshake, color: Color(0xFF2563EB), size: 20),
              SizedBox(width: 8),
              Expanded(
                child: Text(
                  "Siz ham tezkor mutaxassis bo'lmoqchimisiz?",
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13.5),
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          Text(
            "Ishchi profili orqali 'Ishchi bilan shartnoma' bo'limida ariza qoldiring. Admin tekshiruvidan so'ng ushbu ro'yxatga kiritilasiz.",
            style: TextStyle(fontSize: 12, color: Colors.grey.shade600, height: 1.35),
          ),
        ],
      ),
    );
  }
}
