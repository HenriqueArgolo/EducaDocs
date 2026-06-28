package br.com.edudocsai.entity;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@Builder
@Entity
@Table(name = "generation_requests")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
public class GenerationRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private DocumentType documentType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    @Builder.Default
    private TemplateStyle templateStyle = TemplateStyle.INSTITUTIONAL;

    @ElementCollection
    @CollectionTable(
            name = "generation_request_bncc_skill_ids",
            joinColumns = @JoinColumn(name = "generation_request_id")
    )
    @Column(name = "bncc_skill_id", nullable = false)
    @Builder.Default
    private List<Long> bnccSkillIds = new ArrayList<>();

    @Column(nullable = false, length = 180)
    private String topic;

    @Column(length = 120)
    private String grade;

    @Column(length = 180)
    private String subject;

    @Column(length = 80)
    private String duration;

    @Column(columnDefinition = "TEXT")
    private String additionalInstructions;

    @Column(name = "number_of_questions")
    private Integer numberOfQuestions;

    @Column(name = "include_header")
    private Boolean includeHeader;

    @Enumerated(EnumType.STRING)
    @Column(name = "planning_period", length = 20)
    @Builder.Default
    private PlanningPeriod planningPeriod = PlanningPeriod.SINGLE;

    @Column(nullable = false)
    private OffsetDateTime createdAt;

    @PrePersist
    void prePersist() {
        if (createdAt == null) {
            createdAt = OffsetDateTime.now();
        }
    }
}
