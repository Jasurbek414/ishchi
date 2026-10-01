package uz.ishchi.app.geo;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.Set;

/**
 * Address search and reverse lookup against a Nominatim server (OpenStreetMap's geocoder).
 *
 * <p>The app asks the backend rather than Nominatim directly so the provider's usage policy is
 * kept in one place: one identifying User-Agent, results cached by {@link GeoService}, and no more
 * than one upstream request a second however many phones are asking.
 */
@Component
public class NominatimClient {

    private static final Logger log = LoggerFactory.getLogger(NominatimClient.class);
    private static final long MIN_INTERVAL_MS = 1100;

    private final HttpClient http = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).build();
    private final ObjectMapper mapper = new ObjectMapper();
    private final String baseUrl;
    private final String userAgent;
    private long lastRequestAt;

    public NominatimClient(@Value("${app.geocoding.base-url:https://nominatim.openstreetmap.org}") String baseUrl,
                           @Value("${app.geocoding.user-agent:Ishchi/1.0 (+https://uzbishchi.uz)}") String userAgent) {
        this.baseUrl = baseUrl.replaceAll("/+$", "");
        this.userAgent = userAgent;
    }

    /** The upstream could not be asked; unlike an empty answer, this must not be cached. */
    public static class Unavailable extends RuntimeException {
        Unavailable() {
            super(null, null, false, false);
        }
    }

    public List<GeoPlace> search(String query) {
        String url = baseUrl + "/search?format=jsonv2&addressdetails=1&limit=6&countrycodes=uz"
                + "&accept-language=uz,ru&q=" + URLEncoder.encode(query, StandardCharsets.UTF_8);
        JsonNode body = fetch(url);
        if (body == null) throw new Unavailable();
        List<GeoPlace> places = new ArrayList<>();
        if (body.isArray()) {
            body.forEach(node -> toPlace(node).ifPresent(places::add));
        }
        return places;
    }

    public Optional<GeoPlace> reverse(double latitude, double longitude) {
        String url = baseUrl + "/reverse?format=jsonv2&addressdetails=1&zoom=18&accept-language=uz,ru"
                + "&lat=" + String.format(Locale.ROOT, "%.6f", latitude)
                + "&lon=" + String.format(Locale.ROOT, "%.6f", longitude);
        JsonNode body = fetch(url);
        if (body == null) throw new Unavailable();
        if (body.has("error")) return Optional.empty();
        return toPlace(body);
    }

    /** Builds the two display lines from Nominatim's address breakdown. */
    static Optional<GeoPlace> toPlace(JsonNode node) {
        if (!node.hasNonNull("lat") || !node.hasNonNull("lon")) return Optional.empty();
        double lat;
        double lon;
        try {
            lat = Double.parseDouble(node.get("lat").asText());
            lon = Double.parseDouble(node.get("lon").asText());
        } catch (NumberFormatException e) {
            return Optional.empty();
        }
        JsonNode a = node.path("address");

        String street = join(", ", text(a, "road"), text(a, "house_number"));
        String name = firstNonBlank(text(node, "name"), street, text(a, "neighbourhood"), text(a, "suburb"));

        Set<String> area = new LinkedHashSet<>();
        add(area, firstNonBlank(text(a, "suburb"), text(a, "neighbourhood"), text(a, "city_district")));
        add(area, firstNonBlank(text(a, "city"), text(a, "town"), text(a, "village"), text(a, "county")));
        add(area, text(a, "state"));
        if (name != null) area.remove(name);
        String address = area.isEmpty() ? null : String.join(", ", area);

        if (name == null && address == null) {
            String display = text(node, "display_name");
            if (display == null) return Optional.empty();
            return Optional.of(new GeoPlace(display, null, lat, lon));
        }
        if (name == null) return Optional.of(new GeoPlace(address, null, lat, lon));
        return Optional.of(new GeoPlace(name, address, lat, lon));
    }

    /** Null when the upstream is unreachable or answers with an error: the caller shows nothing. */
    protected JsonNode fetch(String url) {
        try {
            throttle();
            HttpRequest request = HttpRequest.newBuilder(URI.create(url))
                    .timeout(Duration.ofSeconds(8))
                    .header("User-Agent", userAgent)
                    .header("Accept", "application/json")
                    .GET()
                    .build();
            HttpResponse<String> response = http.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() != 200) {
                log.warn("Geokodlash xizmati {} qaytardi", response.statusCode());
                return null;
            }
            return mapper.readTree(response.body());
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            return null;
        } catch (IOException e) {
            log.warn("Geokodlash xizmatiga ulanib bo'lmadi: {}", e.getMessage());
            return null;
        }
    }

    private synchronized void throttle() throws InterruptedException {
        long wait = lastRequestAt + MIN_INTERVAL_MS - System.currentTimeMillis();
        if (wait > 0) Thread.sleep(wait);
        lastRequestAt = System.currentTimeMillis();
    }

    private static String text(JsonNode node, String field) {
        JsonNode v = node.get(field);
        if (v == null || v.isNull()) return null;
        String s = v.asText().trim();
        return s.isEmpty() ? null : s;
    }

    private static String firstNonBlank(String... values) {
        for (String v : values) if (v != null) return v;
        return null;
    }

    private static String join(String sep, String... parts) {
        List<String> present = new ArrayList<>();
        for (String p : parts) if (p != null) present.add(p);
        return present.isEmpty() ? null : String.join(sep, present);
    }

    private static void add(Set<String> set, String value) {
        if (value != null) set.add(value);
    }
}
