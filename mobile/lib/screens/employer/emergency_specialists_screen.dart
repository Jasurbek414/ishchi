import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../models/worker.dart';
import '../../state/worker_providers.dart';
import '../../widgets/async_view.dart';
import '../../widgets/user_avatar.dart';

class SpecialtyItem {
  final String id;
  final String title;
  final String subtitle;
  final String icon;
  final String searchKeyword;
  final List<Color> gradientColors;

  const SpecialtyItem({
    required this.id,
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.searchKeyword,
    required this.gradientColors,
  });
}

class EmergencySpecialistsScreen extends ConsumerStatefulWidget {
  const EmergencySpecialistsScreen({super.key});

  @override
  ConsumerState<EmergencySpecialistsScreen> createState() => _EmergencySpecialistsScreenState();
}

class _EmergencySpecialistsScreenState extends ConsumerState<EmergencySpecialistsScreen> {
  final _searchController = TextEditingController();
  SpecialtyItem? _selectedSpecialty;

  static const List<SpecialtyItem> _specialties = [
    SpecialtyItem(
      id: 'santexnik',
      title: 'Santexnik',
      subtitle: 'Suv toshishi, quvur yorilishi, kran va kanalizatsiya',
      icon: '💧',
      searchKeyword: 'santexnik',
      gradientColors: [Color(0xFF0284C7), Color(0xFF0369A1)],
    ),
    SpecialtyItem(
      id: 'elektrik',
      title: 'Elektrik',
      subtitle: 'Qisqa tutashuv, elektr uzilishi, avtomat, montaj',
      icon: '⚡',
      searchKeyword: 'elektrik',
      gradientColors: [Color(0xFFD97706), Color(0xFFB45309)],
    ),
    SpecialtyItem(
      id: 'qulf',
      title: 'Qulf ustasi / Ochish',
      subtitle: 'Eshik qulfi buzilishi, qulflangan eshikni ochish',
      icon: '🔑',
      searchKeyword: 'qulf',
      gradientColors: [Color(0xFF059669), Color(0xFF047857)],
    ),
    SpecialtyItem(
      id: 'gaz',
      title: 'Gaz va isitish qozoni',
      subtitle: 'Kotyol, kolonka, gaz quvurlari nosozligi',
      icon: '🔥',
      searchKeyword: 'gaz',
      gradientColors: [Color(0xFFDC2626), Color(0xFFB91C1C)],
    ),
    SpecialtyItem(
      id: 'evakuator',
      title: 'Evakuator / Avto SOS',
      subtitle: 'Avariya, tortib olib ketish, yo\'lda yordam',
      icon: '🚗',
      searchKeyword: 'evakuator',
      gradientColors: [Color(0xFF4F46E5), Color(0xFF4338CA)],
    ),
    SpecialtyItem(
      id: 'konditsioner',
      title: 'Konditsioner ustasi',
      subtitle: 'Freon quyish, sovutish tizimlari, tozalash',
      icon: '❄️',
      searchKeyword: 'konditsioner',
      gradientColors: [Color(0xFF0891B2), Color(0xFF0E7490)],
    ),
    SpecialtyItem(
      id: 'texnika',
      title: 'Maishiy texnika ustasi',
      subtitle: 'Kir yuvish, muzlatgich, maishiy uskunalar',
      icon: '🧰',
      searchKeyword: 'maishiy',
      gradientColors: [Color(0xFF64748B), Color(0xFF475569)],
    ),
    SpecialtyItem(
      id: 'all',
      title: 'Barcha mutaxassislar',
      subtitle: 'Ro\'yxatdagi barcha favqulodda ustalarni ko\'rish',
      icon: '🚨',
      searchKeyword: '',
      gradientColors: [Color(0xFFE11D48), Color(0xFFBE123C)],
    ),
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

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final userSearch = _searchController.text.trim();

    // Determine query
    final bool isSearching = userSearch.isNotEmpty;
    final String? effectiveSearch = isSearching
        ? userSearch
        : (_selectedSpecialty != null && _selectedSpecialty!.searchKeyword.isNotEmpty
            ? _selectedSpecialty!.searchKeyword
            : null);

    return Scaffold(
      appBar: AppBar(
        title: Text(
          _selectedSpecialty != null ? _selectedSpecialty!.title : "Favqulodda mutaxassis",
          style: const TextStyle(fontWeight: FontWeight.bold),
        ),
        leading: _selectedSpecialty != null && !isSearching
            ? IconButton(
                icon: const Icon(Icons.arrow_back),
                onPressed: () => setState(() => _selectedSpecialty = null),
              )
            : null,
      ),
      body: Column(
        children: [
          // Search Field
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 12),
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
                contentPadding: const EdgeInsets.symmetric(vertical: 11, horizontal: 14),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(14)),
              ),
              onChanged: (_) => setState(() {}),
              onSubmitted: (_) => setState(() {}),
            ),
          ),

          // Main Content: Either Specialty Cards View OR Specialists List
          Expanded(
            child: (!isSearching && _selectedSpecialty == null)
                ? _buildSpecialtiesCardsView(context, isDark)
                : _buildSpecialistsList(context, effectiveSearch, isDark),
          ),
        ],
      ),
    );
  }

  Widget _buildSpecialtiesCardsView(BuildContext context, bool isDark) {
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 0, 16, 24),
      children: [
        // Intro notice
        Padding(
          padding: const EdgeInsets.only(bottom: 12),
          child: Text(
            "Mutaxassislik yo'nalishini tanlang:",
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.bold,
              color: isDark ? Colors.white70 : const Color(0xFF334155),
            ),
          ),
        ),

        // Grid / List of Specialty Cards
        ..._specialties.map((item) => _buildSpecialtyCard(context, item, isDark)),

        const SizedBox(height: 16),
        _buildJoinBanner(context, isDark),
      ],
    );
  }

  Widget _buildSpecialtyCard(BuildContext context, SpecialtyItem item, bool isDark) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1E2128) : Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isDark ? Colors.white12 : Colors.grey.shade200,
          width: 1,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: isDark ? 0.2 : 0.03),
            blurRadius: 6,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(16),
          onTap: () {
            setState(() {
              _selectedSpecialty = item;
            });
          },
          child: Padding(
            padding: const EdgeInsets.all(14),
            child: Row(
              children: [
                // Icon Emblem
                Container(
                  width: 48,
                  height: 48,
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: item.gradientColors,
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    borderRadius: BorderRadius.circular(14),
                    boxShadow: [
                      BoxShadow(
                        color: item.gradientColors.first.withValues(alpha: 0.3),
                        blurRadius: 6,
                        offset: const Offset(0, 2),
                      ),
                    ],
                  ),
                  child: Center(
                    child: Text(
                      item.icon,
                      style: const TextStyle(fontSize: 22),
                    ),
                  ),
                ),
                const SizedBox(width: 14),

                // Title & Subtitle
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        item.title,
                        style: const TextStyle(
                          fontSize: 15.5,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        item.subtitle,
                        style: TextStyle(
                          fontSize: 12,
                          color: isDark ? Colors.white60 : Colors.grey.shade600,
                          height: 1.25,
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ),
                ),

                const SizedBox(width: 8),
                Icon(
                  Icons.arrow_forward_ios_rounded,
                  size: 14,
                  color: isDark ? Colors.white38 : Colors.grey.shade400,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildSpecialistsList(BuildContext context, String? searchKeyword, bool isDark) {
    final emergencyAsync = ref.watch(
      emergencySpecialistsProvider((
        regionId: null,
        professionId: null,
        search: searchKeyword,
      )),
    );

    return RefreshIndicator(
      onRefresh: () => ref.refresh(emergencySpecialistsProvider((
        regionId: null,
        professionId: null,
        search: searchKeyword,
      )).future),
      child: Column(
        children: [
          // Breadcrumb header if filtered by specialty
          if (_selectedSpecialty != null && _searchController.text.trim().isEmpty)
            Container(
              margin: const EdgeInsets.fromLTRB(16, 0, 16, 10),
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: BoxDecoration(
                color: isDark ? const Color(0xFF1E2128) : const Color(0xFFF1F5F9),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Row(
                children: [
                  Text(_selectedSpecialty!.icon, style: const TextStyle(fontSize: 16)),
                  const SizedBox(width: 6),
                  Expanded(
                    child: Text(
                      "${_selectedSpecialty!.title} bo'yicha mutaxassislar",
                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                    ),
                  ),
                  TextButton(
                    onPressed: () => setState(() => _selectedSpecialty = null),
                    style: TextButton.styleFrom(
                      padding: const EdgeInsets.symmetric(horizontal: 8),
                      minimumSize: Size.zero,
                      tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                    ),
                    child: const Text("Barcha yo'nalishlar", style: TextStyle(fontSize: 12)),
                  ),
                ],
              ),
            ),

          Expanded(
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
                          size: 60,
                          color: Colors.grey.shade400,
                        ),
                      ),
                      const SizedBox(height: 14),
                      const Center(
                        child: Text(
                          "Mutaxassis topilmadi",
                          style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                        ),
                      ),
                      const SizedBox(height: 6),
                      Center(
                        child: Text(
                          _selectedSpecialty != null || _searchController.text.isNotEmpty
                              ? "Ushbu yo'nalish bo'yicha hozircha favqulodda usta yo'q"
                              : "Hozircha tezkor mutaxassislar ro'yxati shakllanmoqda",
                          style: const TextStyle(fontSize: 13, color: Colors.grey),
                          textAlign: TextAlign.center,
                        ),
                      ),
                      const SizedBox(height: 20),
                      Center(
                        child: OutlinedButton.icon(
                          icon: const Icon(Icons.arrow_back, size: 16),
                          label: const Text("Barcha yo'nalishlarga qaytish"),
                          onPressed: () {
                            _searchController.clear();
                            setState(() => _selectedSpecialty = null);
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
                    if (worker.regionName.isNotEmpty) ...[
                      Icon(Icons.location_on_outlined, size: 14, color: Colors.grey.shade500),
                      const SizedBox(width: 3),
                      Flexible(
                        child: Text(
                          worker.districtName.isNotEmpty
                              ? "${worker.regionName}, ${worker.districtName}"
                              : worker.regionName,
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
                    if (worker.ratingAverage != null && worker.ratingAverage! > 0)
                      Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(Icons.star, size: 14, color: Color(0xFFF59E0B)),
                          const SizedBox(width: 2),
                          Text(
                            worker.ratingAverage!.toStringAsFixed(1),
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
