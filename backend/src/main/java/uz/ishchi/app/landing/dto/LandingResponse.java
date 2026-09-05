package uz.ishchi.app.landing.dto;

import uz.ishchi.app.landing.LandingContent;
import uz.ishchi.app.landing.LandingItem;

import java.util.List;

public record LandingResponse(
        String heroTitle,
        String heroSubtitle,
        List<StatDto> stats,
        List<ItemDto> features,
        List<ItemDto> roadmap
) {
    public record StatDto(String value, String label) {
    }

    public record ItemDto(Long id, String title, String description) {
        public static ItemDto from(LandingItem item) {
            return new ItemDto(item.getId(), item.getTitle(), item.getDescription());
        }
    }

    public static LandingResponse from(LandingContent c, List<LandingItem> features, List<LandingItem> roadmap) {
        return new LandingResponse(
                c.getHeroTitle(),
                c.getHeroSubtitle(),
                List.of(
                        new StatDto(c.getStat1Value(), c.getStat1Label()),
                        new StatDto(c.getStat2Value(), c.getStat2Label()),
                        new StatDto(c.getStat3Value(), c.getStat3Label()),
                        new StatDto(c.getStat4Value(), c.getStat4Label())
                ),
                features.stream().map(ItemDto::from).toList(),
                roadmap.stream().map(ItemDto::from).toList()
        );
    }
}
