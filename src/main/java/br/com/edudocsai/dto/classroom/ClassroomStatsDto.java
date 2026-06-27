package br.com.edudocsai.dto.classroom;

import java.util.List;

public record ClassroomStatsDto(
    int totalResourcesLinked,
    int completedResources,
    int pendingResources,
    List<String> bnccSkillsAddressed
) {}
