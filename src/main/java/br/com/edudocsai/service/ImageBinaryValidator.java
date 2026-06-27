package br.com.edudocsai.service;

import org.springframework.stereotype.Component;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.util.Set;

@Component
public class ImageBinaryValidator {

    private static final Set<String> ALLOWED_MIME_TYPES = Set.of("image/png", "image/jpeg", "image/webp");

    public ValidationResult validate(String mimeType, byte[] bytes) {
        if (mimeType == null || !ALLOWED_MIME_TYPES.contains(mimeType.toLowerCase())) {
            return ValidationResult.rejected("Formato de imagem nao permitido");
        }
        if (bytes == null || bytes.length < 100) {
            return ValidationResult.rejected("Arquivo de imagem vazio ou invalido");
        }

        try {
            BufferedImage image = ImageIO.read(new ByteArrayInputStream(bytes));
            if (image == null) {
                return ValidationResult.rejected("Arquivo de imagem nao pode ser decodificado");
            }

            int width = image.getWidth();
            int height = image.getHeight();
            if (width < 384 || height < 384) {
                return ValidationResult.rejected("Imagem menor que a resolucao minima", width, height);
            }

            long total = (long) width * height;
            long dark = 0;
            long light = 0;
            long edgeDark = 0;
            long edgeTotal = 0;
            int edge = Math.max(4, Math.min(width, height) / 50);

            for (int y = 0; y < height; y++) {
                for (int x = 0; x < width; x++) {
                    int rgb = image.getRGB(x, y);
                    int red = (rgb >> 16) & 0xff;
                    int green = (rgb >> 8) & 0xff;
                    int blue = rgb & 0xff;
                    double luminance = (0.2126 * red) + (0.7152 * green) + (0.0722 * blue);
                    boolean isDark = luminance < 150;
                    if (isDark) {
                        dark++;
                    }
                    if (luminance > 235) {
                        light++;
                    }
                    if (x < edge || x >= width - edge || y < edge || y >= height - edge) {
                        edgeTotal++;
                        if (isDark) {
                            edgeDark++;
                        }
                    }
                }
            }

            double darkRatio = dark / (double) total;
            double lightRatio = light / (double) total;
            double edgeDarkRatio = edgeTotal == 0 ? 0 : edgeDark / (double) edgeTotal;

            if (darkRatio < 0.003) {
                return ValidationResult.rejected("Imagem praticamente vazia", width, height);
            }
            if (lightRatio < 0.40 || darkRatio > 0.65) {
                return ValidationResult.rejected("Imagem sem fundo branco adequado", width, height);
            }
            if (edgeDarkRatio > 0.15) {
                return ValidationResult.rejected("Desenho encostado ou cortado na borda", width, height);
            }
            return ValidationResult.approved(width, height);
        } catch (Exception exception) {
            return ValidationResult.rejected("Arquivo de imagem invalido");
        }
    }

    public record ValidationResult(boolean approved, String reason, int width, int height) {

        static ValidationResult approved(int width, int height) {
            return new ValidationResult(true, "ok", width, height);
        }

        static ValidationResult rejected(String reason) {
            return rejected(reason, 0, 0);
        }

        static ValidationResult rejected(String reason, int width, int height) {
            return new ValidationResult(false, reason, width, height);
        }
    }
}

