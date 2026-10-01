package uz.ishchi.app.geo;

import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;

/**
 * Caches geocoding answers for a day. Addresses barely change, and the same few places (a city
 * centre, a bazaar, the spot a job was pinned) are looked up again and again.
 */
@Service
public class GeoService {

    private static final long TTL_MS = 24L * 60 * 60 * 1000;
    private static final int MAX_ENTRIES = 5000;

    private final NominatimClient client;
    private final Map<String, Cached> cache = new LinkedHashMap<>(256, 0.75f, true) {
        @Override
        protected boolean removeEldestEntry(Map.Entry<String, Cached> eldest) {
            return size() > MAX_ENTRIES;
        }
    };

    private record Cached(Object value, long at) {
    }

    public GeoService(NominatimClient client) {
        this.client = client;
    }

    @SuppressWarnings("unchecked")
    public List<GeoPlace> search(String query) {
        String normalized = query.trim().replaceAll("\\s+", " ");
        String key = "s:" + normalized.toLowerCase(Locale.ROOT);
        Object cached = get(key);
        if (cached != null) return (List<GeoPlace>) cached;
        try {
            List<GeoPlace> places = List.copyOf(client.search(normalized));
            put(key, places);
            return places;
        } catch (NominatimClient.Unavailable e) {
            return List.of();
        }
    }

    /** Points within about ten metres share one answer, which is as precise as an address gets. */
    public Optional<GeoPlace> reverse(double latitude, double longitude) {
        String key = String.format(Locale.ROOT, "r:%.4f,%.4f", latitude, longitude);
        Object cached = get(key);
        if (cached != null) return ((Optional<?>) cached).map(GeoPlace.class::cast);
        try {
            Optional<GeoPlace> place = client.reverse(latitude, longitude);
            put(key, place);
            return place;
        } catch (NominatimClient.Unavailable e) {
            return Optional.empty();
        }
    }

    private synchronized Object get(String key) {
        Cached e = cache.get(key);
        if (e == null) return null;
        if (System.currentTimeMillis() - e.at() > TTL_MS) {
            cache.remove(key);
            return null;
        }
        return e.value();
    }

    private synchronized void put(String key, Object value) {
        cache.put(key, new Cached(value, System.currentTimeMillis()));
    }
}
