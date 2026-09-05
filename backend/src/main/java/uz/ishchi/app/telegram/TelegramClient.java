package uz.ishchi.app.telegram;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Optional;

/**
 * Thin wrapper around the Telegram Bot HTTP API. Every method takes the bot token explicitly
 * (rather than reading it from settings itself) so callers stay in control of which bot's
 * credentials are used and no circular dependency forms with {@code AppSettingsService}.
 */
@Component
public class TelegramClient {

    private static final Logger log = LoggerFactory.getLogger(TelegramClient.class);

    private final HttpClient http = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();
    private final ObjectMapper mapper = new ObjectMapper();

    public record BotIdentity(String username, boolean ok) {
    }

    public BotIdentity getMe(String token) {
        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://api.telegram.org/bot" + token + "/getMe"))
                    .timeout(Duration.ofSeconds(10))
                    .GET()
                    .build();
            HttpResponse<String> response = http.send(request, HttpResponse.BodyHandlers.ofString());
            JsonNode body = mapper.readTree(response.body());
            if (!body.path("ok").asBoolean(false)) {
                return new BotIdentity(null, false);
            }
            String username = body.path("result").path("username").asText(null);
            return new BotIdentity(username, username != null);
        } catch (Exception e) {
            log.error("Telegram getMe so'rovi muvaffaqiyatsiz", e);
            return new BotIdentity(null, false);
        }
    }

    public boolean setWebhook(String token, String webhookUrl, String secretToken) {
        try {
            String query = "url=" + URLEncoder.encode(webhookUrl, StandardCharsets.UTF_8)
                    + "&secret_token=" + URLEncoder.encode(secretToken, StandardCharsets.UTF_8)
                    + "&drop_pending_updates=true";
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://api.telegram.org/bot" + token + "/setWebhook?" + query))
                    .timeout(Duration.ofSeconds(10))
                    .POST(HttpRequest.BodyPublishers.noBody())
                    .build();
            HttpResponse<String> response = http.send(request, HttpResponse.BodyHandlers.ofString());
            JsonNode body = mapper.readTree(response.body());
            boolean ok = body.path("ok").asBoolean(false);
            if (!ok) {
                log.error("Telegram setWebhook muvaffaqiyatsiz: {}", response.body());
            }
            return ok;
        } catch (Exception e) {
            log.error("Telegram setWebhook so'rovi muvaffaqiyatsiz", e);
            return false;
        }
    }

    public void deleteWebhook(String token) {
        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://api.telegram.org/bot" + token + "/deleteWebhook"))
                    .timeout(Duration.ofSeconds(10))
                    .POST(HttpRequest.BodyPublishers.noBody())
                    .build();
            http.send(request, HttpResponse.BodyHandlers.discarding());
        } catch (Exception e) {
            log.warn("Telegram deleteWebhook so'rovi muvaffaqiyatsiz (e'tiborsiz qoldirildi)", e);
        }
    }

    public boolean sendMessage(String token, long chatId, String text) {
        try {
            String query = "chat_id=" + chatId + "&text=" + URLEncoder.encode(text, StandardCharsets.UTF_8);
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://api.telegram.org/bot" + token + "/sendMessage?" + query))
                    .timeout(Duration.ofSeconds(10))
                    .POST(HttpRequest.BodyPublishers.noBody())
                    .build();
            HttpResponse<String> response = http.send(request, HttpResponse.BodyHandlers.ofString());
            JsonNode body = mapper.readTree(response.body());
            boolean ok = body.path("ok").asBoolean(false);
            if (!ok) {
                log.error("Telegram sendMessage muvaffaqiyatsiz: {}", response.body());
            }
            return ok;
        } catch (Exception e) {
            log.error("Telegram sendMessage so'rovi muvaffaqiyatsiz", e);
            return false;
        }
    }

    /** A reply-keyboard button. Set {@code requestContact} to have Telegram share the viewer's
     *  own verified phone number when tapped — this can't be spoofed to a different number. */
    public record KeyboardButton(String text, boolean requestContact) {
        public static KeyboardButton of(String text) {
            return new KeyboardButton(text, false);
        }

        public static KeyboardButton contactRequest(String text) {
            return new KeyboardButton(text, true);
        }
    }

    /** Sends a message with a persistent reply keyboard — each row is one row of buttons. */
    public boolean sendMessageWithKeyboard(String token, long chatId, String text, java.util.List<java.util.List<KeyboardButton>> keyboardRows) {
        try {
            var root = mapper.createObjectNode();
            root.put("chat_id", chatId);
            root.put("text", text);
            var replyMarkup = mapper.createObjectNode();
            var keyboard = mapper.createArrayNode();
            for (var row : keyboardRows) {
                var rowNode = mapper.createArrayNode();
                for (var button : row) {
                    var btn = mapper.createObjectNode();
                    btn.put("text", button.text());
                    if (button.requestContact()) {
                        btn.put("request_contact", true);
                    }
                    rowNode.add(btn);
                }
                keyboard.add(rowNode);
            }
            replyMarkup.set("keyboard", keyboard);
            replyMarkup.put("resize_keyboard", true);
            root.set("reply_markup", replyMarkup);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://api.telegram.org/bot" + token + "/sendMessage"))
                    .timeout(Duration.ofSeconds(10))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(mapper.writeValueAsString(root)))
                    .build();
            HttpResponse<String> response = http.send(request, HttpResponse.BodyHandlers.ofString());
            JsonNode body = mapper.readTree(response.body());
            boolean ok = body.path("ok").asBoolean(false);
            if (!ok) {
                log.error("Telegram sendMessage (keyboard) muvaffaqiyatsiz: {}", response.body());
            }
            return ok;
        } catch (Exception e) {
            log.error("Telegram sendMessage (keyboard) so'rovi muvaffaqiyatsiz", e);
            return false;
        }
    }

    /** Downloads a photo the bot received, by its Telegram-issued file id — two hops: resolve
     *  the file's storage path via getFile, then fetch the bytes from the file CDN. */
    public Optional<byte[]> downloadPhoto(String token, String fileId) {
        try {
            HttpRequest getFileRequest = HttpRequest.newBuilder()
                    .uri(URI.create("https://api.telegram.org/bot" + token + "/getFile?file_id="
                            + URLEncoder.encode(fileId, StandardCharsets.UTF_8)))
                    .timeout(Duration.ofSeconds(10))
                    .GET()
                    .build();
            HttpResponse<String> fileResponse = http.send(getFileRequest, HttpResponse.BodyHandlers.ofString());
            JsonNode body = mapper.readTree(fileResponse.body());
            if (!body.path("ok").asBoolean(false)) {
                log.error("Telegram getFile muvaffaqiyatsiz: {}", fileResponse.body());
                return Optional.empty();
            }
            String filePath = body.path("result").path("file_path").asText(null);
            if (filePath == null) {
                return Optional.empty();
            }

            HttpRequest downloadRequest = HttpRequest.newBuilder()
                    .uri(URI.create("https://api.telegram.org/file/bot" + token + "/" + filePath))
                    .timeout(Duration.ofSeconds(15))
                    .GET()
                    .build();
            HttpResponse<byte[]> downloadResponse = http.send(downloadRequest, HttpResponse.BodyHandlers.ofByteArray());
            if (downloadResponse.statusCode() != 200) {
                log.error("Telegram fayl yuklab olish muvaffaqiyatsiz: status={}", downloadResponse.statusCode());
                return Optional.empty();
            }
            return Optional.of(downloadResponse.body());
        } catch (Exception e) {
            log.error("Telegram fayl yuklab olishda xatolik", e);
            return Optional.empty();
        }
    }
}
