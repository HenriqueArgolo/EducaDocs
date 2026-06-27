package br.com.edudocsai.repository;

import br.com.edudocsai.entity.GeneratedImageAsset;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface GeneratedImageAssetRepository extends JpaRepository<GeneratedImageAsset, Long> {

    Optional<GeneratedImageAsset> findByCacheKey(String cacheKey);
}

