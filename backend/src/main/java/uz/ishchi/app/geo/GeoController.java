package uz.ishchi.app.geo;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** Address search and "what is at this point" for the app's location picker. Signed-in users only. */
@RestController
@RequestMapping("/api/geo")
@RequiredArgsConstructor
@Validated
public class GeoController {

    private static final String COORDINATE = "Koordinata noto'g'ri";

    private final GeoService geoService;

    @GetMapping("/search")
    public List<GeoPlace> search(
            @RequestParam @NotBlank
            @Size(min = 2, max = 200, message = "Qidiruv uchun 2 tadan 200 tagacha belgi kiriting") String q) {
        return geoService.search(q);
    }

    /** 204 when nothing is known about the point (open steppe, or the geocoder is unavailable). */
    @GetMapping("/reverse")
    public ResponseEntity<GeoPlace> reverse(
            @RequestParam @DecimalMin(value = "-90", message = COORDINATE) @DecimalMax(value = "90", message = COORDINATE) double lat,
            @RequestParam @DecimalMin(value = "-180", message = COORDINATE) @DecimalMax(value = "180", message = COORDINATE) double lon) {
        return geoService.reverse(lat, lon)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.noContent().build());
    }
}
