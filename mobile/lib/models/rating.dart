/// One score left after a finished job.
class Rating {
  Rating({
    required this.id,
    required this.jobId,
    required this.jobTitle,
    required this.score,
    required this.createdAt,
    this.comment,
  });

  final int id;
  final int jobId;
  final String jobTitle;
  final int score;
  final String? comment;
  final DateTime createdAt;

  factory Rating.fromJson(Map<String, dynamic> json) => Rating(
        id: json['id'] as int,
        jobId: json['jobId'] as int,
        jobTitle: json['jobTitle'] as String? ?? '',
        score: (json['score'] as num).toInt(),
        comment: json['comment'] as String?,
        createdAt: DateTime.parse(json['createdAt'] as String),
      );
}
