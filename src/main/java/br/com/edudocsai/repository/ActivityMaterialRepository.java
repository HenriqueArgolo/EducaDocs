package br.com.edudocsai.repository;

import br.com.edudocsai.entity.ActivityMaterial;
import br.com.edudocsai.entity.ActivityType;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface ActivityMaterialRepository extends JpaRepository<ActivityMaterial, Long> {

    @Cacheable(cacheNames = "activitiesList", key = "{#userId, #type, #grade, #subject, #search, #pageable.pageNumber, #pageable.pageSize}")
    @Query("SELECT am FROM ActivityMaterial am WHERE " +
           "(am.isPublic = true OR (am.user IS NOT NULL AND am.user.id = :userId)) AND " +
           "(:type IS NULL OR am.type = :type) AND " +
           "(CAST(:grade AS string) IS NULL OR LOWER(am.grade) = LOWER(CAST(:grade AS string))) AND " +
           "(CAST(:subject AS string) IS NULL OR LOWER(am.subject) = LOWER(CAST(:subject AS string))) AND " +
           "(CAST(:search AS string) IS NULL OR LOWER(am.title) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')) OR LOWER(am.description) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')))")
    Page<ActivityMaterial> searchMaterials(
            @Param("userId") Long userId,
            @Param("type") ActivityType type,
            @Param("grade") String grade,
            @Param("subject") String subject,
            @Param("search") String search,
            Pageable pageable
    );

    @Query("SELECT am.pdfFile FROM ActivityMaterial am WHERE am.id = :id")
    java.util.Optional<byte[]> findPdfFileById(@Param("id") Long id);

    @Override
    @CacheEvict(cacheNames = "activitiesList", allEntries = true)
    <S extends ActivityMaterial> S save(S entity);

    @Override
    @CacheEvict(cacheNames = "activitiesList", allEntries = true)
    void delete(ActivityMaterial entity);
}
