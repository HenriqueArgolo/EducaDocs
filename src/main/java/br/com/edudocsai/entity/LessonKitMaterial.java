package br.com.edudocsai.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.OffsetDateTime;

@Getter @Setter @Builder
@Entity @Table(name = "lesson_kit_materials")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
public class LessonKitMaterial {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "lesson_kit_id", nullable = false)
    private LessonKit kit;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private LessonKitMaterialType type;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private LessonKitMaterialStatus status;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(length = 500)
    private String generationError;

    @Version
    private Long version;

    @Column(nullable = false)
    private OffsetDateTime createdAt;

    @Column(nullable = false)
    private OffsetDateTime updatedAt;

    @PrePersist void prePersist() {
        OffsetDateTime now = OffsetDateTime.now();
        if (content == null) content = "{}";
        if (createdAt == null) createdAt = now;
        if (updatedAt == null) updatedAt = now;
    }

    @PreUpdate void preUpdate() { updatedAt = OffsetDateTime.now(); }
}
