package br.com.edudocsai.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;

@RestController
@RequestMapping("/images")
public class ImageController {

    private final HttpClient httpClient = HttpClient.newBuilder()
            .followRedirects(HttpClient.Redirect.ALWAYS)
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    @GetMapping("/search")
    public String searchImages(
            @RequestParam String query,
            @RequestParam(defaultValue = "15") int perPage
    ) {
        try {
            String encodedQuery = URLEncoder.encode(query, StandardCharsets.UTF_8);
            String url = "https://unsplash.com/napi/search/photos?query=" + encodedQuery + "&per_page=" + perPage;

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .header("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
                    .header("Accept", "*/*")
                    .timeout(Duration.ofSeconds(10))
                    .GET()
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            System.out.println("Unsplash proxy response status code: " + response.statusCode());
            if (response.statusCode() == 200) {
                return response.body();
            } else {
                System.err.println("Unsplash proxy failed. Status: " + response.statusCode() + ", Body: " + response.body());
                return "{\"results\":[]}";
            }
        } catch (Exception e) {
            System.err.println("Unsplash proxy error: " + e.getMessage());
            e.printStackTrace();
            return "{\"results\":[]}";
        }
    }
}
