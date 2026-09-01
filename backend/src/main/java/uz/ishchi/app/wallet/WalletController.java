package uz.ishchi.app.wallet;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import uz.ishchi.app.common.dto.PageResponse;
import uz.ishchi.app.security.UserPrincipal;
import uz.ishchi.app.wallet.dto.TopUpRequest;
import uz.ishchi.app.wallet.dto.TransactionResponse;
import uz.ishchi.app.wallet.dto.WalletResponse;

@RestController
@RequestMapping("/api/wallet")
@RequiredArgsConstructor
public class WalletController {

    private final WalletService walletService;

    @GetMapping
    public WalletResponse getWallet(@AuthenticationPrincipal UserPrincipal principal) {
        return walletService.getWallet(principal.getUser());
    }

    @GetMapping("/transactions")
    public PageResponse<TransactionResponse> getTransactions(@AuthenticationPrincipal UserPrincipal principal,
                                                               Pageable pageable) {
        return PageResponse.of(walletService.getTransactions(principal.getUser(), pageable));
    }

    @PostMapping("/topup")
    public WalletResponse topUp(@AuthenticationPrincipal UserPrincipal principal,
                                 @Valid @RequestBody TopUpRequest request) {
        return walletService.topUp(principal.getUser(), request.amount());
    }
}
