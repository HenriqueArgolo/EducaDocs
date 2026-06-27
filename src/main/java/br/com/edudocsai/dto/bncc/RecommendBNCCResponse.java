package br.com.edudocsai.dto.bncc;

import java.util.List;

public record RecommendBNCCResponse(
        List<Long> recommendedIds
) {}
