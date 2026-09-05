package uz.ishchi.app.landing;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import uz.ishchi.app.common.LandingItemType;
import uz.ishchi.app.common.exception.ApiException;
import uz.ishchi.app.landing.dto.LandingContentUpdateRequest;
import uz.ishchi.app.landing.dto.LandingItemRequest;
import uz.ishchi.app.landing.dto.LandingItemUpdateRequest;
import uz.ishchi.app.landing.dto.LandingResponse;

import java.util.List;

@Service
@RequiredArgsConstructor
public class LandingService {

    private final LandingContentRepository landingContentRepository;
    private final LandingItemRepository landingItemRepository;

    @Transactional(readOnly = true)
    public LandingResponse get() {
        LandingContent content = loadContent();
        return LandingResponse.from(content,
                landingItemRepository.findByTypeOrderBySortOrderAscIdAsc(LandingItemType.FEATURE),
                landingItemRepository.findByTypeOrderBySortOrderAscIdAsc(LandingItemType.ROADMAP));
    }

    @Transactional
    public LandingResponse updateContent(LandingContentUpdateRequest request) {
        LandingContent c = loadContent();
        if (request.heroTitle() != null) c.setHeroTitle(request.heroTitle());
        if (request.heroSubtitle() != null) c.setHeroSubtitle(request.heroSubtitle());
        if (request.stat1Value() != null) c.setStat1Value(request.stat1Value());
        if (request.stat1Label() != null) c.setStat1Label(request.stat1Label());
        if (request.stat2Value() != null) c.setStat2Value(request.stat2Value());
        if (request.stat2Label() != null) c.setStat2Label(request.stat2Label());
        if (request.stat3Value() != null) c.setStat3Value(request.stat3Value());
        if (request.stat3Label() != null) c.setStat3Label(request.stat3Label());
        if (request.stat4Value() != null) c.setStat4Value(request.stat4Value());
        if (request.stat4Label() != null) c.setStat4Label(request.stat4Label());
        return get();
    }

    @Transactional
    public void createItem(LandingItemRequest request) {
        LandingItem item = new LandingItem();
        item.setType(request.type());
        item.setTitle(request.title());
        item.setDescription(request.description());
        item.setSortOrder(request.sortOrder() != null ? request.sortOrder() : nextSortOrder(request.type()));
        landingItemRepository.save(item);
    }

    @Transactional
    public void updateItem(Long id, LandingItemUpdateRequest request) {
        LandingItem item = landingItemRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Element topilmadi"));
        if (request.title() != null) item.setTitle(request.title());
        if (request.description() != null) item.setDescription(request.description());
        if (request.sortOrder() != null) item.setSortOrder(request.sortOrder());
    }

    @Transactional
    public void reorderItems(List<Long> orderedIds) {
        List<LandingItem> items = landingItemRepository.findAllById(orderedIds);
        for (int i = 0; i < orderedIds.size(); i++) {
            Long id = orderedIds.get(i);
            int sortOrder = i;
            items.stream().filter(it -> it.getId().equals(id)).findFirst()
                    .ifPresent(it -> it.setSortOrder(sortOrder));
        }
    }

    @Transactional
    public void deleteItem(Long id) {
        if (!landingItemRepository.existsById(id)) {
            throw ApiException.notFound("Element topilmadi");
        }
        landingItemRepository.deleteById(id);
    }

    private int nextSortOrder(LandingItemType type) {
        return landingItemRepository.findByTypeOrderBySortOrderAscIdAsc(type).size() + 1;
    }

    private LandingContent loadContent() {
        return landingContentRepository.findById(1L).orElseThrow(
                () -> new IllegalStateException("landing_content seed row missing"));
    }
}
