package br.com.edudocsai.service;

import br.com.edudocsai.dto.bncc.BNCCSkillRequest;
import br.com.edudocsai.dto.bncc.BNCCSkillResponse;
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

import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class BNCCService {

    private final BNCCSkillRepository bnccSkillRepository;

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
}
