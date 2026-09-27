package uz.ishchi.app.config;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class OtpPropertiesTest {

    @Test
    void usesTheConfiguredTtl() {
        assertThat(new OtpProperties(3).ttlMinutesOrDefault()).isEqualTo(3);
    }

    @Test
    void fallsBackWhenUnsetOrNonsensical() {
        assertThat(new OtpProperties(null).ttlMinutesOrDefault()).isEqualTo(10);
        assertThat(new OtpProperties(0).ttlMinutesOrDefault()).isEqualTo(10);
        assertThat(new OtpProperties(-5).ttlMinutesOrDefault()).isEqualTo(10);
    }
}
