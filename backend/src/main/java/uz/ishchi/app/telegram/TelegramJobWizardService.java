package uz.ishchi.app.telegram;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import uz.ishchi.app.common.FileStorageService;
import uz.ishchi.app.common.JobType;
import uz.ishchi.app.common.PaymentType;
import uz.ishchi.app.common.TelegramDraftStep;
import uz.ishchi.app.common.exception.ApiException;
import uz.ishchi.app.job.dto.JobCreateRequest;
import uz.ishchi.app.job.dto.JobResponse;
import uz.ishchi.app.location.District;
import uz.ishchi.app.location.DistrictRepository;
import uz.ishchi.app.location.Region;
import uz.ishchi.app.location.RegionRepository;
import uz.ishchi.app.profession.Profession;
import uz.ishchi.app.profession.ProfessionRepository;
import uz.ishchi.app.profile.EmployerProfileRepository;
import uz.ishchi.app.user.User;
import uz.ishchi.app.user.UserRepository;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/** The "post a job" conversational wizard reachable from the bot's main menu. Walks an
 *  employer through the same fields the app's job-posting form collects, one message at a
 *  time, then publishes it through {@link TelegramJobPublisher}, which goes on to the normal
 *  JobService — so it's subject to the exact same rules (posting fee, notifications to matching
 *  workers) as posting from the app. */
@Service
public class TelegramJobWizardService {

    private static final Logger log = LoggerFactory.getLogger(TelegramJobWizardService.class);

    private final TelegramJobDraftRepository draftRepository;
    private final ProfessionRepository professionRepository;
    private final RegionRepository regionRepository;
    private final DistrictRepository districtRepository;
    private final EmployerProfileRepository employerProfileRepository;
    private final UserRepository userRepository;
    private final TelegramJobPublisher jobPublisher;
    private final TelegramClient telegramClient;
    private final FileStorageService fileStorageService;
    // Lazy to break the constructor cycle — TelegramService itself depends on this bean.
    private final TelegramService telegramService;

    public TelegramJobWizardService(TelegramJobDraftRepository draftRepository,
                                     ProfessionRepository professionRepository,
                                     RegionRepository regionRepository,
                                     DistrictRepository districtRepository,
                                     EmployerProfileRepository employerProfileRepository,
                                     UserRepository userRepository,
                                     TelegramJobPublisher jobPublisher,
                                     TelegramClient telegramClient,
                                     FileStorageService fileStorageService,
                                     @Lazy TelegramService telegramService) {
        this.draftRepository = draftRepository;
        this.professionRepository = professionRepository;
        this.regionRepository = regionRepository;
        this.districtRepository = districtRepository;
        this.employerProfileRepository = employerProfileRepository;
        this.userRepository = userRepository;
        this.jobPublisher = jobPublisher;
        this.telegramClient = telegramClient;
        this.fileStorageService = fileStorageService;
        this.telegramService = telegramService;
    }

    /** Each photo is written to disk, so an unbounded count was a free way to fill the volume. */
    private static final int MAX_IMAGES = 10;

    public static final String BTN_CANCEL = "❌ Bekor qilish";
    private static final String BTN_CONFIRM = "✅ Tasdiqlash va joylashtirish";
    private static final String BTN_IMAGES_DONE = "✅ Rasmlar tayyor";
    private static final String BTN_IMAGES_SKIP = "⏭ Rasmsiz davom etish";

    private static final String SAMPLE = """
            📋 Namuna:

            Sarlavha: Kafel yotqizish kerak
            Tavsif: 3 xonali kvartira hammomiga kafel yotqizish, material tayyor
            Kasb: Kafelchi · Hudud: Toshkent shahri, Chilonzor
            To'lov: 1 500 000 so'm (belgilangan narx) · Ish turi: Bir kunlik · Kerakli ishchi: 1

            Endi sizning navbatingiz — bir nechta savolga javob bering, buyurtma shu qolipda tayyor bo'ladi.""";

    public boolean isActive(long chatId) {
        return draftRepository.existsById(chatId);
    }

