package uz.ishchi.app.wallet.dto;

import uz.ishchi.app.wallet.WalletAccount;

import java.math.BigDecimal;

public record WalletResponse(Long id, BigDecimal balance) {
    public static WalletResponse from(WalletAccount wallet) {
        return new WalletResponse(wallet.getId(), wallet.getBalance());
    }
}
