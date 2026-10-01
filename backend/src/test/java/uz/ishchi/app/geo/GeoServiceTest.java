package uz.ishchi.app.geo;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class GeoServiceTest {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    /** Answers from canned JSON instead of the network, and counts how often it was asked. */
    static class FakeClient extends NominatimClient {
        final List<String> urls = new ArrayList<>();
        String body;

        FakeClient(String body) {
            super("https://example.test/", "test");
            this.body = body;
        }

        @Override
        protected JsonNode fetch(String url) {
            urls.add(url);
            try {
                return body == null ? null : MAPPER.readTree(body);
            } catch (Exception e) {
                throw new IllegalStateException(e);
            }
        }
    }

    private static final String CHILONZOR = """
            {"lat":"41.2756","lon":"69.2034","name":"",
             "display_name":"12, Bunyodkor shoh ko'chasi, Chilonzor tumani, Toshkent",
             "address":{"road":"Bunyodkor shoh ko'chasi","house_number":"12",
                        "city_district":"Chilonzor tumani","city":"Toshkent"}}""";

    @Test
    void reverseBuildsStreetAndAreaLines() {
        GeoService service = new GeoService(new FakeClient(CHILONZOR));

        GeoPlace place = service.reverse(41.2756, 69.2034).orElseThrow();

        assertThat(place.name()).isEqualTo("Bunyodkor shoh ko'chasi, 12");
        assertThat(place.address()).isEqualTo("Chilonzor tumani, Toshkent");
        assertThat(place.latitude()).isEqualTo(41.2756);
    }

    @Test
    void nearbyPointsShareOneUpstreamRequest() {
        FakeClient client = new FakeClient(CHILONZOR);
        GeoService service = new GeoService(client);

        service.reverse(41.27561, 69.20341);
        service.reverse(41.27564, 69.20338);

        assertThat(client.urls).hasSize(1);
        assertThat(client.urls.get(0)).startsWith("https://example.test/reverse?");
    }

    @Test
    void searchIsLimitedToUzbekistanAndCachedCaseInsensitively() {
        FakeClient client = new FakeClient("[" + CHILONZOR + "]");
        GeoService service = new GeoService(client);

        assertThat(service.search("Chilonzor  bozori")).hasSize(1);
        assertThat(service.search("chilonzor bozori")).hasSize(1);

        assertThat(client.urls).hasSize(1);
        assertThat(client.urls.get(0)).contains("countrycodes=uz").contains("q=Chilonzor+bozori");
    }

    @Test
    void anUnreachableGeocoderIsNotCached() {
        FakeClient client = new FakeClient(null);
        GeoService service = new GeoService(client);

        assertThat(service.search("Chorsu")).isEmpty();
        client.body = "[" + CHILONZOR + "]";
        assertThat(service.search("Chorsu")).hasSize(1);
    }

    @Test
    void aPointWithNoAddressFallsBackToTheDisplayName() {
        GeoService service = new GeoService(new FakeClient("""
                {"lat":"40.1","lon":"65.3","display_name":"Navoiy viloyati, O'zbekiston","address":{}}"""));

        assertThat(service.reverse(40.1, 65.3).orElseThrow().name()).isEqualTo("Navoiy viloyati, O'zbekiston");
    }
}
