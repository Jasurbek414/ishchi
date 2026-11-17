package uz.ishchi.app.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.operator")
public record OperatorProperties(String phone, String password) {
}
