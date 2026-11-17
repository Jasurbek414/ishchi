package uz.ishchi.app.telephony;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import uz.ishchi.app.telephony.dto.LiveCallEvent;

import java.io.IOException;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

@Service
public class OperatorSseService {

    private static final Logger log = LoggerFactory.getLogger(OperatorSseService.class);
    private static final Long SSE_TIMEOUT = 30 * 60 * 1000L; // 30 mins

    private final List<SseEmitter> emitters = new CopyOnWriteArrayList<>();

    public SseEmitter subscribe(Long operatorId) {
        SseEmitter emitter = new SseEmitter(SSE_TIMEOUT);

        emitters.add(emitter);
        log.info("Operator SSE ulandi: operatorId={}, jami faol: {}", operatorId, emitters.size());

        emitter.onCompletion(() -> {
            emitters.remove(emitter);
            log.info("Operator SSE yakunlandi: qolgan faol: {}", emitters.size());
        });

        emitter.onTimeout(() -> {
            emitters.remove(emitter);
            log.info("Operator SSE timeout: qolgan faol: {}", emitters.size());
        });

        emitter.onError(e -> {
            emitters.remove(emitter);
            log.debug("Operator SSE xato tufayli uzildi: {}", e.getMessage());
        });

        try {
            emitter.send(SseEmitter.event()
                    .name("CONNECTED")
                    .data("Operator konsoliga ulanish muvaffaqiyatli"));
        } catch (IOException e) {
            emitters.remove(emitter);
        }

        return emitter;
    }

    public void broadcastCallEvent(LiveCallEvent event) {
        log.info("Operatorlarga qo'ng'iroq hodisasi uzatilmoqda: type={}, callId={}, phone={}",
                event.eventType(), event.callId(), event.callerPhone());

        List<SseEmitter> deadEmitters = new java.util.ArrayList<>();
        for (SseEmitter emitter : emitters) {
            try {
                emitter.send(SseEmitter.event()
                        .name(event.eventType())
                        .data(event));
            } catch (Exception e) {
                deadEmitters.add(emitter);
            }
        }
        emitters.removeAll(deadEmitters);
    }
}
