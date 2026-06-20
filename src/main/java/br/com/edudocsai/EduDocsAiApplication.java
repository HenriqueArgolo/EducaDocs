package br.com.edudocsai;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;
import org.springframework.cache.annotation.EnableCaching;

@EnableCaching
@SpringBootApplication
@ConfigurationPropertiesScan
public class EduDocsAiApplication {

    public static void main(String[] args) {
        SpringApplication.run(EduDocsAiApplication.class, args);
    }
}
