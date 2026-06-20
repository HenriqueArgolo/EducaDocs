package br.com.edudocsai.repository;

import br.com.edudocsai.entity.GenerationRequest;
import org.springframework.data.jpa.repository.JpaRepository;

public interface GenerationRequestRepository extends JpaRepository<GenerationRequest, Long> {
}
