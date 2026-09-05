package uz.ishchi.app.landing;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Single-row table (id is always 1) holding the public landing page's editable copy. */
@Entity
@Table(name = "landing_content")
@Getter
@Setter
@NoArgsConstructor
public class LandingContent {

    @Id
    private Long id = 1L;

    @Column(name = "hero_title", nullable = false, length = 300)
    private String heroTitle;

    @Column(name = "hero_subtitle", nullable = false, length = 600)
    private String heroSubtitle;

    @Column(name = "stat1_value", nullable = false, length = 40)
    private String stat1Value;

    @Column(name = "stat1_label", nullable = false, length = 100)
    private String stat1Label;

    @Column(name = "stat2_value", nullable = false, length = 40)
    private String stat2Value;

    @Column(name = "stat2_label", nullable = false, length = 100)
    private String stat2Label;

    @Column(name = "stat3_value", nullable = false, length = 40)
    private String stat3Value;

    @Column(name = "stat3_label", nullable = false, length = 100)
    private String stat3Label;

    @Column(name = "stat4_value", nullable = false, length = 40)
    private String stat4Value;

    @Column(name = "stat4_label", nullable = false, length = 100)
    private String stat4Label;
}
