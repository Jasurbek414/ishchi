package uz.ishchi.app.common;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
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

    private static final Logger log = LoggerFactory.getLogger(FileStorageService.class);

    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of("image/jpeg", "image/png", "image/webp");

    private static final String URL_PREFIX = "/uploads/";

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
        // Checked like any other upload rather than assumed to be JPEG: the bytes come off the
        // network, and a mis-typed file would end up served from /uploads all the same.
        String actualType = sniffImageType(bytes);
        if (actualType == null) {
            throw ApiException.badRequest("Yuborilgan fayl rasm emas");
        }
        return writeToDisk(new ByteArrayInputStream(bytes), actualType, "job-images");
    }

    private String storeImage(MultipartFile file, String subfolder) {
        if (file == null || file.isEmpty()) {
            throw ApiException.badRequest("Fayl bo'sh bo'lishi mumkin emas");
        }
        String declaredType = file.getContentType();
        if (declaredType == null || !ALLOWED_CONTENT_TYPES.contains(declaredType)) {
            throw ApiException.badRequest("Faqat JPEG, PNG yoki WEBP formatdagi rasm yuklash mumkin");
        }
        byte[] bytes;
        try {
            bytes = file.getBytes();
        } catch (IOException e) {
            throw new IllegalStateException("Faylni o'qib bo'lmadi", e);
        }
        // The declared Content-Type is just a header the uploader chose, so it proves nothing.
        // Trusting it alone allowed storing arbitrary bytes under an image name and serving them
        // back from /uploads on our own origin. The real type comes from the magic bytes.
        String actualType = sniffImageType(bytes);
        if (actualType == null) {
            throw ApiException.badRequest("Fayl haqiqiy rasm emas (JPEG, PNG yoki WEBP kutilgan)");
        }
        return writeToDisk(new ByteArrayInputStream(bytes), actualType, subfolder);
    }

    /** @return the canonical content type the bytes actually are, or {@code null} if unrecognised. */
    private String sniffImageType(byte[] b) {
        if (b.length >= 3 && (b[0] & 0xFF) == 0xFF && (b[1] & 0xFF) == 0xD8 && (b[2] & 0xFF) == 0xFF) {
            return "image/jpeg";
        }
        if (b.length >= 8 && (b[0] & 0xFF) == 0x89 && b[1] == 'P' && b[2] == 'N' && b[3] == 'G'
                && (b[4] & 0xFF) == 0x0D && (b[5] & 0xFF) == 0x0A && (b[6] & 0xFF) == 0x1A && (b[7] & 0xFF) == 0x0A) {
            return "image/png";
        }
        if (b.length >= 12 && b[0] == 'R' && b[1] == 'I' && b[2] == 'F' && b[3] == 'F'
                && b[8] == 'W' && b[9] == 'E' && b[10] == 'B' && b[11] == 'P') {
            return "image/webp";
        }
        return null;
    }

    /**
     * Deletes a file previously returned by one of the store methods. Replacing an avatar or
     * removing a job image used to leave the old file on disk forever, so the uploads volume only
     * ever grew. Silent when the file is already gone, and refuses anything that resolves outside
     * the upload root so a stored value can never reach other parts of the filesystem.
     */
    public void deleteByUrl(String url) {
        if (url == null || !url.startsWith(URL_PREFIX)) {
            return;
        }
        Path root = uploadRoot.toAbsolutePath().normalize();
        Path target = root.resolve(url.substring(URL_PREFIX.length())).normalize();
        if (!target.startsWith(root)) {
            log.warn("Upload katalogidan tashqaridagi faylni o'chirish rad etildi: {}", url);
            return;
        }
        try {
            Files.deleteIfExists(target);
        } catch (IOException e) {
            // Losing a stale file is not worth failing the user's request over.
            log.warn("Faylni o'chirib bo'lmadi: {}", url, e);
        }
    }

    /**
     * Queues a delete for after the current transaction commits, so a rollback can never leave a
     * row pointing at a file that has already been removed. Deletes immediately when called
     * outside a transaction.
     */
    public void deleteAfterCommit(String url) {
        if (url == null || url.isBlank()) {
            return;
        }
        if (!TransactionSynchronizationManager.isSynchronizationActive()) {
            deleteByUrl(url);
            return;
        }
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                deleteByUrl(url);
            }
        });
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

        return URL_PREFIX + subfolder + "/" + filename;
    }
}
