package uz.ishchi.app.job.dto;

import java.math.BigDecimal;

/**
 * What similar jobs actually pay, shown while an employer is filling the payment field.
 *
 * <p>The data was already there — every posting records profession, region and payment — it was just
 * never read back. Both sides benefit: employers stop guessing, and a posting well under the going
 * rate becomes visible as such instead of quietly wasting everyone's time.
 */
public record PriceGuidanceResponse(
        Long professionId,
        Long regionId,
        /** How many past postings this is based on. Small numbers are worth showing as weak. */
        long sampleSize,
        BigDecimal minPayment,
        /** 25th percentile — a typical low offer. */
        BigDecimal lowPayment,
        BigDecimal medianPayment,
        /** 75th percentile — a typical strong offer. */
        BigDecimal highPayment,
        BigDecimal maxPayment
) {
    public static PriceGuidanceResponse empty(Long professionId, Long regionId) {
        return new PriceGuidanceResponse(professionId, regionId, 0, null, null, null, null, null);
    }
}
