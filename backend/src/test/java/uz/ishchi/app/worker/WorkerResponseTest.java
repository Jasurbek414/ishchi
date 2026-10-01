package uz.ishchi.app.worker;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import uz.ishchi.app.location.District;
import uz.ishchi.app.location.Region;
import uz.ishchi.app.profile.WorkerProfile;
import uz.ishchi.app.user.User;
import uz.ishchi.app.common.Role;
import uz.ishchi.app.worker.dto.WorkerResponse;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Guards the rule that contact details never appear in a bulk response — the reason one account
 * could previously page through every worker's phone number and home coordinates.
 */
class WorkerResponseTest {

    private WorkerProfile profile;

    @BeforeEach
    void setUp() {
        User user = new User("+998901234567", "hash", Role.WORKER);
        Region region = new Region();
        region.setName("Namangan");
        District district = new District();
        district.setName("Chust");

        profile = new WorkerProfile();
        profile.setUser(user);
        profile.setFirstName("Ali");
        profile.setLastName("Valiyev");
        profile.setRegion(region);
        profile.setDistrict(district);
        profile.setLatitude(41.0);
        profile.setLongitude(71.6);
    }

    @Test
    void listResultsWithholdPhoneAndCoordinates() {
        WorkerResponse response = WorkerResponse.forList(profile);

        assertThat(response.phone()).isEmpty();
        assertThat(response.latitude()).isNull();
        assertThat(response.longitude()).isNull();
        assertThat(response.firstName()).isEqualTo("Ali");
    }

    @Test
    void mapPinsKeepCoordinatesButStillWithholdPhone() {
        WorkerResponse response = WorkerResponse.forMap(profile);

        assertThat(response.phone()).isEmpty();
        assertThat(response.latitude()).isEqualTo(41.0);
        assertThat(response.longitude()).isEqualTo(71.6);
    }

    @Test
    void detailViewIsTheOnlyPlaceThatServesThePhone() {
        WorkerResponse response = WorkerResponse.forDetail(profile, List.of());

        assertThat(response.phone()).isEqualTo("+998901234567");
    }

    @Test
    void withheldPhoneIsBlankRatherThanNull() {
        // A released client parses this field as a non-nullable String, so null would crash it.
        assertThat(WorkerResponse.forList(profile).phone()).isNotNull();
        assertThat(WorkerResponse.forMap(profile).phone()).isNotNull();
    }
}
