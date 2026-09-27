package uz.ishchi.app.telegram.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public record TelegramUpdate(Message message) {

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Message(Chat chat, From from, String text, Contact contact, List<PhotoSize> photo) {

        @JsonIgnoreProperties(ignoreUnknown = true)
        public record Chat(Long id) {
        }

        /** The Telegram account that sent the message — needed to prove a shared contact is
         *  the sender's own number and not a contact card forwarded from their address book. */
        @JsonIgnoreProperties(ignoreUnknown = true)
        public record From(Long id) {
        }

        @JsonIgnoreProperties(ignoreUnknown = true)
        public record Contact(@JsonProperty("phone_number") String phoneNumber, @JsonProperty("user_id") Long userId) {
        }

        /** One of several resolutions Telegram sends for a photo message; entries are ordered
         *  smallest to largest, so the last one is the highest-resolution version. */
        @JsonIgnoreProperties(ignoreUnknown = true)
        public record PhotoSize(@JsonProperty("file_id") String fileId, Integer width, Integer height) {
        }
    }
}
