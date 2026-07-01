package br.com.edudocsai.service;

import br.com.edudocsai.dto.bncc.BNCCSkillRequest;
import br.com.edudocsai.dto.bncc.BNCCSkillResponse;
import br.com.edudocsai.dto.bncc.RecommendBNCCRequest;
import br.com.edudocsai.dto.bncc.RecommendBNCCResponse;
import br.com.edudocsai.entity.BNCCSkill;
import br.com.edudocsai.exception.BadRequestException;
import br.com.edudocsai.exception.ConflictException;
import br.com.edudocsai.exception.NotFoundException;
import br.com.edudocsai.repository.BNCCSkillRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class BNCCService {

    private final BNCCSkillRepository bnccSkillRepository;
    private final AIService aiService;
    private final PromptModuleCatalog promptModuleCatalog;

    @Cacheable(cacheNames = "bnccQuery", key = "{#grade, #subject, #code}")
    @Transactional(readOnly = true)
    public List<BNCCSkillResponse> find(String grade, String subject, String code) {
        List<BNCCSkill> skills;
        if (hasText(code) && hasText(grade) && hasText(subject)) {
            skills = bnccSkillRepository.findByGradeIgnoreCaseAndSubjectIgnoreCaseAndCodeIgnoreCase(
                    grade.trim(),
                    subject.trim(),
                    code.trim()
            );
        } else if (hasText(grade) && hasText(subject)) {
            skills = bnccSkillRepository.findByGradeIgnoreCaseAndSubjectIgnoreCase(grade.trim(), subject.trim());
        } else if (hasText(code)) {
            skills = bnccSkillRepository.findByCodeIgnoreCase(code.trim()).stream().toList();
        } else {
            skills = bnccSkillRepository.findAll();
        }
        return skills.stream().map(this::toResponse).toList();
    }

    @Cacheable(cacheNames = "bnccById", key = "#id")
    @Transactional(readOnly = true)
    public BNCCSkillResponse getById(Long id) {
        return bnccSkillRepository.findById(id)
                .map(this::toResponse)
                .orElseThrow(() -> new NotFoundException("Habilidade BNCC nao encontrada"));
    }

    @Transactional(readOnly = true)
    public List<BNCCSkill> validateAndLoad(List<Long> ids) {
        Set<Long> uniqueIds = new LinkedHashSet<>(ids);
        List<BNCCSkill> skills = bnccSkillRepository.findAllById(uniqueIds);
        Set<Long> foundIds = skills.stream().map(BNCCSkill::getId).collect(java.util.stream.Collectors.toSet());
        List<Long> missingIds = uniqueIds.stream()
                .filter(id -> !foundIds.contains(id))
                .toList();
        if (!missingIds.isEmpty()) {
            throw new BadRequestException("IDs BNCC invalidos: " + missingIds);
        }
        return uniqueIds.stream()
                .map(id -> skills.stream()
                        .filter(skill -> skill.getId().equals(id))
                        .findFirst()
                        .orElseThrow())
                .toList();
    }

    @CacheEvict(cacheNames = {"bnccQuery", "bnccById"}, allEntries = true)
    @Transactional
    public List<BNCCSkillResponse> createAll(List<BNCCSkillRequest> requests) {
        List<BNCCSkill> skills = requests.stream().map(this::toEntity).toList();
        for (BNCCSkill skill : skills) {
            if (bnccSkillRepository.existsByCodeIgnoreCase(skill.getCode())) {
                throw new ConflictException("Codigo BNCC ja cadastrado: " + skill.getCode());
            }
        }
        return bnccSkillRepository.saveAll(skills).stream().map(this::toResponse).toList();
    }

    public BNCCSkillResponse toResponse(BNCCSkill skill) {
        return new BNCCSkillResponse(
                skill.getId(),
                skill.getCode(),
                skill.getDescription(),
                skill.getSubject(),
                skill.getGrade()
        );
    }

    private BNCCSkill toEntity(BNCCSkillRequest request) {
        return BNCCSkill.builder()
                .code(request.code().trim().toUpperCase())
                .description(request.description().trim())
                .subject(request.subject().trim())
                .grade(request.grade().trim())
                .build();
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }

    @Transactional(readOnly = true)
    public RecommendBNCCResponse recommendSkills(RecommendBNCCRequest request) {
        List<BNCCSkill> candidates = findRecommendationCandidates(request.grade(), request.subject());

        if (candidates.isEmpty()) {
            return new RecommendBNCCResponse(List.of());
        }

        StringBuilder skillsBuilder = new StringBuilder();
        for (BNCCSkill skill : candidates) {
            skillsBuilder.append("ID: ").append(skill.getId())
                    .append(" | Código: ").append(skill.getCode())
                    .append(" | Descrição: ").append(skill.getDescription())
                    .append("\n");
        }

        String template = promptModuleCatalog.getPromptByKey("bncc_recommendation_prompt");
        String prompt = template.formatted(request.topic(), request.subject(), request.grade(), skillsBuilder.toString());

        try {
            String jsonResult = aiService.generateJsonObject(prompt);
            
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            com.fasterxml.jackson.databind.JsonNode root = mapper.readTree(jsonResult);
            com.fasterxml.jackson.databind.JsonNode recommendedNode = root.path("recommendedIds");
            
            List<Long> recommendedIds = new java.util.ArrayList<>();
            if (recommendedNode.isArray()) {
                for (com.fasterxml.jackson.databind.JsonNode node : recommendedNode) {
                    recommendedIds.add(node.asLong());
                }
            }
            
            Set<Long> candidateIds = candidates.stream()
                    .map(BNCCSkill::getId)
                    .collect(java.util.stream.Collectors.toSet());
            
            List<Long> verifiedIds = recommendedIds.stream()
                    .filter(candidateIds::contains)
                    .toList();
            
            return new RecommendBNCCResponse(verifiedIds);
        } catch (Exception e) {
            return new RecommendBNCCResponse(List.of());
        }
    }

    private List<BNCCSkill> findRecommendationCandidates(String grade, String subject) {
        String requestedGrade = grade.trim();
        String requestedSubject = subject.trim();
        List<BNCCSkill> candidates = bnccSkillRepository.findByGradeIgnoreCaseAndSubjectIgnoreCase(
                requestedGrade,
                requestedSubject
        );

        if (!candidates.isEmpty()) {
            return candidates;
        }

        String normalizedGrade = normalizeGradeForBncc(requestedGrade);
        String normalizedSubject = normalizeSubjectForBncc(requestedSubject);
        if (normalizedGrade.equals(requestedGrade) && normalizedSubject.equals(requestedSubject)) {
            return candidates;
        }

        return bnccSkillRepository.findByGradeIgnoreCaseAndSubjectIgnoreCase(
                normalizedGrade,
                normalizedSubject
        );
    }

    private String normalizeGradeForBncc(String grade) {
        String canonical = canonicalize(grade);
        if (canonical.contains("ensino medio")) {
            return "Ensino Médio";
        }

        java.util.regex.Matcher matcher = java.util.regex.Pattern.compile("\\b([1-9])\\b").matcher(canonical);
        if (matcher.find() && canonical.contains("ano")) {
            return matcher.group(1) + "º ano";
        }

        return grade;
    }

    private String normalizeSubjectForBncc(String subject) {
        return switch (canonicalize(subject)) {
            case "portugues", "lingua portuguesa" -> "Língua Portuguesa";
            case "matematica" -> "Matemática";
            case "ciencias" -> "Ciências";
            case "historia" -> "História";
            case "geografia" -> "Geografia";
            case "arte" -> "Arte";
            case "educacao fisica" -> "Educação Física";
            case "ensino religioso" -> "Ensino Religioso";
            case "linguagens", "linguagens e suas tecnologias" -> "Linguagens e suas Tecnologias";
            case "matematica e suas tecnologias" -> "Matemática e suas Tecnologias";
            case "ciencias da natureza", "ciencias da natureza e suas tecnologias" -> "Ciências da Natureza e suas Tecnologias";
            case "ciencias humanas", "ciencias humanas e sociais aplicadas" -> "Ciências Humanas e Sociais Aplicadas";
            default -> subject;
        };
    }

    private String canonicalize(String value) {
        String withoutAccents = Normalizer.normalize(value.trim(), Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "");
        return withoutAccents
                .replace("º", "")
                .replace("ª", "")
                .toLowerCase(java.util.Locale.ROOT)
                .replaceAll("\\s+", " ")
                .trim();
    }
}
