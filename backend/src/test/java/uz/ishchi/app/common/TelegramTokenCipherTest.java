package uz.ishchi.app.common;

import org.junit.jupiter.api.Test;
import uz.ishchi.app.security.JwtProperties;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class TelegramTokenCipherTest {

    private static final String SECRET = "test-secret-at-least-32-characters-long";

    private TelegramTokenCipher cipher(String secret) {
        return new TelegramTokenCipher(new JwtProperties(secret, 30, 30));
    }

    @Test
    void roundTripsAToken() {
        TelegramTokenCipher cipher = cipher(SECRET);
        String token = "123456789:AAEhBOweik6ad9r_Qm8aH0mnZ3YFcOaVzPo";

        String stored = cipher.encrypt(token);

        assertThat(stored).startsWith("enc:v1:").doesNotContain(token);
        assertThat(cipher.decrypt(stored)).isEqualTo(token);
    }

    @Test
    void usesAFreshNonceEachTime() {
        TelegramTokenCipher cipher = cipher(SECRET);

        assertThat(cipher.encrypt("same-token")).isNotEqualTo(cipher.encrypt("same-token"));
    }

    @Test
    void passesThroughValuesStoredBeforeEncryption() {
        // Rows written before the column was encrypted have no envelope prefix and must keep working.
        assertThat(cipher(SECRET).decrypt("123456789:plain-legacy-token"))
                .isEqualTo("123456789:plain-legacy-token");
    }

    @Test
    void leavesEmptyValuesAlone() {
        TelegramTokenCipher cipher = cipher(SECRET);

        assertThat(cipher.encrypt(null)).isNull();
        assertThat(cipher.encrypt("")).isEmpty();
        assertThat(cipher.decrypt(null)).isNull();
    }

    @Test
    void failsLoudlyWhenTheKeyChanged() {
        String stored = cipher(SECRET).encrypt("123456789:token");

        assertThatThrownBy(() -> cipher("a-completely-different-secret-value-32").decrypt(stored))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("JWT_SECRET");
    }
}
