package br.com.edudocsai.repository;

import br.com.edudocsai.entity.Presentation;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface PresentationRepository extends JpaRepository<Presentation, Long> {

    Page<Presentation> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    @Cacheable(cacheNames = "presentationsList", key = "{#userId, #search, #pageable.pageNumber, #pageable.pageSize}")
    @Query("SELECT p FROM Presentation p WHERE p.user.id = :userId AND " +
           "(CAST(:search AS string) IS NULL OR LOWER(p.title) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')) OR LOWER(p.topic) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')))")
    Page<Presentation> searchPresentations(
            @Param("userId") Long userId,
            @Param("search") String search,
            Pageable pageable
    );

    @Override
    @CacheEvict(cacheNames = "presentationsList", allEntries = true)
    <S extends Presentation> S save(S entity);

    @Override
    @CacheEvict(cacheNames = "presentationsList", allEntries = true)
    void delete(Presentation entity);
}
