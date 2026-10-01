import 'package:flutter/widgets.dart';

import '../l10n/l10n_x.dart';

enum UserRole {
  worker,
  employer,
  admin;

  String get apiValue => name.toUpperCase();

  static UserRole fromApi(String value) =>
      UserRole.values.firstWhere((e) => e.apiValue == value, orElse: () => UserRole.worker);

  String label(BuildContext context) => switch (this) {
        UserRole.worker => context.l10n.roleWorker,
        UserRole.employer => context.l10n.roleEmployer,
        UserRole.admin => context.l10n.roleAdmin,
      };
}

enum WorkPreference {
  permanent,
  daily,
  specialist;

  String get apiValue => name.toUpperCase();

  static WorkPreference? fromApi(String? value) =>
      value == null ? null : WorkPreference.values.firstWhere((e) => e.apiValue == value);

  String label(BuildContext context) => switch (this) {
        WorkPreference.permanent => context.l10n.workPreferencePermanent,
        WorkPreference.daily => context.l10n.workPreferenceDaily,
        WorkPreference.specialist => context.l10n.workPreferenceSpecialist,
      };
}

enum JobStatus {
  active,
  inProgress,
  completed,
  cancelled,
  expired;

  String get apiValue => switch (this) {
        JobStatus.active => 'ACTIVE',
        JobStatus.inProgress => 'IN_PROGRESS',
        JobStatus.completed => 'COMPLETED',
        JobStatus.cancelled => 'CANCELLED',
        JobStatus.expired => 'EXPIRED',
      };

  static JobStatus fromApi(String value) =>
      JobStatus.values.firstWhere((e) => e.apiValue == value, orElse: () => JobStatus.active);

  String label(BuildContext context) => switch (this) {
        JobStatus.active => context.l10n.jobStatusActive,
        JobStatus.inProgress => context.l10n.jobStatusInProgress,
        JobStatus.completed => context.l10n.jobStatusCompleted,
        JobStatus.cancelled => context.l10n.jobStatusCancelled,
        JobStatus.expired => context.l10n.jobStatusExpired,
      };
}

enum JobType {
  daily,
  temporary,
  permanent;

  String get apiValue => switch (this) {
        JobType.daily => 'DAILY',
        JobType.temporary => 'TEMPORARY',
        JobType.permanent => 'PERMANENT',
      };

  static JobType fromApi(String value) =>
      JobType.values.firstWhere((e) => e.apiValue == value, orElse: () => JobType.daily);

  String label(BuildContext context) => switch (this) {
        JobType.daily => context.l10n.jobTypeDaily,
        JobType.temporary => context.l10n.jobTypeTemporary,
        JobType.permanent => context.l10n.jobTypePermanent,
      };
}

enum PaymentType {
  fixed,
  dailyRate;

  String get apiValue => switch (this) {
        PaymentType.fixed => 'FIXED',
        PaymentType.dailyRate => 'DAILY_RATE',
      };

  static PaymentType fromApi(String value) =>
      PaymentType.values.firstWhere((e) => e.apiValue == value, orElse: () => PaymentType.fixed);

  String label(BuildContext context) => switch (this) {
        PaymentType.fixed => context.l10n.paymentTypeFixed,
        PaymentType.dailyRate => context.l10n.paymentTypeDailyRate,
      };
}

enum DurationUnit {
  day,
  week,
  month;

  String get apiValue => switch (this) {
        DurationUnit.day => 'DAY',
        DurationUnit.week => 'WEEK',
        DurationUnit.month => 'MONTH',
      };

  static DurationUnit fromApi(String value) =>
      DurationUnit.values.firstWhere((e) => e.apiValue == value, orElse: () => DurationUnit.day);

  String label(BuildContext context) => switch (this) {
        DurationUnit.day => context.l10n.durationUnitDay,
        DurationUnit.week => context.l10n.durationUnitWeek,
        DurationUnit.month => context.l10n.durationUnitMonth,
      };
}

/// Where a worker's response to a job stands.
enum ApplicationStatus {
  interested,
  hired,
  declined;

  String get apiValue => name.toUpperCase();

  static ApplicationStatus? fromApi(String? value) => value == null
      ? null
      : ApplicationStatus.values.firstWhere((e) => e.apiValue == value,
          orElse: () => ApplicationStatus.interested);

  String label(BuildContext context) => switch (this) {
        ApplicationStatus.interested => context.l10n.applicationStatusInterested,
        ApplicationStatus.hired => context.l10n.applicationStatusHired,
        ApplicationStatus.declined => context.l10n.applicationStatusDeclined,
      };
}

/// Why something was reported. Kept short and concrete so the choice is quick to make.
enum ReportReason {
  fakeJob,
  scam,
  notPaid,
  abuse,
  wrongContact,
  other;

  String get apiValue => switch (this) {
        ReportReason.fakeJob => 'FAKE_JOB',
        ReportReason.scam => 'SCAM',
        ReportReason.notPaid => 'NOT_PAID',
        ReportReason.abuse => 'ABUSE',
        ReportReason.wrongContact => 'WRONG_CONTACT',
        ReportReason.other => 'OTHER',
      };

  String label(BuildContext context) => switch (this) {
        ReportReason.fakeJob => context.l10n.reportReasonFakeJob,
        ReportReason.scam => context.l10n.reportReasonScam,
        ReportReason.notPaid => context.l10n.reportReasonNotPaid,
        ReportReason.abuse => context.l10n.reportReasonAbuse,
        ReportReason.wrongContact => context.l10n.reportReasonWrongContact,
        ReportReason.other => context.l10n.reportReasonOther,
      };
}
