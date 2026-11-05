package uz.ishchi.app.common;

import lombok.extern.slf4j.Slf4j;
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

@Slf4j
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

    /**
     * Best-effort removal of a file previously returned by one of the {@code store*} methods.
     * Only touches avatars and job images, and refuses anything that resolves outside those
     * folders, so a bad or tampered URL can never remove an arbitrary file. Never throws:
     * a missing file or an I/O error is logged and ignored.
     */
    public void removeQuietly(String url) {
        if (url == null || !url.startsWith("/uploads/")) {
            return;
        }
        try {
            Path root = uploadRoot.toAbsolutePath().normalize();
            Path target = root.resolve(url.substring("/uploads/".length())).normalize();
            boolean allowed = target.startsWith(root.resolve("avatars"))
                    || target.startsWith(root.resolve("job-images"));
            if (!allowed || Files.isDirectory(target)) {
                log.warn("Refusing to remove file outside avatars/job-images: {}", url);
                return;
            }
            Files.deleteIfExists(target);
        } catch (IOException | RuntimeException e) {
            log.warn("Could not remove uploaded file {}: {}", url, e.toString());
        }
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
