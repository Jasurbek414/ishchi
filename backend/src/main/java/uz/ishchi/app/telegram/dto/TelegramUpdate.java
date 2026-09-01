package uz.ishchi.app.telegram.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonIgnoreProperties(ignoreUnknown = true)
public record TelegramUpdate(Message message) {

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Message(Chat chat, String text, Contact contact) {

        @JsonIgnoreProperties(ignoreUnknown = true)
        public record Chat(Long id) {
        }

        @JsonIgnoreProperties(ignoreUnknown = true)
        public record Contact(@JsonProperty("phone_number") String phoneNumber, @JsonProperty("user_id") Long userId) {
        }
    }
}
