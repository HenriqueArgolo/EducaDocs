package br.com.edudocsai.config;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.boot.env.YamlPropertySourceLoader;
import org.springframework.core.env.PropertySource;
import org.springframework.core.io.ClassPathResource;

class ImageGenerationConfigurationTest {

    @Test
    void keepsImageGenerationDisabledByDefault() throws Exception {
        List<PropertySource<?>> sources = new YamlPropertySourceLoader()
            .load("application", new ClassPathResource("application.yml"));

        Object configuredValue = sources.stream()
            .map(source -> source.getProperty("edudocs.ai.image.enabled"))
            .filter(value -> value != null)
            .findFirst()
            .orElse(null);

        assertThat(configuredValue).isEqualTo(false);
    }
}
