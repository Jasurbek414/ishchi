import 'package:flutter/material.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';

class EmergencySpecialistCard extends StatelessWidget {
  const EmergencySpecialistCard({super.key, required this.onTap});

  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(16),
        gradient: LinearGradient(
          colors: isDark
              ? [const Color(0xFF3F0B11), const Color(0xFF1F070A)]
              : [const Color(0xFFFFF1F2), const Color(0xFFFFFBEB)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        border: Border.all(
          color: const Color(0xFFF43F5E).withValues(alpha: 0.6),
          width: 1.5,
        ),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFFE11D48).withValues(alpha: 0.08),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(16),
          onTap: onTap,
          child: Padding(
            padding: const EdgeInsets.all(14),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    // Glowing Siren / Emergency Icon
                    Container(
                      width: 48,
                      height: 48,
                      decoration: BoxDecoration(
                        gradient: const LinearGradient(
                          colors: [Color(0xFFE11D48), Color(0xFFF97316)],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        ),
                        borderRadius: BorderRadius.circular(14),
                        boxShadow: [
                          BoxShadow(
                            color: const Color(0xFFE11D48).withValues(alpha: 0.35),
                            blurRadius: 8,
                            offset: const Offset(0, 3),
                          ),
                        ],
                      ),
                      child: const Center(
                        child: Icon(
                          PhosphorIconsBold.siren,
                          color: Colors.white,
                          size: 24,
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),

                    // Texts & Badges
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              const Expanded(
                                child: Text(
                                  "Favqulodda mutaxassis",
                                  style: TextStyle(
                                    fontSize: 15.5,
                                    fontWeight: FontWeight.w800,
                                    letterSpacing: -0.2,
                                  ),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2.5),
                                decoration: BoxDecoration(
                                  color: const Color(0xFFE11D48),
                                  borderRadius: BorderRadius.circular(6),
                                ),
                                child: const Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Icon(Icons.bolt, size: 11, color: Colors.white),
                                    SizedBox(width: 2),
                                    Text(
                                      "24/7 TEZKOR",
                                      style: TextStyle(
                                        color: Colors.white,
                                        fontSize: 9.5,
                                        fontWeight: FontWeight.w900,
                                        letterSpacing: 0.4,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 3),
                          Text(
                            "Santexnik, elektrik, qulf ochish va boshqa tezkor ustalar",
                            style: TextStyle(
                              fontSize: 12,
                              color: isDark ? Colors.white70 : const Color(0xFF475569),
                              fontWeight: FontWeight.w500,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(width: 6),
                    Container(
                      padding: const EdgeInsets.all(6),
                      decoration: BoxDecoration(
                        color: const Color(0xFFE11D48).withValues(alpha: 0.1),
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(
                        Icons.arrow_forward_ios_rounded,
                        size: 13,
                        color: Color(0xFFE11D48),
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: 10),

                // Direction chips preview
                Row(
                  children: [
                    _buildMiniChip("💧 Santexnik", isDark),
                    const SizedBox(width: 6),
                    _buildMiniChip("⚡ Elektrik", isDark),
                    const SizedBox(width: 6),
                    _buildMiniChip("🔑 Qulf", isDark),
                    const SizedBox(width: 6),
                    _buildMiniChip("🚗 Avto SOS", isDark),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildMiniChip(String label, bool isDark) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
      decoration: BoxDecoration(
        color: isDark
            ? Colors.white.withValues(alpha: 0.08)
            : Colors.white.withValues(alpha: 0.8),
        borderRadius: BorderRadius.circular(6),
        border: Border.all(
          color: const Color(0xFFE11D48).withValues(alpha: 0.2),
          width: 0.8,
        ),
      ),
      child: Text(
        label,
        style: TextStyle(
          fontSize: 10.5,
          fontWeight: FontWeight.w600,
          color: isDark ? Colors.white.withValues(alpha: 0.9) : const Color(0xFF1E293B),
        ),
      ),
    );
  }
}
