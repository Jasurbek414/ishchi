package uz.ishchi.app.admin;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import uz.ishchi.app.common.dto.PageResponse;
import uz.ishchi.app.telegram.TelegramService;
import uz.ishchi.app.telegram.dto.FeedbackReplyRequest;
import uz.ishchi.app.telegram.dto.ResolvedRequest;
import uz.ishchi.app.telegram.dto.TelegramFeedbackResponse;

@RestController
@RequestMapping("/api/admin/telegram/feedback")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminTelegramController {

    private final TelegramService telegramService;

    @GetMapping
    public PageResponse<TelegramFeedbackResponse> list(@RequestParam(required = false) Boolean resolved, Pageable pageable) {
        return PageResponse.of(telegramService.listFeedback(resolved, pageable));
    }

    @PostMapping("/{id}/reply")
    public TelegramFeedbackResponse reply(@PathVariable Long id, @Valid @RequestBody FeedbackReplyRequest request) {
        return telegramService.replyToFeedback(id, request.text());
    }

    @PatchMapping("/{id}/resolved")
    public TelegramFeedbackResponse setResolved(@PathVariable Long id, @Valid @RequestBody ResolvedRequest request) {
        return telegramService.setFeedbackResolved(id, request.resolved());
    }
}