    @Transactional
    public void start(String token, long chatId, User employerUser) {
        if (employerProfileRepository.findByUserId(employerUser.getId()).isEmpty()) {
            telegramClient.sendMessage(token, chatId,
                    "Buyurtma joylashtirish uchun ilovada \"Ish beruvchi\" rejimiga o'tgan bo'lishingiz kerak "
                            + "(Profil → Rolni almashtirish).");
            return;
        }
        // Starting over replaces the previous draft row, so its already-uploaded photos would
        // otherwise stay on disk with nothing pointing at them.
        draftRepository.findById(chatId).ifPresent(this::discardImages);
        draftRepository.save(new TelegramJobDraft(chatId));
        telegramClient.sendMessage(token, chatId, SAMPLE);
        telegramClient.sendMessageWithKeyboard(token, chatId,
                "1️⃣ Buyurtma sarlavhasini yozing (masalan: \"Kafel yotqizish kerak\"):",
                cancelOnly());
    }

    @Transactional
    public void handlePhoto(String token, long chatId, String fileId) {
        TelegramJobDraft draft = draftRepository.findById(chatId).orElse(null);
        if (draft == null || draft.getStep() != TelegramDraftStep.IMAGES) {
            return;
        }
        if (draft.getImageUrls().size() >= MAX_IMAGES) {
            telegramClient.sendMessage(token, chatId,
                    "Ko'pi bilan " + MAX_IMAGES + " ta rasm qo'shish mumkin. \"" + BTN_IMAGES_DONE + "\" tugmasini bosing.");
            return;
        }
        Optional<byte[]> bytes = telegramClient.downloadPhoto(token, fileId);
        if (bytes.isEmpty()) {
            telegramClient.sendMessage(token, chatId, "Rasmni yuklab bo'lmadi, qaytadan yuboring.");
            return;
        }
        String url = fileStorageService.storeJobImageFromBytes(bytes.get());
        draft.getImageUrls().add(url);
        telegramClient.sendMessage(token, chatId,
                draft.getImageUrls().size() + " ta rasm qabul qilindi. Yana yuboring yoki tugating.");
    }

