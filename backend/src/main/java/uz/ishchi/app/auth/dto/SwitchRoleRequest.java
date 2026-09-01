package uz.ishchi.app.auth.dto;

import java.util.List;

public record SwitchRoleRequest(List<Long> professionIds) {
}
