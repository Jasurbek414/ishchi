package uz.ishchi.app.common;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.web.multipart.MultipartFile;
import uz.ishchi.app.common.exception.ApiException;
import uz.ishchi.app.config.UploadProperties;

import javax.imageio.ImageIO;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
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

    /** Below this there is nothing worth gaining, so the bytes are stored as they arrived. */
    private static final int COMPRESS_THRESHOLD_BYTES = 500 * 1024;

    /** Enough to fill any phone screen, including at 3x density. */
    private static final int MAX_DIMENSION_PX = 1600;

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
        byte[] stored = "image/jpeg".equals(actualType) ? downscaleIfLarge(bytes, actualType) : bytes;
        return writeToDisk(new ByteArrayInputStream(stored), actualType, "job-images");
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
        // Only photographs are re-encoded. A PNG or WEBP may be carrying transparency that turning it
        // into a JPEG would flatten, and those are rarely the multi-megabyte case anyway.
        byte[] stored = "image/jpeg".equals(actualType) ? downscaleIfLarge(bytes, actualType) : bytes;
        return writeToDisk(new ByteArrayInputStream(stored), actualType, subfolder);
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

    /**
     * Shrinks an oversized photo before it is stored.
     *
     * <p>Uploads were kept exactly as the phone produced them — up to 5 MB each, several per job —
     * and then served to people on mobile data over and over. A job photo never needs more than
     * enough pixels to fill a phone screen, so anything larger is re-encoded. Returns the original
     * bytes unchanged when they are already small enough, or when the image cannot be decoded (in
     * which case the magic-byte check has already vouched for it being a real image).
     */
    private byte[] downscaleIfLarge(byte[] original, String contentType) {
        if (original.length <= COMPRESS_THRESHOLD_BYTES) {
            return original;
        }
        try {
            BufferedImage source = ImageIO.read(new ByteArrayInputStream(original));
            if (source == null) {
                return original;
            }
            int longestSide = Math.max(source.getWidth(), source.getHeight());
            if (longestSide <= MAX_DIMENSION_PX) {
                return original;
            }
            double scale = (double) MAX_DIMENSION_PX / longestSide;
            int width = Math.max(1, (int) Math.round(source.getWidth() * scale));
            int height = Math.max(1, (int) Math.round(source.getHeight() * scale));

            // TYPE_INT_RGB drops any alpha channel, which JPEG cannot carry anyway; PNG and WEBP
            // inputs are re-encoded as JPEG by the caller's extension mapping only when they were
            // already JPEG, so transparency is preserved by leaving those alone below.
            BufferedImage scaled = new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB);
            Graphics2D graphics = scaled.createGraphics();
            graphics.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR);
            graphics.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);
            graphics.drawImage(source, 0, 0, width, height, null);
            graphics.dispose();

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            if (!ImageIO.write(scaled, "jpg", out) || out.size() == 0) {
                return original;
            }
            log.debug("Rasm kichraytirildi: {} -> {} bayt", original.length, out.size());
            return out.toByteArray();
        } catch (IOException | RuntimeException e) {
            // Never fail an upload over an optimisation.
            log.warn("Rasmni kichraytirib bo'lmadi, asl holida saqlanadi", e);
            return original;
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

        return URL_PREFIX + subfolder + "/" + filename;
    }
}
