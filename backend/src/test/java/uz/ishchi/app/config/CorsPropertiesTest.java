package uz.ishchi.app.config;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class CorsPropertiesTest {

    @Test
    void splitsAndTrimsAList() {
        assertThat(new CorsProperties("https://a.uz, https://b.uz").originPatterns())
                .containsExactly("https://a.uz", "https://b.uz");
    }

    @Test
    void treatsUnsetBlankAndWildcardAsAnyOrigin() {
        assertThat(new CorsProperties(null).originPatterns()).containsExactly("*");
        assertThat(new CorsProperties("   ").originPatterns()).containsExactly("*");
        assertThat(new CorsProperties("*").originPatterns()).containsExactly("*");
        assertThat(new CorsProperties(" , ").originPatterns()).containsExactly("*");
    }
}
