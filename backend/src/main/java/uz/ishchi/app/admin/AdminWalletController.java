package uz.ishchi.app.admin;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import uz.ishchi.app.wallet.WalletService;
import uz.ishchi.app.wallet.dto.AdminAdjustRequest;
import uz.ishchi.app.wallet.dto.WalletResponse;

@RestController
@RequestMapping("/api/admin/wallets")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminWalletController {

    private final WalletService walletService;

    @GetMapping("/{userId}")
    public WalletResponse getWallet(@PathVariable Long userId) {
        return walletService.getWalletByUserId(userId);
    }

    @PostMapping("/{userId}/adjust")
    public WalletResponse adjust(@PathVariable Long userId, @Valid @RequestBody AdminAdjustRequest request) {
        return walletService.adminAdjust(userId, request.amount(), request.note());
    }
}
