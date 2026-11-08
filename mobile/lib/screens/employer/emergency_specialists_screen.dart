import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../models/worker.dart';
import '../../models/region.dart';
import '../../state/location_providers.dart';
import '../../state/profile_provider.dart';
import '../../state/worker_providers.dart';
import '../../widgets/async_view.dart';
import '../../widgets/user_avatar.dart';

class SpecialtyItem {
  final String id;
  final String title;
  final String subtitle;
  final IconData iconData;
  final String searchKeyword;

  const SpecialtyItem({
    required this.id,
    required this.title,
    required this.subtitle,
    required this.iconData,
    required this.searchKeyword,
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
  int? _selectedRegionId;
  String? _selectedRegionName;
  bool _initializedUserRegion = false;

  static const List<SpecialtyItem> _specialties = [
    SpecialtyItem(
      id: 'santexnik',
      title: 'Santexnik',
      subtitle: 'Suv toshishi, quvur yorilishi, kran va kanalizatsiya',
      iconData: PhosphorIconsRegular.drop,
      searchKeyword: 'santexnik',
    ),
    SpecialtyItem(
      id: 'elektrik',
      title: 'Elektrik',
      subtitle: 'Qisqa tutashuv, elektr uzilishi, avtomat, montaj',
      iconData: PhosphorIconsRegular.lightning,
      searchKeyword: 'elektrik',
    ),
    SpecialtyItem(
      id: 'qulf',
      title: 'Qulf ustasi / Ochish',
      subtitle: 'Eshik qulfi buzilishi, qulflangan eshikni ochish',
      iconData: PhosphorIconsRegular.key,
      searchKeyword: 'qulf',
    ),
    SpecialtyItem(
      id: 'gaz',
      title: 'Gaz va isitish qozoni',
      subtitle: 'Kotyol, kolonka, gaz quvurlari nosozligi',
      iconData: PhosphorIconsRegular.fire,
      searchKeyword: 'gaz',
    ),
    SpecialtyItem(
      id: 'evakuator',
      title: 'Evakuator / Avto SOS',
      subtitle: "Avariya, tortib olib ketish, yo'lda yordam",
      iconData: PhosphorIconsRegular.truck,
      searchKeyword: 'evakuator',
    ),
    SpecialtyItem(
      id: 'konditsioner',
      title: 'Konditsioner ustasi',
      subtitle: 'Freon quyish, sovutish tizimlari, tozalash',
      iconData: PhosphorIconsRegular.snowflake,
      searchKeyword: 'konditsioner',
    ),
    SpecialtyItem(
      id: 'texnika',
      title: 'Maishiy texnika ustasi',
      subtitle: 'Kir yuvish, muzlatgich, maishiy uskunalar',
      iconData: PhosphorIconsRegular.wrench,
      searchKeyword: 'maishiy',
    ),
    SpecialtyItem(
      id: 'all',
      title: 'Barcha mutaxassislar',
      subtitle: "Ro'yxatdagi barcha favqulodda ustalarni ko'rish",
      iconData: PhosphorIconsRegular.usersThree,
      searchKeyword: '',
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

  void _openRegionPicker(BuildContext context) {
    final regionsAsync = ref.read(regionsProvider);
    final regions = regionsAsync.valueOrNull ?? [];

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) {
        final isDark = Theme.of(ctx).brightness == Brightness.dark;
        return Container(
          decoration: BoxDecoration(
            color: isDark ? const Color(0xFF1E2128) : Colors.white,
            borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
          ),
          child: SafeArea(
            child: Padding(
              padding: const EdgeInsets.symmetric(vertical: 16),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 20),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          "Viloyatni tanlang",
                          style: TextStyle(fontSize: 17, fontWeight: FontWeight.bold),
                        ),
                        IconButton(
                          icon: const Icon(Icons.close, size: 20),
                          onPressed: () => Navigator.pop(ctx),
                        ),
                      ],
                    ),
                  ),
                  const Divider(),
                  Flexible(
                    child: ListView(
                      shrinkWrap: true,
                      children: [
                        ListTile(
                          leading: const Icon(PhosphorIconsRegular.globe, color: Color(0xFF2563EB)),
                          title: const Text(
                            "Barcha viloyatlar (butun O'zbekiston)",
                            style: TextStyle(fontWeight: FontWeight.w600),
                          ),
                          trailing: _selectedRegionId == null
                              ? const Icon(Icons.check, color: Color(0xFF2563EB))
                              : null,
                          onTap: () {
                            setState(() {
                              _selectedRegionId = null;
                              _selectedRegionName = null;
                            });
                            Navigator.pop(ctx);
                          },
                        ),
                        const Divider(height: 1),
                        for (final r in regions)
                          ListTile(
                            leading: const Icon(PhosphorIconsRegular.mapPin, size: 20),
                            title: Text(r.name),
                            trailing: _selectedRegionId == r.id
                                ? const Icon(Icons.check, color: Color(0xFF2563EB))
                                : null,
                            onTap: () {
                              setState(() {
                                _selectedRegionId = r.id;
                                _selectedRegionName = r.name;
                              });
                              Navigator.pop(ctx);
                            },
                          ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final userSearch = _searchController.text.trim();
    final bottomInset = MediaQuery.paddingOf(context).bottom;

    // Initialize user region from profile on first load
    final profileAsync = ref.watch(profileProvider);
    if (!_initializedUserRegion && profileAsync.hasValue) {
      final p = profileAsync.value;
      if (p != null) {
        _selectedRegionId = p.regionId;
        _selectedRegionName = p.regionName;
        _initializedUserRegion = true;
      }
    }

    // Determine query
    final bool isSearching = userSearch.isNotEmpty;
    final String? effectiveSearch = isSearching
        ? userSearch
        : (_selectedSpecialty != null && _selectedSpecialty!.searchKeyword.isNotEmpty
            ? _selectedSpecialty!.searchKeyword
            : null);

    return PopScope(
      canPop: _selectedSpecialty == null && !isSearching,
      onPopInvokedWithResult: (didPop, result) {
        if (didPop) return;
        if (_selectedSpecialty != null) {
          setState(() => _selectedSpecialty = null);
        } else if (isSearching) {
          _searchController.clear();
          setState(() {});
        }
      },
      child: Scaffold(
        appBar: AppBar(
          title: Text(
            _selectedSpecialty != null ? _selectedSpecialty!.title : "Favqulodda mutaxassis",
            style: const TextStyle(fontWeight: FontWeight.bold),
          ),
          leading: (_selectedSpecialty != null || isSearching)
              ? IconButton(
                  icon: const Icon(Icons.arrow_back),
                  onPressed: () {
                    if (_selectedSpecialty != null) {
                      setState(() => _selectedSpecialty = null);
                    } else {
                      _searchController.clear();
                      setState(() {});
                    }
                  },
                )
              : null,
        ),
        body: SafeArea(
          top: false,
          bottom: true,
          child: Column(
            children: [
              // Search Field
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
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

              // Region Filter Selector Row
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 0, 16, 10),
                child: Row(
                  children: [
                    Expanded(
                      child: InkWell(
                        onTap: () => _openRegionPicker(context),
                        borderRadius: BorderRadius.circular(10),
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                          decoration: BoxDecoration(
                            color: isDark ? const Color(0xFF1E2128) : const Color(0xFFF1F5F9),
                            borderRadius: BorderRadius.circular(10),
                            border: Border.all(
                              color: _selectedRegionId != null
                                  ? (isDark ? const Color(0xFF3B82F6).withValues(alpha: 0.5) : const Color(0xFF93C5FD))
                                  : (isDark ? Colors.white10 : const Color(0xFFE2E8F0)),
                            ),
                          ),
                          child: Row(
                            children: [
                              Icon(
                                PhosphorIconsRegular.mapPin,
                                size: 16,
                                color: _selectedRegionId != null
                                    ? const Color(0xFF2563EB)
                                    : (isDark ? Colors.white60 : const Color(0xFF64748B)),
                              ),
                              const SizedBox(width: 6),
                              Expanded(
                                child: Text(
                                  _selectedRegionName != null
                                      ? "Hudud: $_selectedRegionName"
                                      : "Hudud: Barcha viloyatlar",
                                  style: TextStyle(
                                    fontSize: 12.5,
                                    fontWeight: FontWeight.w600,
                                    color: _selectedRegionId != null
                                        ? (isDark ? Colors.white : const Color(0xFF1E293B))
                                        : (isDark ? Colors.white70 : const Color(0xFF475569)),
                                  ),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                              Icon(
                                PhosphorIconsRegular.caretDown,
                                size: 14,
                                color: isDark ? Colors.white38 : const Color(0xFF94A3B8),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                    if (_selectedRegionId != null) ...[
                      const SizedBox(width: 8),
                      InkWell(
                        onTap: () {
                          setState(() {
                            _selectedRegionId = null;
                            _selectedRegionName = null;
                          });
                        },
                        borderRadius: BorderRadius.circular(10),
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                          decoration: BoxDecoration(
                            color: isDark ? const Color(0xFF262B35) : const Color(0xFFF1F5F9),
                            borderRadius: BorderRadius.circular(10),
                            border: Border.all(
                              color: isDark ? Colors.white10 : const Color(0xFFE2E8F0),
                            ),
                          ),
                          child: Row(
                            children: [
                              Icon(PhosphorIconsRegular.x, size: 13, color: isDark ? Colors.white60 : const Color(0xFF64748B)),
                              const SizedBox(width: 4),
                              Text(
                                "Barchasi",
                                style: TextStyle(
                                  fontSize: 12,
                                  fontWeight: FontWeight.w600,
                                  color: isDark ? Colors.white70 : const Color(0xFF475569),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ],
                ),
              ),

              // Main Content: Either Specialty Cards View OR Specialists List
              Expanded(
                child: (!isSearching && _selectedSpecialty == null)
                    ? _buildSpecialtiesCardsView(context, isDark, bottomInset)
                    : _buildSpecialistsList(context, effectiveSearch, isDark, bottomInset),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSpecialtiesCardsView(BuildContext context, bool isDark, double bottomInset) {
    return ListView(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: EdgeInsets.fromLTRB(16, 0, 16, 40 + bottomInset),
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

        // Clean & unified Specialty Cards
        ..._specialties.map((item) => _buildSpecialtyCard(context, item, isDark)),

        const SizedBox(height: 16),
        _buildJoinBanner(context, isDark),
      ],
    );
  }

  Widget _buildSpecialtyCard(BuildContext context, SpecialtyItem item, bool isDark) {
    final isAll = item.id == 'all';
    final iconBg = isDark
        ? (isAll ? const Color(0xFF381A22) : const Color(0xFF262B35))
        : (isAll ? const Color(0xFFFFF1F2) : const Color(0xFFF1F5F9));
    final iconColor = isDark
        ? (isAll ? const Color(0xFFFB7185) : Colors.white70)
        : (isAll ? const Color(0xFFE11D48) : const Color(0xFF334155));

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1E2128) : Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isAll
              ? (isDark ? const Color(0xFFE11D48).withValues(alpha: 0.35) : const Color(0xFFFECDD3))
              : (isDark ? Colors.white12 : const Color(0xFFE2E8F0)),
          width: 1,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: isDark ? 0.2 : 0.02),
            blurRadius: 4,
            offset: const Offset(0, 1),
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
                // Clean subtle Icon container - no rainbow gradient!
                Container(
                  width: 46,
                  height: 46,
                  decoration: BoxDecoration(
                    color: iconBg,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: isDark ? Colors.white10 : Colors.black.withValues(alpha: 0.04),
                    ),
                  ),
                  child: Center(
                    child: Icon(
                      item.iconData,
                      size: 22,
                      color: iconColor,
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
                        style: TextStyle(
                          fontSize: 15.5,
                          fontWeight: FontWeight.bold,
                          color: isAll
                              ? (isDark ? const Color(0xFFFDA4AF) : const Color(0xFFBE123C))
                              : null,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        item.subtitle,
                        style: TextStyle(
                          fontSize: 12,
                          color: isDark ? Colors.white60 : const Color(0xFF64748B),
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
                  PhosphorIconsRegular.caretRight,
                  size: 16,
                  color: isDark ? Colors.white38 : const Color(0xFF94A3B8),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildSpecialistsList(BuildContext context, String? searchKeyword, bool isDark, double bottomInset) {
    final emergencyAsync = ref.watch(
      emergencySpecialistsProvider((
        regionId: _selectedRegionId,
        professionId: null,
        search: searchKeyword,
      )),
    );

    return Column(
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
                Icon(
                  _selectedSpecialty!.iconData,
                  size: 18,
                  color: isDark ? Colors.white70 : const Color(0xFF334155),
                ),
                const SizedBox(width: 8),
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
          child: RefreshIndicator(
            onRefresh: () => ref.refresh(emergencySpecialistsProvider((
              regionId: _selectedRegionId,
              professionId: null,
              search: searchKeyword,
            )).future),
            child: AsyncView(
              value: emergencyAsync,
              onRetry: () => ref.invalidate(emergencySpecialistsProvider),
              data: (specialists) {
                if (specialists.isEmpty) {
                  return ListView(
                    physics: const AlwaysScrollableScrollPhysics(),
                    padding: EdgeInsets.fromLTRB(24, 24, 24, 40 + bottomInset),
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
                          _selectedRegionId != null
                              ? "Hozircha ${_selectedRegionName ?? 'ushbu hudud'}da favqulodda usta yo'q"
                              : (_selectedSpecialty != null || _searchController.text.isNotEmpty
                                  ? "Ushbu so'rov bo'yicha usta topilmadi"
                                  : "Hozircha tezkor mutaxassislar ro'yxati shakllanmoqda"),
                          style: const TextStyle(fontSize: 13, color: Colors.grey),
                          textAlign: TextAlign.center,
                        ),
                      ),
                      const SizedBox(height: 20),
                      if (_selectedRegionId != null)
                        Center(
                          child: ElevatedButton.icon(
                            icon: const Icon(PhosphorIconsRegular.globe, size: 16),
                            label: const Text("Barcha viloyatlar bo'yicha ko'rish"),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: const Color(0xFF2563EB),
                              foregroundColor: Colors.white,
                              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                            ),
                            onPressed: () {
                              setState(() {
                                _selectedRegionId = null;
                                _selectedRegionName = null;
                              });
                            },
                          ),
                        )
                      else
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
                  physics: const AlwaysScrollableScrollPhysics(),
                  padding: EdgeInsets.fromLTRB(16, 4, 16, 40 + bottomInset),
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
