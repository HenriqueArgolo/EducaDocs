package br.com.edudocsai.config;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.function.client.WebClient;

@Configuration
public class WebClientConfig {

    @Bean
    @Qualifier("geminiWebClient")
    WebClient geminiWebClient(AiProperties properties) {
        return WebClient.builder()
                .baseUrl(properties.gemini().baseUrl())
                .build();
    }

    @Bean
    @Qualifier("geminiImageWebClient")
    WebClient geminiImageWebClient(ImageGenerationProperties properties) {
        return WebClient.builder()
                .baseUrl(properties.baseUrl())
                .codecs(configurer -> configurer.defaultCodecs().maxInMemorySize(8 * 1024 * 1024))
                .build();
    }

    @Bean
    @Qualifier("openRouterWebClient")
    WebClient openRouterWebClient(AiProperties properties) {
        return WebClient.builder()
                .baseUrl(properties.openrouter().baseUrl())
                .build();
    }

    @Bean
    @Qualifier("deepseekWebClient")
    WebClient deepseekWebClient(AiProperties properties) {
        return WebClient.builder()
                .baseUrl(properties.deepseek().baseUrl())
                .build();
    }
}