    @Transactional
    public void handleText(String token, long chatId, String text) {
        TelegramJobDraft draft = draftRepository.findById(chatId).orElse(null);
        if (draft == null) {
            return;
        }
        if (BTN_CANCEL.equals(text)) {
            discardImages(draft);
            draftRepository.deleteById(chatId);
            telegramClient.sendMessage(token, chatId, "Bekor qilindi.");
            telegramService.sendMainMenu(token, chatId);
            return;
        }

        switch (draft.getStep()) {
            case TITLE -> {
                if (text.isBlank() || text.length() > 200) {
                    telegramClient.sendMessage(token, chatId, "Sarlavha 1-200 belgi bo'lishi kerak. Qaytadan yozing:");
                    return;
                }
                draft.setTitle(text.trim());
                draft.setStep(TelegramDraftStep.DESCRIPTION);
                telegramClient.sendMessageWithKeyboard(token, chatId,
                        "2️⃣ Batafsil tavsif yozing (qanday ish, qachon, qanday shartlar):", cancelOnly());
            }
            case DESCRIPTION -> {
                if (text.isBlank() || text.length() > 4000) {
                    telegramClient.sendMessage(token, chatId, "Tavsif bo'sh bo'lmasligi kerak. Qaytadan yozing:");
                    return;
                }
                draft.setDescription(text.trim());
                draft.setStep(TelegramDraftStep.PROFESSION);
                List<Profession> professions = professionRepository.findByActiveTrueOrderByCategoryAscNameAsc();
                telegramClient.sendMessageWithKeyboard(token, chatId, "3️⃣ Kasbni tanlang:",
                        namedRows(professions.stream().map(Profession::getName).toList()));
            }
            case PROFESSION -> {
                Optional<Profession> profession = professionRepository.findByActiveTrueAndNameIgnoreCase(text.trim());
                if (profession.isEmpty()) {
                    telegramClient.sendMessage(token, chatId, "Ro'yxatdan bir kasbni tugma orqali tanlang.");
                    return;
                }
                draft.setProfession(profession.get());
                draft.setStep(TelegramDraftStep.REGION);
                List<Region> regions = regionRepository.findAll();
                telegramClient.sendMessageWithKeyboard(token, chatId, "4️⃣ Hududni tanlang:",
                        namedRows(regions.stream().map(Region::getName).toList()));
            }
            case REGION -> {
                Optional<Region> region = regionRepository.findByNameIgnoreCase(text.trim());
                if (region.isEmpty()) {
                    telegramClient.sendMessage(token, chatId, "Ro'yxatdan bir hududni tugma orqali tanlang.");
                    return;
                }
                draft.setRegion(region.get());
                draft.setStep(TelegramDraftStep.DISTRICT);
                List<District> districts = districtRepository.findByRegionIdOrderByNameAsc(region.get().getId());
                telegramClient.sendMessageWithKeyboard(token, chatId, "5️⃣ Tumanni tanlang:",
                        namedRows(districts.stream().map(District::getName).toList()));
            }
            case DISTRICT -> {
                Optional<District> district = districtRepository
                        .findByRegionIdAndNameIgnoreCase(draft.getRegion().getId(), text.trim());
                if (district.isEmpty()) {
                    telegramClient.sendMessage(token, chatId, "Ro'yxatdan bir tumanni tugma orqali tanlang.");
                    return;
                }
                draft.setDistrict(district.get());
                draft.setStep(TelegramDraftStep.PAYMENT);
                telegramClient.sendMessageWithKeyboard(token, chatId,
                        "6️⃣ To'lov summasini kiriting (so'm, faqat raqam, masalan: 1500000):", cancelOnly());
            }
            case PAYMENT -> {
                BigDecimal payment = parsePositiveDecimal(text);
                if (payment == null) {
                    telegramClient.sendMessage(token, chatId, "Summani faqat raqam bilan kiriting (masalan: 1500000):");
                    return;
                }
                draft.setPayment(payment);
                draft.setStep(TelegramDraftStep.PAYMENT_TYPE);
                telegramClient.sendMessageWithKeyboard(token, chatId, "7️⃣ To'lov turi:",
                        namedRows(List.of("Belgilangan narx", "Kunlik")));
            }
            case PAYMENT_TYPE -> {
                PaymentType paymentType = switch (text.trim()) {
                    case "Belgilangan narx" -> PaymentType.FIXED;
                    case "Kunlik" -> PaymentType.DAILY_RATE;
                    default -> null;
                };
                if (paymentType == null) {
                    telegramClient.sendMessage(token, chatId, "Ro'yxatdan bir turni tugma orqali tanlang.");
                    return;
                }
                draft.setPaymentType(paymentType);
                draft.setStep(TelegramDraftStep.JOB_TYPE);
                telegramClient.sendMessageWithKeyboard(token, chatId, "8️⃣ Ish turi:",
                        namedRows(List.of("Bir kunlik", "Vaqtinchalik", "Doimiy")));
            }
            case JOB_TYPE -> {
                JobType jobType = switch (text.trim()) {
                    case "Bir kunlik" -> JobType.DAILY;
                    case "Vaqtinchalik" -> JobType.TEMPORARY;
                    case "Doimiy" -> JobType.PERMANENT;
                    default -> null;
                };
                if (jobType == null) {
                    telegramClient.sendMessage(token, chatId, "Ro'yxatdan bir turni tugma orqali tanlang.");
                    return;
                }
                draft.setJobType(jobType);
                draft.setStep(TelegramDraftStep.WORKERS_NEEDED);
                telegramClient.sendMessageWithKeyboard(token, chatId, "9️⃣ Nechta ishchi kerak? (raqam kiriting):",
                        cancelOnly());
            }
            case WORKERS_NEEDED -> {
                Integer workersNeeded = parsePositiveInt(text);
                if (workersNeeded == null) {
                    telegramClient.sendMessage(token, chatId, "Butun musbat son kiriting (masalan: 1):");
                    return;
                }
                draft.setWorkersNeeded(workersNeeded);
                draft.setStep(TelegramDraftStep.IMAGES);
                telegramClient.sendMessageWithKeyboard(token, chatId,
                        "🔟 Buyurtma uchun rasm(lar) yuboring (istalgancha). Tugatgach tugmani bosing:",
                        List.of(List.of(TelegramClient.KeyboardButton.of(BTN_IMAGES_DONE)),
                                List.of(TelegramClient.KeyboardButton.of(BTN_IMAGES_SKIP)),
                                List.of(TelegramClient.KeyboardButton.of(BTN_CANCEL))));
            }
            case IMAGES -> {
                if (BTN_IMAGES_DONE.equals(text) || BTN_IMAGES_SKIP.equals(text)) {
                    draft.setStep(TelegramDraftStep.CONFIRM);
                    telegramClient.sendMessageWithKeyboard(token, chatId, summary(draft),
                            List.of(List.of(TelegramClient.KeyboardButton.of(BTN_CONFIRM)),
                                    List.of(TelegramClient.KeyboardButton.of(BTN_CANCEL))));
                } else {
                    telegramClient.sendMessage(token, chatId,
                            "Rasm yuboring yoki \"" + BTN_IMAGES_DONE + "\" tugmasini bosing.");
                }
            }
            case CONFIRM -> {
                if (BTN_CONFIRM.equals(text)) {
                    finish(token, chatId, draft);
                } else {
                    telegramClient.sendMessage(token, chatId, "\"" + BTN_CONFIRM + "\" tugmasini bosing yoki bekor qiling.");
                }
            }
        }
    }

