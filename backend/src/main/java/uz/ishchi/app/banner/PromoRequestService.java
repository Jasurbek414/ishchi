package uz.ishchi.app.banner;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import uz.ishchi.app.banner.dto.PromoRequestResponse;
import uz.ishchi.app.common.BannerAudience;
import uz.ishchi.app.common.FileStorageService;
import uz.ishchi.app.common.exception.ApiException;
import uz.ishchi.app.location.Region;
import uz.ishchi.app.location.RegionRepository;
import uz.ishchi.app.user.User;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class PromoRequestService {

    private final PromoRequestRepository promoRequestRepository;
    private final PromoBannerRepository promoBannerRepository;
    private final RegionRepository regionRepository;
    private final FileStorageService fileStorageService;

    @Transactional(readOnly = true)
    public List<PromoRequestResponse> myRequests(Long userId) {
        return promoRequestRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(PromoRequestResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<PromoRequestResponse> findAllForAdmin() {
        return promoRequestRepository.findAllForAdmin().stream()
                .map(PromoRequestResponse::from)
                .toList();
    }

    @Transactional
    public PromoRequestResponse create(
            User user,
            String title,
            String subtitle,
            String linkUrl,
            BannerAudience audience,
            Long regionId,
            Integer durationDays,
            MultipartFile image
    ) {
        if (title == null || title.trim().isEmpty()) {
            throw ApiException.badRequest("E'lon sarlavhasi kiritilishi shart");
        }
        int days = (durationDays != null && durationDays > 0) ? durationDays : 7;
        if (days > 365) {
            throw ApiException.badRequest("E'lon davomiyligi 365 kundan oshmasligi kerak");
        }

        Region region = null;
        if (regionId != null) {
            region = regionRepository.findById(regionId)
                    .orElseThrow(() -> ApiException.badRequest("Viloyat topilmadi"));
        }

        String imageUrl = null;
        if (image != null && !image.isEmpty()) {
            imageUrl = fileStorageService.storePromoBannerImage(image);
        }

        PromoRequest req = new PromoRequest();
        req.setUser(user);
        req.setTitle(title.trim());
        req.setSubtitle(subtitle != null ? subtitle.trim() : null);
        req.setLinkUrl(linkUrl != null ? linkUrl.trim() : null);
        req.setAudience(audience != null ? audience : BannerAudience.ALL);
        req.setRegion(region);
        req.setDurationDays(days);
        req.setImageUrl(imageUrl);
        req.setStatus(PromoRequestStatus.PENDING);
        req.setPrice(BigDecimal.ZERO); // Hozircha bepul (kelajakda pullik qilishga tayyor)
        req.setPaid(true);

        return PromoRequestResponse.from(promoRequestRepository.save(req));
    }

    @Transactional
    public PromoRequestResponse approve(Long id) {
        PromoRequest req = promoRequestRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Ariza topilmadi"));

        if (req.getStatus() != PromoRequestStatus.PENDING) {
            throw ApiException.badRequest("Faqat kutilayotgan arizalarni tasdiqlash mumkin");
        }

        Instant now = Instant.now();
        Instant endAt = now.plus(req.getDurationDays(), ChronoUnit.DAYS);

        // Bosh sahifadagi karusel uchun avtomatik banner yaratish
        PromoBanner banner = new PromoBanner();
        banner.setTitle(req.getTitle());
        banner.setSubtitle(req.getSubtitle());
        banner.setImageUrl(req.getImageUrl());
        banner.setLinkUrl(req.getLinkUrl());
        banner.setAudience(req.getAudience());
        if (req.getRegion() != null) {
            banner.setRegions(new HashSet<>(Set.of(req.getRegion())));
        }
        banner.setActive(true);
        banner.setStartAt(now);
        banner.setEndAt(endAt);
        banner.setSortOrder(0);

        PromoBanner savedBanner = promoBannerRepository.save(banner);

        req.setStatus(PromoRequestStatus.APPROVED);
        req.setPromoBanner(savedBanner);
        req.setReviewedAt(now);

        return PromoRequestResponse.from(promoRequestRepository.save(req));
    }

    @Transactional
    public PromoRequestResponse reject(Long id, String reason) {
        PromoRequest req = promoRequestRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Ariza topilmadi"));

        if (req.getStatus() != PromoRequestStatus.PENDING) {
            throw ApiException.badRequest("Faqat kutilayotgan arizalarni rad etish mumkin");
        }

        req.setStatus(PromoRequestStatus.REJECTED);
        req.setRejectionReason(reason);
        req.setReviewedAt(Instant.now());

        return PromoRequestResponse.from(promoRequestRepository.save(req));
    }

    @Transactional
    public void cancel(Long id, Long userId) {
        PromoRequest req = promoRequestRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Ariza topilmadi"));

        if (!req.getUser().getId().equals(userId)) {
            throw ApiException.forbidden("Bu arizani bekor qilishga ruxsat yo'q");
        }
        if (req.getStatus() != PromoRequestStatus.PENDING) {
            throw ApiException.badRequest("Faqat kutilayotgan arizani bekor qilish mumkin");
        }

        req.setStatus(PromoRequestStatus.CANCELLED);
        promoRequestRepository.save(req);
    }
}
