package uz.ishchi.app.auth;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class OtpAttemptTracker {

    private final OtpCodeRepository otpCodeRepository;

    /**
     * Records one wrong guess and burns the code once {@link OtpCode#MAX_ATTEMPTS} is reached.
     *
     * <p>Runs in its own transaction on purpose: rejecting a wrong code throws, which rolls the
     * caller's transaction back. Incrementing the counter inline would therefore be undone every
     * single time and the cap would never bite — leaving the 4-digit code brute-forceable.
     *
     * @return the number of attempts recorded against this code so far
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public int recordFailure(Long otpId) {
        return otpCodeRepository.findById(otpId).map(otp -> {
            otp.setAttempts(otp.getAttempts() + 1);
            if (otp.getAttempts() >= OtpCode.MAX_ATTEMPTS) {
                otp.setUsed(true);
            }
            return otp.getAttempts();
        }).orElse(0);
    }
}
