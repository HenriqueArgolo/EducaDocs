package br.com.edudocsai.repository;

import br.com.edudocsai.entity.Document;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DocumentRepository extends JpaRepository<Document, Long> {

    @Cacheable(cacheNames = "documentsList", key = "{#userId, #pageable.pageNumber, #pageable.pageSize}")
    Page<Document> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    @Override
    @CacheEvict(cacheNames = "documentsList", allEntries = true)
    <S extends Document> S save(S entity);

    @Override
    @CacheEvict(cacheNames = "documentsList", allEntries = true)
    void delete(Document entity);
}
