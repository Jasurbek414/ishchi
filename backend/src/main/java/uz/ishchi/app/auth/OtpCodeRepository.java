package uz.ishchi.app.auth;

import org.springframework.data.jpa.repository.JpaRepository;
import uz.ishchi.app.common.OtpPurpose;

import java.util.Optional;

public interface OtpCodeRepository extends JpaRepository<OtpCode, Long> {

    Optional<OtpCode> findTopByPhoneAndPurposeAndUsedFalseOrderByCreatedAtDesc(String phone, OtpPurpose purpose);
}
