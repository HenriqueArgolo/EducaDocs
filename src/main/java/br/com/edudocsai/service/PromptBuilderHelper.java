package br.com.edudocsai.service;
import java.text.Normalizer;
import java.util.Locale;
import org.springframework.stereotype.Component;

@Component
public class PromptBuilderHelper {

    private final PromptModuleCatalog promptModuleCatalog;

    public PromptBuilderHelper() {
        this.promptModuleCatalog = new PromptModuleCatalog();
    }

    public PromptBuilderHelper(PromptModuleCatalog promptModuleCatalog) {
        this.promptModuleCatalog = promptModuleCatalog;
    }

    public enum GradeLevel {
        INFANTIL,
        FUNDAMENTAL_1_ANO,   // 1º ano: alfabetização inicial — persona exclusiva
        FUNDAMENTAL_INICIAIS, // 2º ao 5º ano
        FUNDAMENTAL_FINAIS,   // 6º ao 9º ano
        ENSINO_MEDIO,
        EJA
    }

    /**
     * Classifica o ano escolar informado em um GradeLevel.
     * A normalização remove acentos e converte para minúsculas para garantir
     * compatibilidade com qualquer formato de entrada do usuário.
     */
    public GradeLevel classifyGrade(String grade) {
        if (grade == null || grade.isBlank()) {
            return GradeLevel.FUNDAMENTAL_INICIAIS;
        }

        // Normalização robusta: remove acentos, converte para minúsculas,
        // substitui caracteres ordinais (º/ª/°) por 'o'/'a'
        String normalized = Normalizer.normalize(grade, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .toLowerCase(Locale.ROOT)
                .replace('º', 'o')
                .replace('ª', 'a')
                .replace('°', 'o');

        // EJA — verificar antes de qualquer número para evitar falsos positivos
        if (normalized.contains("eja")
                || normalized.contains("jovens e adultos")
                || normalized.contains("educacao de jovens")
                || normalized.contains("adultos")) {
            return GradeLevel.EJA;
        }

        // Ensino Médio
        if (normalized.contains("medio")
                || normalized.contains("medias")
                || normalized.contains("e.m.")
                || normalized.matches(".*\\b[123](o|a)?\\s*(serie|ano)\\s*(do\\s*)?ensino\\s*medio.*")
                || normalized.matches(".*ensino\\s*medio.*")) {
            return GradeLevel.ENSINO_MEDIO;
        }

        // Educação Infantil
        if (normalized.contains("infantil")
                || normalized.contains("creche")
                || normalized.contains("bebe")
                || normalized.contains("criancas bem pequenas")
                || normalized.contains("criancas pequenas")
                || normalized.contains("maternal")
                || normalized.contains("jardim")
                || normalized.contains("pre-escola")
                || normalized.contains("pre escola")
                || normalized.matches(".*\\bpre\\b.*")) {
            return GradeLevel.INFANTIL;
        }

        // Anos Finais do Fundamental (6º ao 9º) — verificar ANTES dos Anos Iniciais
        // para evitar que "6" seja capturado pelo fallback numérico de Iniciais
        if (normalized.matches(".*\\b[6789](o|a)?\\s*(ano|serie).*")
                || normalized.contains("6o ano") || normalized.contains("7o ano")
                || normalized.contains("8o ano") || normalized.contains("9o ano")) {
            return GradeLevel.FUNDAMENTAL_FINAIS;
        }

        // 1º Ano — persona exclusiva de alfabetização inicial
        // Deve ser verificado ANTES do bloco geral de Anos Iniciais
        if (EarlyLiteracySupport.isInitialLiteracyGrade(grade)) {
            return GradeLevel.FUNDAMENTAL_1_ANO;
        }

        // Anos Iniciais do Fundamental (2º ao 5º)
        if (normalized.matches(".*\\b[2345](o|a)?\\s*(ano|serie).*")
                || normalized.contains("alfabetiza")
                || normalized.contains("anos iniciais")
                || normalized.contains("fundamental i")) {
            return GradeLevel.FUNDAMENTAL_INICIAIS;
        }

        // Fallback numérico seguro: apenas dígitos isolados
        if (normalized.matches(".*\\b[6789]\\b.*")) {
            return GradeLevel.FUNDAMENTAL_FINAIS;
        }
        if (normalized.matches(".*\\b[12345]\\b.*")) {
            return GradeLevel.FUNDAMENTAL_INICIAIS;
        }

        return GradeLevel.FUNDAMENTAL_INICIAIS;
    }

    public String getBasePrompt() {
        return promptModuleCatalog.getPromptByKey("base_prompt");
    }

    public String getPersonaPrompt(GradeLevel level) {
        return promptModuleCatalog.getPromptByKey("persona_" + level.name().toLowerCase());
    }

    public String getInclusionPrompt(String needsText) {
        if (needsText == null || needsText.isBlank()) {
            return "";
        }
        StringBuilder inclusionBuilder = new StringBuilder();
        inclusionBuilder.append(promptModuleCatalog.getPromptByKey("inclusion_header"));
        inclusionBuilder.append(promptModuleCatalog.getPromptByKey("inclusion_dua_principles"));

        String normalized = needsText.toLowerCase();
        boolean hasAny = false;

        if (normalized.contains("autismo") || normalized.contains("tea") || normalized.contains("autista")) {
            hasAny = true;
            inclusionBuilder.append(promptModuleCatalog.getPromptByKey("inclusion_strategy_autismo"));
        }

        if (normalized.contains("tdah") || normalized.contains("hiperativ") || normalized.contains("atenção") || normalized.contains("atencao")) {
            hasAny = true;
            inclusionBuilder.append(promptModuleCatalog.getPromptByKey("inclusion_strategy_tdah"));
        }

        if (normalized.contains("dislex") || normalized.contains("disléx")) {
            hasAny = true;
            inclusionBuilder.append(promptModuleCatalog.getPromptByKey("inclusion_strategy_dislexia"));
        }

        if (normalized.contains("discalcul")) {
            hasAny = true;
            inclusionBuilder.append(promptModuleCatalog.getPromptByKey("inclusion_strategy_discalculia"));
        }

        if (normalized.contains("visual") || normalized.contains("ceg") || normalized.contains("baixa visão") || normalized.contains("baixa visao")) {
            hasAny = true;
            inclusionBuilder.append(promptModuleCatalog.getPromptByKey("inclusion_strategy_visual"));
        }

        if (normalized.contains("auditiv") || normalized.contains("surd") || normalized.contains("libras") || normalized.contains("perda auditiva")) {
            hasAny = true;
            inclusionBuilder.append(promptModuleCatalog.getPromptByKey("inclusion_strategy_auditivo"));
        }

        if (!hasAny) {
            inclusionBuilder.append("\n**Necessidades específicas informadas:**\n");
            inclusionBuilder.append("- ").append(needsText).append("\n");
        }

        return inclusionBuilder.toString();
    }
}
