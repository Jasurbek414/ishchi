/// What comparable postings pay, shown while an employer fills in the payment field.
///
/// The server suppresses the figures below a handful of samples, where a median says more about
/// chance than about the market — [hasData] is how that arrives.
class PriceGuidance {
  PriceGuidance({
    required this.sampleSize,
    this.minPayment,
    this.lowPayment,
    this.medianPayment,
    this.highPayment,
    this.maxPayment,
  });

  final int sampleSize;
  final num? minPayment;

  /// 25th percentile — a typical low offer.
  final num? lowPayment;
  final num? medianPayment;

  /// 75th percentile — a typical strong offer.
  final num? highPayment;
  final num? maxPayment;

  bool get hasData => sampleSize > 0 && medianPayment != null;

  factory PriceGuidance.fromJson(Map<String, dynamic> json) => PriceGuidance(
        sampleSize: (json['sampleSize'] as num?)?.toInt() ?? 0,
        minPayment: json['minPayment'] as num?,
        lowPayment: json['lowPayment'] as num?,
        medianPayment: json['medianPayment'] as num?,
        highPayment: json['highPayment'] as num?,
        maxPayment: json['maxPayment'] as num?,
      );
}
