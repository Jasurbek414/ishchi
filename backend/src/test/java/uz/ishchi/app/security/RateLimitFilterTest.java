package uz.ishchi.app.security;

import org.springframework.http.converter.json.Jackson2ObjectMapperBuilder;
import jakarta.servlet.FilterChain;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

/**
 * Nothing capped credential or OTP checks before this, so a password and a 4-digit code were both
 * open to unlimited guessing.
 */
class RateLimitFilterTest {

    private RateLimitFilter filter;
    private FilterChain chain;

    @BeforeEach
    void setUp() {
        // Boot's auto-configured mapper, so Instant serialises the same way it does at runtime.
        filter = new RateLimitFilter(Jackson2ObjectMapperBuilder.json().build());
        chain = mock(FilterChain.class);
    }

    private MockHttpServletResponse call(String method, String uri, String ip) throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest(method, uri);
        request.setRequestURI(uri);
        request.addHeader("X-Forwarded-For", ip);
        MockHttpServletResponse response = new MockHttpServletResponse();
        filter.doFilter(request, response, chain);
        return response;
    }

    @Test
    void blocksAfterTheCapAndSaysWhenToRetry() throws Exception {
        for (int i = 0; i < 10; i++) {
            assertThat(call("POST", "/api/auth/login", "1.1.1.1").getStatus()).isEqualTo(200);
        }

        MockHttpServletResponse blocked = call("POST", "/api/auth/login", "1.1.1.1");

        assertThat(blocked.getStatus()).isEqualTo(429);
        assertThat(blocked.getHeader("Retry-After")).isNotNull();
        assertThat(blocked.getContentAsString()).contains("RATE_LIMITED");
        verify(chain, never()).doFilter(any(), same(blocked));
    }

    @Test
    void countsPerClientAddress() throws Exception {
        for (int i = 0; i < 10; i++) {
            call("POST", "/api/auth/login", "1.1.1.1");
        }

        // A different client still has its full allowance.
        assertThat(call("POST", "/api/auth/login", "2.2.2.2").getStatus()).isEqualTo(200);
    }

    @Test
    void appliesASeparateAllowanceToOtpDispatch() throws Exception {
        for (int i = 0; i < 5; i++) {
            assertThat(call("POST", "/api/auth/forgot-password", "3.3.3.3").getStatus()).isEqualTo(200);
        }

        assertThat(call("POST", "/api/auth/forgot-password", "3.3.3.3").getStatus()).isEqualTo(429);
        // Login has its own window, so exhausting one does not exhaust the other.
        assertThat(call("POST", "/api/auth/login", "3.3.3.3").getStatus()).isEqualTo(200);
    }

    @Test
    void leavesUncappedEndpointsAlone() throws Exception {
        for (int i = 0; i < 50; i++) {
            assertThat(call("GET", "/api/jobs", "4.4.4.4").getStatus()).isEqualTo(200);
        }
    }

    @Test
    void capsBannerCountersButNotBannerReads() throws Exception {
        for (int i = 0; i < 200; i++) {
            call("GET", "/api/promo-banners", "5.5.5.5");
        }

        // Reading stays free however often it happens; only the stuffable counters are capped.
        assertThat(call("GET", "/api/promo-banners", "5.5.5.5").getStatus()).isEqualTo(200);

        for (int i = 0; i < 120; i++) {
            call("POST", "/api/promo-banners/1/view", "5.5.5.5");
        }
        assertThat(call("POST", "/api/promo-banners/1/view", "5.5.5.5").getStatus()).isEqualTo(429);
    }

    @Test
    void fallsBackToTheSocketAddressWithoutAForwardedHeader() throws Exception {
        for (int i = 0; i < 11; i++) {
            MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/auth/login");
            request.setRequestURI("/api/auth/login");
            request.setRemoteAddr("9.9.9.9");
            MockHttpServletResponse response = new MockHttpServletResponse();
            filter.doFilter(request, response, chain);
            if (i == 10) {
                assertThat(response.getStatus()).isEqualTo(429);
            }
        }
    }

    private static MockHttpServletResponse same(MockHttpServletResponse response) {
        return org.mockito.ArgumentMatchers.eq(response);
    }
}
