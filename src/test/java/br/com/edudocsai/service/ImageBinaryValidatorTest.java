package br.com.edudocsai.service;

import org.junit.jupiter.api.Test;

import javax.imageio.ImageIO;
import java.awt.BasicStroke;
import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;

import static org.assertj.core.api.Assertions.assertThat;

class ImageBinaryValidatorTest {

    private final ImageBinaryValidator validator = new ImageBinaryValidator();

    @Test
    void acceptsCenteredBlackOutlineOnWhiteBackground() throws Exception {
        BufferedImage image = whiteCanvas();
        Graphics2D graphics = image.createGraphics();
        graphics.setColor(Color.BLACK);
        graphics.setStroke(new BasicStroke(8));
        graphics.drawOval(110, 100, 292, 300);
        graphics.dispose();

        ImageBinaryValidator.ValidationResult result = validator.validate("image/png", png(image));

        assertThat(result.approved()).isTrue();
        assertThat(result.width()).isEqualTo(512);
        assertThat(result.height()).isEqualTo(512);
    }

    @Test
    void rejectsBlankWhiteImage() throws Exception {
        ImageBinaryValidator.ValidationResult result = validator.validate("image/png", png(whiteCanvas()));

        assertThat(result.approved()).isFalse();
        assertThat(result.reason()).containsIgnoringCase("vazia");
    }

    @Test
    void rejectsDrawingThatOccupiesThePageEdges() throws Exception {
        BufferedImage image = whiteCanvas();
        Graphics2D graphics = image.createGraphics();
        graphics.setColor(Color.BLACK);
        graphics.setStroke(new BasicStroke(20));
        graphics.drawRect(0, 0, 511, 511);
        graphics.drawLine(0, 0, 511, 511);
        graphics.dispose();

        ImageBinaryValidator.ValidationResult result = validator.validate("image/png", png(image));

        assertThat(result.approved()).isFalse();
        assertThat(result.reason()).containsIgnoringCase("borda");
    }

    @Test
    void rejectsUnsupportedMimeType() throws Exception {
        ImageBinaryValidator.ValidationResult result = validator.validate("image/svg+xml", png(whiteCanvas()));

        assertThat(result.approved()).isFalse();
        assertThat(result.reason()).containsIgnoringCase("formato");
    }

    private BufferedImage whiteCanvas() {
        BufferedImage image = new BufferedImage(512, 512, BufferedImage.TYPE_INT_RGB);
        Graphics2D graphics = image.createGraphics();
        graphics.setColor(Color.WHITE);
        graphics.fillRect(0, 0, 512, 512);
        graphics.dispose();
        return image;
    }

    private byte[] png(BufferedImage image) throws Exception {
        ByteArrayOutputStream output = new ByteArrayOutputStream();
        ImageIO.write(image, "png", output);
        return output.toByteArray();
    }
}
