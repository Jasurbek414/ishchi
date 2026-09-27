package uz.ishchi.app.common;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.mock.web.MockMultipartFile;
import uz.ishchi.app.common.exception.ApiException;
import uz.ishchi.app.config.UploadProperties;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * The declared Content-Type is a header the uploader picks, so it proves nothing. Trusting it
 * allowed storing arbitrary bytes under an image name and serving them back from /uploads on our
 * own origin.
 */
class FileStorageServiceTest {

    private static final byte[] PNG_HEADER = {(byte) 0x89, 'P', 'N', 'G', 0x0D, 0x0A, 0x1A, 0x0A, 0, 0, 0, 0};
    private static final byte[] JPEG_HEADER = {(byte) 0xFF, (byte) 0xD8, (byte) 0xFF, (byte) 0xE0, 0, 0};

    private FileStorageService service(Path dir) {
        return new FileStorageService(new UploadProperties(dir.toString()));
    }

    @Test
    void rejectsNonImageBytesDeclaredAsAnImage(@TempDir Path dir) {
        MockMultipartFile disguised = new MockMultipartFile(
                "file", "payload.png", "image/png", "<script>alert(1)</script>".getBytes(StandardCharsets.UTF_8));

        assertThatThrownBy(() -> service(dir).storeAvatar(disguised))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("haqiqiy rasm emas");
    }

    @Test
    void storesRealImagesAndNamesThemByTheirActualType(@TempDir Path dir) {
        FileStorageService service = service(dir);

        String pngUrl = service.storeAvatar(new MockMultipartFile("file", "a.png", "image/png", PNG_HEADER));
        // A JPEG mislabelled as PNG is stored as what it really is, not as what the header claimed.
        String jpegUrl = service.storeAvatar(new MockMultipartFile("file", "b.png", "image/png", JPEG_HEADER));

        assertThat(pngUrl).startsWith("/uploads/avatars/").endsWith(".png");
        assertThat(jpegUrl).startsWith("/uploads/avatars/").endsWith(".jpg");
        assertThat(dir.resolve("avatars")).isDirectoryContaining(p -> p.toString().endsWith(".png"));
    }

    @Test
    void stillRejectsAnUnsupportedDeclaredType(@TempDir Path dir) {
        MockMultipartFile pdf = new MockMultipartFile("file", "a.pdf", "application/pdf", PNG_HEADER);

        assertThatThrownBy(() -> service(dir).storeAvatar(pdf)).isInstanceOf(ApiException.class);
    }

    @Test
    void telegramPhotosGoThroughTheSameCheck(@TempDir Path dir) {
        FileStorageService service = service(dir);

        assertThat(service.storeJobImageFromBytes(JPEG_HEADER)).endsWith(".jpg");
        assertThatThrownBy(() -> service.storeJobImageFromBytes("not an image".getBytes(StandardCharsets.UTF_8)))
                .isInstanceOf(ApiException.class);
    }

    @Test
    void deletesAStoredFile(@TempDir Path dir) {
        FileStorageService service = service(dir);
        String url = service.storeAvatar(new MockMultipartFile("file", "a.png", "image/png", PNG_HEADER));

        service.deleteByUrl(url);

        assertThat(dir.resolve(url.substring("/uploads/".length()))).doesNotExist();
    }

    @Test
    void refusesToDeleteOutsideTheUploadRoot(@TempDir Path dir) throws IOException {
        Path outsider = dir.getParent().resolve("outside.txt");
        Files.writeString(outsider, "keep me");

        service(dir).deleteByUrl("/uploads/../outside.txt");

        assertThat(outsider).exists();
    }

    @Test
    void ignoresUnrelatedOrMissingValues(@TempDir Path dir) {
        FileStorageService service = service(dir);

        service.deleteByUrl(null);
        service.deleteByUrl("https://cdn.example.test/a.png");
        service.deleteByUrl("/uploads/avatars/does-not-exist.png");
    }
}
