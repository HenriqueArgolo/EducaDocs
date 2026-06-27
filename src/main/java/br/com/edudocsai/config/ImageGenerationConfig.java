package br.com.edudocsai.config;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.util.concurrent.Executor;

@Configuration
public class ImageGenerationConfig {

    @Bean
    @Qualifier("imageGenerationExecutor")
    Executor imageGenerationExecutor(ImageGenerationProperties properties) {
        int concurrency = Math.max(1, properties.maxConcurrency());
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(concurrency);
        executor.setMaxPoolSize(concurrency);
        executor.setQueueCapacity(Math.max(8, properties.maxAssetsPerActivity()));
        executor.setThreadNamePrefix("activity-image-");
        executor.initialize();
        return executor;
    }
}

