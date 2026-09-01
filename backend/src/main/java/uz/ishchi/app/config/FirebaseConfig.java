package uz.ishchi.app.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.stereotype.Component;

import java.io.FileInputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

/**
 * Initializes Firebase only when a service-account credentials file is actually configured.
 * Push notifications are optional — the app must keep working (and every notification call
 * must become a harmless no-op) when {@code FIREBASE_CREDENTIALS_PATH} isn't set yet.
 */
@Component
@EnableConfigurationProperties(FirebaseProperties.class)
public class FirebaseConfig {

    private static final Logger log = LoggerFactory.getLogger(FirebaseConfig.class);

    private final FirebaseProperties properties;
    private boolean ready = false;

    public FirebaseConfig(FirebaseProperties properties) {
        this.properties = properties;
    }

    @PostConstruct
    public void init() {
        String path = properties.credentialsPath();
        if (path == null || path.isBlank()) {
            log.warn("FIREBASE_CREDENTIALS_PATH sozlanmagan — push-bildirishnomalar o'chirilgan holatda ishlaydi");
            return;
        }
        if (!Files.exists(Path.of(path))) {
            log.warn("Firebase xizmat hisobi fayli topilmadi: {} — push-bildirishnomalar o'chirilgan", path);
            return;
        }
        try (FileInputStream serviceAccount = new FileInputStream(path)) {
            FirebaseOptions options = FirebaseOptions.builder()
                    .setCredentials(GoogleCredentials.fromStream(serviceAccount))
                    .build();
            if (FirebaseApp.getApps().isEmpty()) {
                FirebaseApp.initializeApp(options);
            }
            ready = true;
            log.info("Firebase muvaffaqiyatli ishga tushirildi — push-bildirishnomalar faol");
        } catch (IOException e) {
            log.error("Firebase'ni ishga tushirib bo'lmadi", e);
        }
    }

    public boolean isReady() {
        return ready;
    }
}
