import 'dart:convert';

enum NotificationType {
  job,
  application,
  broadcast,
  system;

  static NotificationType fromString(String? val) {
    return switch (val?.toLowerCase()) {
      'job' || 'new_job' || 'job_match' => NotificationType.job,
      'application' || 'job_application' => NotificationType.application,
      'broadcast' || 'admin_broadcast' => NotificationType.broadcast,
      _ => NotificationType.system,
    };
  }
}

class InAppNotification {
  final String id;
  final String title;
  final String body;
  final DateTime createdAt;
  final bool isRead;
  final NotificationType type;
  final Map<String, dynamic> data;

  const InAppNotification({
    required this.id,
    required this.title,
    required this.body,
    required this.createdAt,
    this.isRead = false,
    this.type = NotificationType.system,
    this.data = const {},
  });

  int? get jobId {
    final raw = data['jobId'] ?? data['job_id'] ?? data['id'];
    if (raw == null) return null;
    return int.tryParse(raw.toString());
  }

  InAppNotification copyWith({
    String? id,
    String? title,
    String? body,
    DateTime? createdAt,
    bool? isRead,
    NotificationType? type,
    Map<String, dynamic>? data,
  }) {
    return InAppNotification(
      id: id ?? this.id,
      title: title ?? this.title,
      body: body ?? this.body,
      createdAt: createdAt ?? this.createdAt,
      isRead: isRead ?? this.isRead,
      type: type ?? this.type,
      data: data ?? this.data,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'title': title,
      'body': body,
      'createdAt': createdAt.toIso8601String(),
      'isRead': isRead,
      'type': type.name,
      'data': data,
    };
  }

  factory InAppNotification.fromMap(Map<String, dynamic> map) {
    return InAppNotification(
      id: map['id']?.toString() ?? DateTime.now().millisecondsSinceEpoch.toString(),
      title: map['title']?.toString() ?? '',
      body: map['body']?.toString() ?? '',
      createdAt: map['createdAt'] != null
          ? DateTime.tryParse(map['createdAt'].toString()) ?? DateTime.now()
          : DateTime.now(),
      isRead: map['isRead'] == true,
      type: NotificationType.fromString(map['type']?.toString()),
      data: map['data'] is Map<String, dynamic>
          ? map['data'] as Map<String, dynamic>
          : (map['data'] is String ? _safeParseJson(map['data']) : const {}),
    );
  }

  static Map<String, dynamic> _safeParseJson(String jsonStr) {
    try {
      return jsonDecode(jsonStr) as Map<String, dynamic>;
    } catch (_) {
      return const {};
    }
  }

  String toJson() => jsonEncode(toMap());

  factory InAppNotification.fromJson(String source) =>
      InAppNotification.fromMap(jsonDecode(source) as Map<String, dynamic>);
}
