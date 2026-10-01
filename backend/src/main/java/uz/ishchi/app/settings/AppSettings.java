package uz.ishchi.app.settings;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

/** Single-row table (id is always 1) holding platform-wide feature toggles. */
@Entity
@Table(name = "app_settings")
@Getter
@Setter
@NoArgsConstructor
public class AppSettings {

    @Id
    private Long id = 1L;

    @Column(name = "wallet_enabled", nullable = false)
    private boolean walletEnabled = false;

    @Column(name = "telegram_bot_token")
    private String telegramBotToken;

    @Column(name = "telegram_bot_username")
    private String telegramBotUsername;

    /** Random per-deployment value, unrelated to the bot token; travels in Telegram's header. */
    @Column(name = "telegram_webhook_secret", length = 100)
    private String telegramWebhookSecret;

    @Column(name = "support_phone", length = 20)
    private String supportPhone;

    @Column(name = "support_email", length = 200)
    private String supportEmail;

    @Column(name = "support_telegram", length = 100)
    private String supportTelegram;

    @Column(name = "about_text", columnDefinition = "text")
    private String aboutText;

    @Column(name = "job_posting_fee_enabled", nullable = false)
    private boolean jobPostingFeeEnabled = false;

    @Column(name = "job_posting_fee", nullable = false, precision = 12, scale = 2)
    private BigDecimal jobPostingFee = BigDecimal.ZERO;

    @Column(name = "job_view_fee_enabled", nullable = false)
    private boolean jobViewFeeEnabled = false;

    @Column(name = "job_view_fee", nullable = false, precision = 12, scale = 2)
    private BigDecimal jobViewFee = BigDecimal.ZERO;

    /** What a fresh mobile install shows before the user ever opens theme settings —
     *  {@code LIGHT}, {@code DARK}, or {@code SYSTEM}. */
    @Column(name = "default_theme_mode", nullable = false, length = 10)
    private String defaultThemeMode = "LIGHT";

    /** Hex color (e.g. {@code #0284C7}) seeding the app's default Material color scheme. */
    @Column(name = "default_seed_color", nullable = false, length = 9)
    private String defaultSeedColor = "#0284C7";

    /** Map tile URL template for the mobile app ({z}/{x}/{y}); null means the app's default. */
    @Column(name = "map_tile_url", length = 500)
    private String mapTileUrl;

    /** Attribution shown on the map for the tile source above; null means the default's. */
    @Column(name = "map_attribution", length = 200)
    private String mapAttribution;
}
