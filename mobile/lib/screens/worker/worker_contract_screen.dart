import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';

import '../../models/contract_status.dart';
import '../../state/contract_providers.dart';
import '../../state/core_providers.dart';
import '../../state/profile_provider.dart';
import '../../widgets/async_view.dart';

class WorkerContractScreen extends ConsumerStatefulWidget {
  const WorkerContractScreen({super.key});

  @override
  ConsumerState<WorkerContractScreen> createState() => _WorkerContractScreenState();
}

class _WorkerContractScreenState extends ConsumerState<WorkerContractScreen> {
  final _formKey = GlobalKey<FormState>();

  final _fullNameCtrl = TextEditingController();
  final _phoneCtrl = TextEditingController();
  final _telegramCtrl = TextEditingController();
  final _experienceCtrl = TextEditingController();
  final _descriptionCtrl = TextEditingController();

  String _selectedCategory = '💧 Santexnik';
  bool _agreedToTerms = false;
  bool _isSubmitting = false;
  bool _showFormOverride = false;

  File? _passportPhoto;
  File? _passportBack;
  File? _certificate;
  File? _toolsPhoto;

  static const _categories = [
    '💧 Santexnik',
    '⚡ Elektrik',
    '🔑 Qulf ustasi / ochish',
    '🔥 Gaz va isitish qozoni',
    '🚗 Evakuator / Avto SOS',
    '❄️ Konditsioner va sovutish',
    '🧰 Maishiy texnika ustasi',
    '🚗 Avtomexanik / Shinomontaj',
    '🚪 Duradgor / Mebel ustasi',
    '✨ Boshqa tezkor usta',
  ];

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final profile = ref.read(profileProvider).valueOrNull;
      if (profile != null) {
        _fullNameCtrl.text = "${profile.firstName} ${profile.lastName}".trim();
        _phoneCtrl.text = profile.phone;
        if (profile.experienceYears != null && profile.experienceYears! > 0) {
          _experienceCtrl.text = profile.experienceYears.toString();
        }
        if (profile.about != null) {
          _descriptionCtrl.text = profile.about!;
        }
      }
    });
  }

  @override
  void dispose() {
    _fullNameCtrl.dispose();
    _phoneCtrl.dispose();
    _telegramCtrl.dispose();
    _experienceCtrl.dispose();
    _descriptionCtrl.dispose();
    super.dispose();
  }

  Future<void> _pickImage(Function(File?) onPicked) async {
    try {
      final picked = await ImagePicker().pickImage(
        source: ImageSource.gallery,
        imageQuality: 85,
        maxWidth: 1600,
        maxHeight: 1600,
      );
      if (picked != null) {
        setState(() => onPicked(File(picked.path)));
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text("Rasm tanlashda xatolik: $e")),
        );
      }
    }
  }

  Future<void> _submitApplication() async {
    if (!_formKey.currentState!.validate()) return;

    if (!_agreedToTerms) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Iltimos, shartnoma shartlariga rozilik bildiring")),
      );
      return;
    }

    if (_passportPhoto == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Iltimos, pasport yoki ID kartangiz old tomoni rasmini yuklang")),
      );
      return;
    }

    setState(() => _isSubmitting = true);

    try {
      final repo = ref.read(contractRepositoryProvider);
      await repo.submitApplication(
        fullName: _fullNameCtrl.text.trim(),
        phone: _phoneCtrl.text.trim(),
        category: _selectedCategory,
        experienceYears: int.tryParse(_experienceCtrl.text.trim()),
        description: _descriptionCtrl.text.trim(),
        telegramUsername: _telegramCtrl.text.trim(),
        agreedToTerms: _agreedToTerms,
        passportPhotoPath: _passportPhoto?.path,
        passportBackPath: _passportBack?.path,
        certificatePath: _certificate?.path,
        toolsPhotoPath: _toolsPhoto?.path,
      );

      ref.invalidate(contractStatusProvider);

      if (mounted) {
        setState(() {
          _showFormOverride = false;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text("Arizangiz muvaffaqiyatli qabul qilindi va tekshiruvga yuborildi!"),
            backgroundColor: Color(0xFF16A34A),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text("Xatolik: $e"), backgroundColor: Colors.red),
        );
      }
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  void _showTermsDialog(BuildContext context, String? termsText) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Row(
          children: [
            Icon(PhosphorIconsBold.fileText, color: Color(0xFF2563EB)),
            SizedBox(width: 8),
            Text("Shartnoma shartlari", style: TextStyle(fontSize: 17)),
          ],
        ),
        content: SingleChildScrollView(
          child: Text(
            termsText != null && termsText.isNotEmpty
                ? termsText
                : "Ushbu shartnoma 'Ishchi' platformasi va mustaqil mutaxassis o'rtasida favqulodda xizmat ko'rsatish bo'yicha munosabatlarni tartibga soladi. Mutaxassis chaqiruvlarga o'z vaqtida javob berish va mijozlar bilan halol hisob-kitob qilish majburiyatini oladi.",
            style: const TextStyle(fontSize: 13, height: 1.45),
          ),
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
    final contractAsync = ref.watch(contractStatusProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text("Ishchi bilan shartnoma", style: TextStyle(fontWeight: FontWeight.bold)),
      ),
      body: AsyncView(
        value: contractAsync,
        onRetry: () => ref.invalidate(contractStatusProvider),
        data: (contract) {
          final isApproved = contract.applicationStatus == ContractApplicationStatus.approved || contract.isEmergency;
          final isPending = contract.applicationStatus == ContractApplicationStatus.pending;
          final isRejected = contract.applicationStatus == ContractApplicationStatus.rejected;

          if (!_showFormOverride && (isApproved || isPending || isRejected)) {
            return _buildStatusView(context, contract, isDark);
          }

          return _buildApplicationForm(context, contract, isDark);
        },
      ),
    );
  }

  Widget _buildStatusView(BuildContext context, ContractStatus contract, bool isDark) {
    final isApproved = contract.applicationStatus == ContractApplicationStatus.approved || contract.isEmergency;
    final isPending = contract.applicationStatus == ContractApplicationStatus.pending;
    final isRejected = contract.applicationStatus == ContractApplicationStatus.rejected;

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        if (isApproved) ...[
          // Approved Banner
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFF059669), Color(0xFF10B981)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(20),
              boxShadow: [
                BoxShadow(
                  color: const Color(0xFF10B981).withValues(alpha: 0.3),
                  blurRadius: 12,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.2),
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(PhosphorIconsBold.shieldCheck, color: Colors.white, size: 28),
                    ),
                    const SizedBox(width: 12),
                    const Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            "Shartnoma tasdiqlangan",
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 17,
                              fontWeight: FontWeight.w900,
                            ),
                          ),
                          SizedBox(height: 2),
                          Text(
                            "Siz rasmiy favqulodda mutaxassissiz",
                            style: TextStyle(color: Colors.white, fontSize: 12),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                const Text(
                  "Profilingiz ish beruvchilar uchun 'Favqulodda mutaxassis' bo'limida ko'rinadi va sizga bevosita tezkor chaqiruvlar kelib tushadi.",
                  style: TextStyle(color: Colors.white, fontSize: 13, height: 1.4),
                ),
              ],
            ),
          ),

          const SizedBox(height: 20),

          // Details Card
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: isDark ? const Color(0xFF1E2128) : Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: isDark ? Colors.white12 : Colors.grey.shade200),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  "Mutaxassislik ma'lumotlari",
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                ),
                const SizedBox(height: 12),
                _buildInfoRow("Yo'nalish:", contract.category ?? "Favqulodda mutaxassis"),
                const Divider(height: 20),
                _buildInfoRow("Bog'lanish telefoni:", contract.phone ?? "-"),
                const Divider(height: 20),
                _buildInfoRow("Holati:", "Faol (24/7 chaqiruvlar yoqilgan)"),
                if (contract.reviewedAt != null) ...[
                  const Divider(height: 20),
                  _buildInfoRow("Tasdiqlangan sana:", contract.reviewedAt!.toLocal().toString().split(' ')[0]),
                ],
              ],
            ),
          ),

          const SizedBox(height: 20),

          OutlinedButton.icon(
            icon: const Icon(PhosphorIconsBold.fileText, size: 18),
            label: const Text("Shartnoma matnini ko'rish"),
            style: OutlinedButton.styleFrom(
              padding: const EdgeInsets.symmetric(vertical: 12),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
            onPressed: () => _showTermsDialog(context, contract.termsText),
          ),
        ] else if (isPending) ...[
          // Pending Banner
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFFD97706), Color(0xFFF59E0B)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(20),
              boxShadow: [
                BoxShadow(
                  color: const Color(0xFFF59E0B).withValues(alpha: 0.3),
                  blurRadius: 12,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.2),
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(PhosphorIconsBold.clockCountdown, color: Colors.white, size: 28),
                    ),
                    const SizedBox(width: 12),
                    const Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            "Arizangiz kutilmoqda",
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 17,
                              fontWeight: FontWeight.w900,
                            ),
                          ),
                          SizedBox(height: 2),
                          Text(
                            "Hujjatlaringiz tekshirilmoqda",
                            style: TextStyle(color: Colors.white, fontSize: 12),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 14),
                const Text(
                  "Siz yuborgan shaxsiy hujjatlar (pasport, guvohnoma) platforma administratori tomonidan ko'rib chiqilmoqda. Natija haqida sizga push-bildirishnoma keladi.",
                  style: TextStyle(color: Colors.white, fontSize: 13, height: 1.4),
                ),
              ],
            ),
          ),

          const SizedBox(height: 20),

          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: isDark ? const Color(0xFF1E2128) : Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: isDark ? Colors.white12 : Colors.grey.shade200),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  "Yuborilgan ma'lumotlar",
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                ),
                const SizedBox(height: 12),
                _buildInfoRow("Tanlangan yo'nalish:", contract.category ?? "-"),
                const Divider(height: 20),
                _buildInfoRow("Telefon:", contract.phone ?? "-"),
                if (contract.submittedAt != null) ...[
                  const Divider(height: 20),
                  _buildInfoRow("Yuborilgan vaqti:", contract.submittedAt!.toLocal().toString().split('.')[0]),
                ],
              ],
            ),
          ),
        ] else if (isRejected) ...[
          // Rejected Banner
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFFDC2626), Color(0xFFEF4444)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(20),
              boxShadow: [
                BoxShadow(
                  color: const Color(0xFFEF4444).withValues(alpha: 0.3),
                  blurRadius: 12,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.2),
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(PhosphorIconsBold.xCircle, color: Colors.white, size: 28),
                    ),
                    const SizedBox(width: 12),
                    const Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            "Ariza rad etildi",
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 17,
                              fontWeight: FontWeight.w900,
                            ),
                          ),
                          SizedBox(height: 2),
                          Text(
                            "Hujjatlarni qayta yuborishingiz mumkin",
                            style: TextStyle(color: Colors.white, fontSize: 12),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                if (contract.rejectionReason != null && contract.rejectionReason!.isNotEmpty) ...[
                  const SizedBox(height: 14),
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: Colors.black.withValues(alpha: 0.2),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Text(
                      "Sabab: ${contract.rejectionReason}",
                      style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.w600),
                    ),
                  ),
                ],
              ],
            ),
          ),

          const SizedBox(height: 24),

          ElevatedButton.icon(
            icon: const Icon(Icons.refresh),
            label: const Text("Qaytadan ariza topshirish", style: TextStyle(fontWeight: FontWeight.bold)),
            style: ElevatedButton.styleFrom(
              padding: const EdgeInsets.symmetric(vertical: 14),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
            onPressed: () => setState(() => _showFormOverride = true),
          ),
        ],
      ],
    );
  }

  Widget _buildApplicationForm(BuildContext context, ContractStatus contract, bool isDark) {
    return Form(
      key: _formKey,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Banner intro
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFF2563EB), Color(0xFF4F46E5)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(16),
            ),
            child: const Row(
              children: [
                Icon(PhosphorIconsBold.handshake, color: Colors.white, size: 36),
                SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        "Tezkor mutaxassis bo'ling",
                        style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold),
                      ),
                      SizedBox(height: 2),
                      Text(
                        "Shartnoma tuzing, hujjatlaringizni tasdiqlang va 24/7 to'g'ridan-to'g'ri chaqiruvlarni oling!",
                        style: TextStyle(color: Colors.white, fontSize: 11.5, height: 1.3),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 20),

          // Profession Category Chips
          const Text(
            "Mutaxassislik yo'nalishingiz",
            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
          ),
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: _categories.map((cat) {
              final isSelected = _selectedCategory == cat;
              return ChoiceChip(
                label: Text(cat),
                selected: isSelected,
                selectedColor: const Color(0xFF2563EB),
                labelStyle: TextStyle(
                  color: isSelected ? Colors.white : (isDark ? Colors.white70 : Colors.black87),
                  fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                  fontSize: 12,
                ),
                onSelected: (selected) {
                  if (selected) setState(() => _selectedCategory = cat);
                },
              );
            }).toList(),
          ),

          const SizedBox(height: 20),

          // Inputs
          TextFormField(
            controller: _fullNameCtrl,
            decoration: InputDecoration(
              labelText: "F.I.SH (To'liq ismingiz)",
              prefixIcon: const Icon(Icons.person_outline),
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
            ),
            validator: (v) => v == null || v.trim().isEmpty ? "Ismingizni kiriting" : null,
          ),
          const SizedBox(height: 14),

          TextFormField(
            controller: _phoneCtrl,
            keyboardType: TextInputType.phone,
            decoration: InputDecoration(
              labelText: "Telefon raqamingiz (24/7 aloqa uchun)",
              prefixIcon: const Icon(Icons.phone_outlined),
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
            ),
            validator: (v) => v == null || v.trim().isEmpty ? "Telefon raqamini kiriting" : null,
          ),
          const SizedBox(height: 14),

          Row(
            children: [
              Expanded(
                child: TextFormField(
                  controller: _experienceCtrl,
                  keyboardType: TextInputType.number,
                  decoration: InputDecoration(
                    labelText: "Ish staji (yil)",
                    prefixIcon: const Icon(Icons.work_outline),
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: TextFormField(
                  controller: _telegramCtrl,
                  decoration: InputDecoration(
                    labelText: "Telegram (@login)",
                    prefixIcon: const Icon(Icons.send_outlined),
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),

          TextFormField(
            controller: _descriptionCtrl,
            maxLines: 3,
            decoration: InputDecoration(
              labelText: "Xizmatlaringiz haqida qisqacha",
              hintText: "Qanday tezkor nosozliklarni bartaraf qilasiz, qaysi hududlarda xizmat ko'rsatasiz...",
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
            ),
          ),

          const SizedBox(height: 24),

          // Document Upload Section
          const Text(
            "Hujjatlarni yuklash",
            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
          ),
          const SizedBox(height: 4),
          Text(
            "Shaxsingizni tasdiqlash uchun pasport yoki ID karta rasmi talab qilinadi",
            style: TextStyle(fontSize: 12, color: Colors.grey.shade600),
          ),
          const SizedBox(height: 12),

          Row(
            children: [
              Expanded(
                child: _buildDocUploadBox(
                  title: "Pasport (Oldi) *",
                  file: _passportPhoto,
                  onPick: () => _pickImage((f) => _passportPhoto = f),
                  onRemove: () => setState(() => _passportPhoto = null),
                  isDark: isDark,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildDocUploadBox(
                  title: "Pasport (Orqasi)",
                  file: _passportBack,
                  onPick: () => _pickImage((f) => _passportBack = f),
                  onRemove: () => setState(() => _passportBack = null),
                  isDark: isDark,
                ),
              ),
            ],
          ),

          const SizedBox(height: 12),

          Row(
            children: [
              Expanded(
                child: _buildDocUploadBox(
                  title: "Sertifikat / Diplom",
                  subtitle: "Ixtiyoriy",
                  file: _certificate,
                  onPick: () => _pickImage((f) => _certificate = f),
                  onRemove: () => setState(() => _certificate = null),
                  isDark: isDark,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildDocUploadBox(
                  title: "Asboblar / Mashina",
                  subtitle: "Ixtiyoriy",
                  file: _toolsPhoto,
                  onPick: () => _pickImage((f) => _toolsPhoto = f),
                  onRemove: () => setState(() => _toolsPhoto = null),
                  isDark: isDark,
                ),
              ),
            ],
          ),

          const SizedBox(height: 20),

          // Terms Checkbox
          CheckboxListTile(
            value: _agreedToTerms,
            contentPadding: EdgeInsets.zero,
            controlAffinity: ListTileControlAffinity.leading,
            title: Row(
              children: [
                const Expanded(
                  child: Text(
                    "Shartnoma shartlari va talablariga roziman",
                    style: TextStyle(fontSize: 12.5),
                  ),
                ),
                TextButton(
                  onPressed: () => _showTermsDialog(context, contract.termsText),
                  child: const Text("O'qish", style: TextStyle(fontSize: 12.5, fontWeight: FontWeight.bold)),
                ),
              ],
            ),
            onChanged: (val) => setState(() => _agreedToTerms = val ?? false),
          ),

          const SizedBox(height: 16),

          // Submit Button
          SizedBox(
            width: double.infinity,
            height: 50,
            child: ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF2563EB),
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                elevation: 0,
              ),
              onPressed: _isSubmitting ? null : _submitApplication,
              child: _isSubmitting
                  ? const SizedBox(
                      width: 22,
                      height: 22,
                      child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2.5),
                    )
                  : const Text(
                      "Arizani yuborish",
                      style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
                    ),
            ),
          ),

          const SizedBox(height: 30),
        ],
      ),
    );
  }

  Widget _buildDocUploadBox({
    required String title,
    String? subtitle,
    required File? file,
    required VoidCallback onPick,
    required VoidCallback onRemove,
    required bool isDark,
  }) {
    if (file != null) {
      return Container(
        height: 110,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: const Color(0xFF16A34A), width: 1.5),
          image: DecorationImage(image: FileImage(file), fit: BoxFit.cover),
        ),
        child: Stack(
          children: [
            Positioned(
              top: 4,
              right: 4,
              child: InkWell(
                onTap: onRemove,
                child: Container(
                  padding: const EdgeInsets.all(4),
                  decoration: const BoxDecoration(color: Colors.black54, shape: BoxShape.circle),
                  child: const Icon(Icons.close, size: 16, color: Colors.white),
                ),
              ),
            ),
            Positioned(
              bottom: 4,
              left: 4,
              right: 4,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(color: Colors.black60, borderRadius: BorderRadius.circular(6)),
                child: Text(
                  title,
                  style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ),
          ],
        ),
      );
    }

    return InkWell(
      onTap: onPick,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        height: 110,
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(
          color: isDark ? const Color(0xFF1E2128) : const Color(0xFFF8FAFC),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isDark ? Colors.white24 : Colors.grey.shade300,
            style: BorderStyle.solid,
          ),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.add_a_photo_outlined, size: 24, color: Colors.grey.shade500),
            const SizedBox(height: 6),
            Text(
              title,
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.bold,
                color: isDark ? Colors.white70 : Colors.black87,
              ),
              textAlign: TextAlign.center,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
            if (subtitle != null)
              Text(
                subtitle,
                style: TextStyle(fontSize: 10, color: Colors.grey.shade500),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoRow(String label, String value) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(color: Colors.grey, fontSize: 13)),
        const SizedBox(width: 8),
        Expanded(
          child: Text(
            value,
            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
            textAlign: TextAlign.end,
          ),
        ),
      ],
    );
  }
}
