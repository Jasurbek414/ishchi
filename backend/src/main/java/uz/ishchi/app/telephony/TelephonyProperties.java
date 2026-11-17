package uz.ishchi.app.telephony;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "app.telephony")
public class TelephonyProperties {

    private String webhookSecret = "telephony-secret-change-in-prod";
    private String shortNumber = "1055";
    private String asteriskHost = "localhost";

    public String getWebhookSecret() {
        return webhookSecret;
    }

    public void setWebhookSecret(String webhookSecret) {
        this.webhookSecret = webhookSecret;
    }

    public String getShortNumber() {
        return shortNumber;
    }

    public void setShortNumber(String shortNumber) {
        this.shortNumber = shortNumber;
    }

    public String getAsteriskHost() {
        return asteriskHost;
    }

    public void setAsteriskHost(String asteriskHost) {
        this.asteriskHost = asteriskHost;
    }
}