    private void finish(String token, long chatId, TelegramJobDraft draft) {
        int imageCount = draft.getImageUrls().size();
        JobCreateRequest request = new JobCreateRequest(
                draft.getTitle(), draft.getDescription(), draft.getProfession().getId(),
                draft.getRegion().getId(), draft.getDistrict().getId(), draft.getPayment(),
                draft.getPaymentType(), draft.getJobType(), draft.getWorkersNeeded(),
                null, null, null, null, null, null);
        try {
            // Published in its own transaction, so a rejection (an insufficient balance, say) does
            // not poison this one and leave the draft unusable — the user can simply confirm again.
            JobResponse job = jobPublisher.publish(chatId, request, List.copyOf(draft.getImageUrls()));
            draftRepository.deleteById(chatId);
            telegramClient.sendMessage(token, chatId,
                    "✅ Buyurtma joylashtirildi!\n\n\"" + job.title() + "\" — mos ishchilarga bildirishnoma yuborildi."
                            + (imageCount == 0 ? "" : " " + imageCount + " ta rasm biriktirildi."));
            telegramService.sendMainMenu(token, chatId);
        } catch (ApiException e) {
            telegramClient.sendMessage(token, chatId, "❗ " + e.getMessage());
        } catch (Exception e) {
            log.error("Telegram orqali buyurtma joylashtirishda xatolik", e);
            telegramClient.sendMessage(token, chatId, "❗ Buyurtmani joylashtirib bo'lmadi, birozdan so'ng qayta urinib ko'ring.");
        }
    }

    /** Removes the photos a draft uploaded but never published. */
    void discardImages(TelegramJobDraft draft) {
        draft.getImageUrls().forEach(fileStorageService::deleteAfterCommit);
    }

    private String summary(TelegramJobDraft draft) {
        String paymentTypeLabel = draft.getPaymentType() == PaymentType.DAILY_RATE ? "Kunlik" : "Belgilangan narx";
        String jobTypeLabel = switch (draft.getJobType()) {
            case DAILY -> "Bir kunlik";
            case TEMPORARY -> "Vaqtinchalik";
            case PERMANENT -> "Doimiy";
        };
        return """
                📋 Buyurtma ko'rinishi:

                Sarlavha: %s
                Tavsif: %s
                Kasb: %s
                Hudud: %s, %s
                To'lov: %s so'm (%s)
                Ish turi: %s
                Kerakli ishchi: %d
                Rasmlar: %d ta

                Hammasi to'g'rimi?""".formatted(
                draft.getTitle(), draft.getDescription(), draft.getProfession().getName(),
                draft.getRegion().getName(), draft.getDistrict().getName(),
                draft.getPayment().toBigInteger(), paymentTypeLabel, jobTypeLabel,
                draft.getWorkersNeeded(), draft.getImageUrls().size());
    }

    private List<List<TelegramClient.KeyboardButton>> cancelOnly() {
        return List.of(List.of(TelegramClient.KeyboardButton.of(BTN_CANCEL)));
    }

    private List<List<TelegramClient.KeyboardButton>> namedRows(List<String> names) {
        List<List<TelegramClient.KeyboardButton>> rows = new ArrayList<>();
        for (int i = 0; i < names.size(); i += 2) {
            List<TelegramClient.KeyboardButton> row = new ArrayList<>();
            row.add(TelegramClient.KeyboardButton.of(names.get(i)));
            if (i + 1 < names.size()) row.add(TelegramClient.KeyboardButton.of(names.get(i + 1)));
            rows.add(row);
        }
        rows.add(List.of(TelegramClient.KeyboardButton.of(BTN_CANCEL)));
        return rows;
    }

    private BigDecimal parsePositiveDecimal(String text) {
        try {
            BigDecimal value = new BigDecimal(text.trim().replaceAll("[ ,]", ""));
            return value.compareTo(BigDecimal.ZERO) > 0 ? value : null;
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private Integer parsePositiveInt(String text) {
        try {
            int value = Integer.parseInt(text.trim());
            return value > 0 ? value : null;
        } catch (NumberFormatException e) {
            return null;
        }
    }
}
