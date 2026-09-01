import 'package:flutter/widgets.dart';

import '../l10n/l10n_x.dart';

enum TransactionType {
  topup,
  withdrawal,
  adminCredit,
  adminDebit,
  bonus,
  premiumPayment,
  jobPostingFee,
  jobViewFee;

  static TransactionType fromApi(String value) => switch (value) {
        'TOPUP' => TransactionType.topup,
        'WITHDRAWAL' => TransactionType.withdrawal,
        'ADMIN_CREDIT' => TransactionType.adminCredit,
        'ADMIN_DEBIT' => TransactionType.adminDebit,
        'BONUS' => TransactionType.bonus,
        'PREMIUM_PAYMENT' => TransactionType.premiumPayment,
        'JOB_POSTING_FEE' => TransactionType.jobPostingFee,
        'JOB_VIEW_FEE' => TransactionType.jobViewFee,
        _ => TransactionType.bonus,
      };

  String label(BuildContext context) => switch (this) {
        TransactionType.topup => context.l10n.transactionTopup,
        TransactionType.withdrawal => context.l10n.transactionWithdrawal,
        TransactionType.adminCredit => context.l10n.transactionAdminCredit,
        TransactionType.adminDebit => context.l10n.transactionAdminDebit,
        TransactionType.bonus => context.l10n.transactionBonus,
        TransactionType.premiumPayment => context.l10n.transactionPremiumPayment,
        TransactionType.jobPostingFee => context.l10n.transactionJobPostingFee,
        TransactionType.jobViewFee => context.l10n.transactionJobViewFee,
      };
}

class Wallet {
  Wallet({required this.id, required this.balance});

  final int id;
  final num balance;

  factory Wallet.fromJson(Map<String, dynamic> json) =>
      Wallet(id: json['id'] as int, balance: json['balance'] as num);
}

class WalletTransaction {
  WalletTransaction({
    required this.id,
    required this.type,
    required this.amount,
    required this.balanceAfter,
    this.note,
    required this.createdAt,
  });

  final int id;
  final TransactionType type;
  final num amount;
  final num balanceAfter;
  final String? note;
  final DateTime createdAt;

  bool get isCredit => amount >= 0;

  factory WalletTransaction.fromJson(Map<String, dynamic> json) => WalletTransaction(
        id: json['id'] as int,
        type: TransactionType.fromApi(json['type'] as String),
        amount: json['amount'] as num,
        balanceAfter: json['balanceAfter'] as num,
        note: json['note'] as String?,
        createdAt: DateTime.parse(json['createdAt'] as String),
      );
}
