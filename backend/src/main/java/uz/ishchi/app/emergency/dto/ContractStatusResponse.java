package uz.ishchi.app.emergency.dto;

import uz.ishchi.app.emergency.EmergencyApplicationStatus;
import java.time.Instant;

public record ContractStatusResponse(
        boolean isEmergency,
        EmergencyApplicationStatus applicationStatus,
        Long applicationId,
        String category,
        String phone,
        String passportPhotoUrl,
        String passportBackUrl,
        String certificateUrl,
        String toolsPhotoUrl,
        Integer experienceYears,
        String description,
        String rejectionReason,
        Instant submittedAt,
        Instant reviewedAt,
        String termsText
) {
    public static final String DEFAULT_TERMS = """
            1. FOYDALANISH VA XIZMAT KO'RSATISH SHARTNOMASI:
            
            Ushbu shartnoma 'Ishchi' platformasi ma'muriyati hamda mustaqil mutaxassis (usta) o'rtasida favqulodda va tezkor xizmatlar ko'rsatish bo'yicha tuziladi.
            
            2. MUTAXASSISNING MAJBURIYATLARI:
            - Avariya va tezkor chaqiruvlarga o'z vaqtida va sifatli javob berish.
            - Mijozlar bilan xushmuomala bo'lish, kelishilgan narx va muddatlarga rioya qilish.
            - Shaxsini tasdiqlovchi haqiqiy ma'lumotlar va hujjatlarni taqdim etish.
            - O'z xavfsizligi va xizmat sifati uchun shaxsan javobgarlikni o'z zimmasiga olish.
            
            3. MA'MURIYAT HUQUQLARI:
            - Taqdim etilgan hujjatlar (pasport, guvohnoma, sertifikat) haqqoniyligini tekshirish.
            - Shikoyatlar yoki qoidabuzarliklar bo'lganda favqulodda maqomini bekor qilish.
            """;
}
