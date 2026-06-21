package br.com.edudocsai.service.lessonplan;

import br.com.edudocsai.dto.document.GenerateDocumentRequest;
import br.com.edudocsai.entity.DocumentType;
import br.com.edudocsai.exception.BadRequestException;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class LessonPlanRequestValidator {

    private static final Pattern MINUTES_PATTERN = Pattern.compile("(\\d{1,3})");
    private static final int MIN_TOTAL_MINUTES = 30;
    private static final int MAX_TOTAL_MINUTES = 70;

    public LessonPlanRequestContext validate(GenerateDocumentRequest request) {
        if (request.documentType() != DocumentType.LESSON_PLAN) {
            throw new BadRequestException("Validador de plano de aula recebeu tipo de documento invalido");
        }
        List<Long> bnccSkillIds = request.bnccSkillIds();
        if (bnccSkillIds == null || bnccSkillIds.isEmpty()) {
            throw new BadRequestException("Selecione ao menos uma habilidade BNCC");
        }
        String topic = required(request.topic(), "Tema e obrigatorio para plano de aula");
        String grade = required(request.grade(), "Ano escolar e obrigatorio para plano de aula");
        String subject = required(request.subject(), "Disciplina e obrigatoria para plano de aula");
        String durationText = required(request.duration(), "Duracao e obrigatoria para plano de aula");
        int totalMinutes = parseMinutes(durationText);
        if (totalMinutes < MIN_TOTAL_MINUTES || totalMinutes > MAX_TOTAL_MINUTES) {
            throw new BadRequestException("Duracao deve permitir introducao, desenvolvimento e fechamento entre 30 e 70 minutos");
        }
        return new LessonPlanRequestContext(
                request.documentType(),
                bnccSkillIds,
                topic,
                grade,
                subject,
                durationText,
                totalMinutes,
                blankToNull(request.additionalInstructions())
        );
    }

    private int parseMinutes(String durationText) {
        Matcher matcher = MINUTES_PATTERN.matcher(durationText);
        if (!matcher.find()) {
            throw new BadRequestException("Duracao deve informar minutos");
        }
        return Integer.parseInt(matcher.group(1));
    }

    private String required(String value, String message) {
        if (value == null || value.isBlank()) {
            throw new BadRequestException(message);
        }
        return value.trim();
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
