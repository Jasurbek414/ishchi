import '../core/api_client.dart';
import '../models/page_response.dart';
import '../models/rating.dart';

class RatingRepository {
  RatingRepository(this._client);

  final ApiClient _client;

  /// Only accepted on a finished job the two actually did together — the server checks that.
  Future<Rating> rate({
    required int jobId,
    required int rateeUserId,
    required int score,
    String? comment,
  }) async {
    final res = await _client.post('/ratings', data: {
      'jobId': jobId,
      'rateeUserId': rateeUserId,
      'score': score,
      if (comment != null && comment.trim().isNotEmpty) 'comment': comment.trim(),
    });
    return Rating.fromJson(res);
  }

  Future<PageResponse<Rating>> forUser(int userId, {int page = 0, int size = 20}) async {
    final res = await _client.get('/ratings/user/$userId', query: {'page': page, 'size': size});
    return PageResponse.fromJson(res, Rating.fromJson);
  }
}
