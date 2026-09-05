package uz.ishchi.app.common;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import uz.ishchi.app.common.exception.ApiException;
import uz.ishchi.app.config.UploadProperties;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.Set;
import java.util.UUID;

@Service
public class FileStorageService {

    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of("image/jpeg", "image/png", "image/webp");

    private final Path uploadRoot;

    public FileStorageService(UploadProperties uploadProperties) {
        this.uploadRoot = Path.of(uploadProperties.dir());
    }

    public String storeAvatar(MultipartFile file) {
        return storeImage(file, "avatars");
    }

    public String storeJobImage(MultipartFile file) {
        return storeImage(file, "job-images");
    }

    public String storePromoBannerImage(MultipartFile file) {
        return storeImage(file, "promo-banners");
    }

    /** For photos downloaded from the Telegram bot API, which always serves them as JPEG. */
    public String storeJobImageFromBytes(byte[] bytes) {
        if (bytes == null || bytes.length == 0) {
            throw ApiException.badRequest("Fayl bo'sh bo'lishi mumkin emas");
        }
        return writeToDisk(new ByteArrayInputStream(bytes), "image/jpeg", "job-images");
    }

    private String storeImage(MultipartFile file, String subfolder) {
        if (file == null || file.isEmpty()) {
            throw ApiException.badRequest("Fayl bo'sh bo'lishi mumkin emas");
        }
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType)) {
            throw ApiException.badRequest("Faqat JPEG, PNG yoki WEBP formatdagi rasm yuklash mumkin");
        }
        try (InputStream in = file.getInputStream()) {
            return writeToDisk(in, contentType, subfolder);
        } catch (IOException e) {
            throw new IllegalStateException("Faylni saqlab bo'lmadi", e);
        }
    }

    private String writeToDisk(InputStream in, String contentType, String subfolder) {
        String extension = switch (contentType) {
            case "image/png" -> ".png";
            case "image/webp" -> ".webp";
            default -> ".jpg";
        };
        String filename = UUID.randomUUID() + extension;

        Path dir = uploadRoot.resolve(subfolder);
        Path target = dir.resolve(filename);

        try {
            Files.createDirectories(dir);
            Files.copy(in, target, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            throw new IllegalStateException("Faylni saqlab bo'lmadi", e);
        }

        return "/uploads/" + subfolder + "/" + filename;
    }
}
