package uz.ishchi.app.common;

import org.springframework.stereotype.Component;
import uz.ishchi.app.security.JwtProperties;

import javax.crypto.Cipher;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Arrays;
import java.util.Base64;

/**
 * Encrypts the Telegram bot token for storage. It used to be kept in plain text, so any
 * database dump or backup handed over full control of the bot.
 *
 * <p>The key is derived from the already-required {@code app.jwt.secret} rather than introducing a
 * second secret to deploy and rotate. Values carry a version prefix, and anything without it is
 * treated as a legacy plaintext value so an existing row keeps working and is re-encrypted the next
 * time it is saved.
 */
@Component
public class TelegramTokenCipher {

    private static final String PREFIX = "enc:v1:";
    private static final String TRANSFORMATION = "AES/GCM/NoPadding";
    private static final int IV_LENGTH = 12;
    private static final int TAG_BITS = 128;

    private static final SecureRandom RANDOM = new SecureRandom();

    private final SecretKey key;

    public TelegramTokenCipher(JwtProperties jwtProperties) {
        // SHA-256 of the configured secret gives a valid 256-bit AES key whatever its length.
        this.key = new SecretKeySpec(sha256(jwtProperties.secret()), "AES");
    }

    public String encrypt(String plaintext) {
        if (plaintext == null || plaintext.isBlank()) {
            return plaintext;
        }
        try {
            byte[] iv = new byte[IV_LENGTH];
            RANDOM.nextBytes(iv);
            Cipher cipher = Cipher.getInstance(TRANSFORMATION);
            cipher.init(Cipher.ENCRYPT_MODE, key, new GCMParameterSpec(TAG_BITS, iv));
            byte[] ciphertext = cipher.doFinal(plaintext.getBytes(StandardCharsets.UTF_8));

            byte[] envelope = new byte[iv.length + ciphertext.length];
            System.arraycopy(iv, 0, envelope, 0, iv.length);
            System.arraycopy(ciphertext, 0, envelope, iv.length, ciphertext.length);
            return PREFIX + Base64.getEncoder().encodeToString(envelope);
        } catch (Exception e) {
            throw new IllegalStateException("Maxfiy qiymatni shifrlab bo'lmadi", e);
        }
    }

    /** Returns the value unchanged when it predates encryption, so existing rows keep working. */
    public String decrypt(String stored) {
        if (stored == null || stored.isBlank() || !stored.startsWith(PREFIX)) {
            return stored;
        }
        try {
            byte[] envelope = Base64.getDecoder().decode(stored.substring(PREFIX.length()));
            byte[] iv = Arrays.copyOfRange(envelope, 0, IV_LENGTH);
            byte[] ciphertext = Arrays.copyOfRange(envelope, IV_LENGTH, envelope.length);
            Cipher cipher = Cipher.getInstance(TRANSFORMATION);
            cipher.init(Cipher.DECRYPT_MODE, key, new GCMParameterSpec(TAG_BITS, iv));
            return new String(cipher.doFinal(ciphertext), StandardCharsets.UTF_8);
        } catch (Exception e) {
            throw new IllegalStateException(
                    "Saqlangan maxfiy qiymatni ochib bo'lmadi — JWT_SECRET o'zgargan bo'lishi mumkin", e);
        }
    }

    private static byte[] sha256(String value) {
        try {
            return MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8));
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
    }
}
