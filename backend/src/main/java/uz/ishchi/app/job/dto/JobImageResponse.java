package uz.ishchi.app.job.dto;

import uz.ishchi.app.job.JobImage;

public record JobImageResponse(Long id, String url) {
    public static JobImageResponse from(JobImage image) {
        return new JobImageResponse(image.getId(), image.getUrl());
    }
}
