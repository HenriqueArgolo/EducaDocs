package br.com.edudocsai.service;

import br.com.edudocsai.entity.PlanningPeriod;
import br.com.edudocsai.service.PromptBuilderHelper.GradeLevel;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;
import org.springframework.util.StreamUtils;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.text.Normalizer;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class PromptModuleCatalog {

    private final ObjectMapper objectMapper;
    private final Map<String, String> prompts = new ConcurrentHashMap<>();

    public PromptModuleCatalog() {
        this(new ObjectMapper());
    }

    public PromptModuleCatalog(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @PostConstruct
    public void init() {
        try {
            ClassPathResource resource = new ClassPathResource("prompts/prompts_catalog.json");
            String json = StreamUtils.copyToString(resource.getInputStream(), StandardCharsets.UTF_8);
            Map<String, String> map = objectMapper.readValue(json, new TypeReference<Map<String, String>>() {});
            prompts.putAll(map);
        } catch (IOException e) {
            throw new RuntimeException("Erro ao carregar catálogo central de prompts", e);
        }
    }

    private String loadPrompt(String path) {
        if (prompts.isEmpty()) {
            init();
        }
        String key = path;
        if (path.endsWith(".txt")) {
            key = path.substring(0, path.length() - 4);
        }

        String prompt = prompts.get(key);
        if (prompt == null) {
            throw new RuntimeException("Prompt não encontrado no catálogo: " + key);
        }
        return prompt;
    }


    public String basePrompt() {
        return loadPrompt("base_prompt.txt");
    }

    public String lessonKitTaskPrompt() {
        return loadPrompt("lesson_kit_task.txt");
    }


    public String personaPrompt(GradeLevel level) {
        return personaPrompt(level, null);
    }

    public String personaPrompt(GradeLevel level, String grade) {
        String basePersona = loadPrompt("persona_" + level.name().toLowerCase() + ".txt");
        return basePersona + gradeSpecificGuidelines(grade);
    }

    public String assessmentTaskPrompt(GradeLevel level, int numberOfQuestions) {
        return assessmentTaskPrompt(level, null, numberOfQuestions);
    }

    public String assessmentTaskPrompt(GradeLevel level, String grade, int numberOfQuestions) {
        if (level == GradeLevel.INFANTIL) {
            return earlyChildhoodObservationPrompt();
        }
        if (EarlyLiteracySupport.isInitialLiteracyGrade(grade)) {
            return initialLiteracyAssessmentPrompt(numberOfQuestions);
        }
        return loadPrompt("assessment_task.txt").formatted(
                numberOfQuestions,
                assessmentGuidance(level),
                alternativesExample(level)
        );
    }

    private String initialLiteracyAssessmentPrompt(int numberOfQuestions) {
        int activityCount = Math.max(4, Math.min(numberOfQuestions, 6));
        return loadPrompt("initial_literacy_assessment.txt").formatted(
                activityCount,
                EarlyLiteracySupport.allowedFiguresForPrompt(),
                EarlyLiteracySupport.allowedActivityTypesForPrompt()
        );
    }

    public String rubricTaskPrompt(GradeLevel level) {
        return loadPrompt("rubric_task.txt").formatted(rubricGuidance(level));
    }

    public String reportTaskPrompt(GradeLevel level) {
        return loadPrompt("report_task.txt").formatted(reportGuidance(level));
    }

    public String lessonPlanTaskGuidance(GradeLevel level, PlanningPeriod period) {
        return lessonPlanTaskGuidance(level, period, null);
    }

    public String lessonPlanTaskGuidance(GradeLevel level, PlanningPeriod period, String grade) {
        String periodGuidance = "";
        if (period == PlanningPeriod.WEEKLY) {
            periodGuidance = "\n- **ATENÇÃO: PLANO SEMANAL.** O planejamento deve ser distribuído ao longo de 5 dias letivos (Segunda a Sexta), garantindo progressão e continuidade do tema ao longo da semana.";
        } else if (period == PlanningPeriod.MONTHLY) {
            periodGuidance = "\n- **ATENÇÃO: PLANO MENSAL.** O planejamento deve ser distribuído em 4 semanas, com um projeto ou objetivo de longo prazo que conecte as aulas, aprofundando o tema gradualmente.";
        }

        String baseGuidance = loadPrompt("lesson_plan_task_" + level.name().toLowerCase() + ".txt").formatted(periodGuidance);
        
        String specificGuidelines = gradeSpecificGuidelines(grade);
        if (!specificGuidelines.isEmpty()) {
            return baseGuidance + "\n\nAdicionalmente, observe estas orientações pedagógicas específicas para a série:\n" + specificGuidelines;
        }
        return baseGuidance;
    }

    private String assessmentGuidance(GradeLevel level) {
        if (level == GradeLevel.INFANTIL) {
            throw new IllegalArgumentException("Educação Infantil não utiliza provas formais. Use o gerador de Relatórios ou Rubricas de Observação.");
        }
        return loadPrompt("assessment_guidance_" + level.name().toLowerCase() + ".txt");
    }

    private String rubricGuidance(GradeLevel level) {
        return loadPrompt("rubric_guidance_" + level.name().toLowerCase() + ".txt");
    }

    private String reportGuidance(GradeLevel level) {
        return loadPrompt("report_guidance_" + level.name().toLowerCase() + ".txt");
    }

    private String alternativesExample(GradeLevel level) {
        return switch (level) {
            case FUNDAMENTAL_1_ANO, FUNDAMENTAL_INICIAIS -> "[\"a) ...\", \"b) ...\", \"c) ...\"]";
            case FUNDAMENTAL_FINAIS, ENSINO_MEDIO -> "[\"a) ...\", \"b) ...\", \"c) ...\", \"d) ...\", \"e) ...\"]";
            case EJA -> "[\"a) ...\", \"b) ...\", \"c) ...\", \"d) ...\"]";
            case INFANTIL -> "[]";
        };
    }

    private String earlyChildhoodObservationPrompt() {
        return loadPrompt("early_childhood_observation.txt");
    }

    private String gradeSpecificGuidelines(String grade) {
        if (grade == null || grade.isBlank()) {
            return "";
        }
        String normalized = Normalizer.normalize(grade, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .toLowerCase(Locale.ROOT)
                .replace('º', 'o')
                .replace('ª', 'a')
                .replace('°', 'o');

        if (normalized.contains("1") || normalized.contains("primeiro") || normalized.contains("1o")) {
            return """
                
                **Diretrizes Específicas do 1º Ano (Baseadas no comportamento real do ano escolar):**
                - **Foco Pedagógico**: Alfabetização inicial e letramento; consciência fonológica (identificação de fonemas, rimas e aliterações); relação fonema-grafema (correspondência de sons e letras); escrita espontânea e lúdica; contagem de coleções concretas até 100; leitura e ordenação de números em sequência numérica.
                - **Pontos de Dificuldade comuns (Struggle Points)**: Turmas muito heterogêneas com diferentes hipóteses de escrita (alunos pré-silábicos, silábicos com ou sem valor sonoro); confusão entre letras e números; dificuldade de concentração em explicações longas; insegurança na escrita autônoma.
                - **Estratégias de Intervenção/Dinâmicas**: Agrupamentos produtivos de alunos em diferentes níveis de hipótese de escrita; uso sistemático de letras móveis e crachás de nomes; jogos cantados, cantigas e rimas para consciência fonológica; contagem física de objetos reais da sala de aula.
                """;
        }

        if (normalized.contains("2") || normalized.contains("segundo")) {
            return """
                
                **Diretrizes Específicas do 2º Ano (Baseadas no comportamento real do ano escolar):**
                - **Foco Pedagógico**: Consolidação da alfabetização e letramento; escrita de palavras e frases simples com foco em dificuldades ortográficas recorrentes (ex: c/qu, g/gu, r/rr, s/ss); leitura compartilhada com foco em antecipação de informações usando imagens; introdução a conceitos matemáticos com suporte visual (formas geométricas planas, problemas de adição/subtração simples).
                - **Pontos de Dificuldade comuns (Struggle Points)**: Alunos com dificuldades em oralizar as impressões da leitura, timidez nas discussões coletivas ou dispersão rápida durante atividades de leitura.
                - **Estratégias de Intervenção/Dinâmicas**: Rodas de leitura regulares com mediação próxima; jogos pedagógicos (ex: bingo de palavras, jogos de trilha); uso abundante de materiais concretos.
                """;
        }
        if (normalized.contains("3") || normalized.contains("terceiro")) {
            return """
                
                **Diretrizes Específicas do 3º Ano (Baseadas no comportamento real do ano escolar):**
                - **Foco Pedagógico**: Transição para leitura autônoma; introdução a classes de palavras (substantivos para nomear, adjetivos para caracterizar, verbos para exprimir ação); estudo da sílaba tônica; resolução de problemas de multiplicação e divisão através de estratégias pessoais (desenhos, agrupamentos); leitura e interpretação de poemas visuais e fábulas.
                - **Pontos de Dificuldade comuns (Struggle Points)**: Heterogeneidade na turma, com alunos que ainda não leem ou escrevem convencionalmente; dificuldades em compreender a transição de adições repetidas para a multiplicação.
                - **Estratégias de Intervenção/Dinâmicas**: Atividades de produção coletiva e escrita compartilhada; leitura dramatizada de fábulas; representação visual de problemas matemáticos (desenhos e agrupamentos concretos).
                """;
        }
        if (normalized.contains("4") || normalized.contains("quarto")) {
            return """
                
                **Diretrizes Específicas do 4º Ano (Baseadas no comportamento real do ano escolar):**
                - **Foco Pedagógico**: Leitura autônoma fluida de gêneros informativos; estudo de regras ortográficas mais complexas (acentuação, som do H); interpretação de notícias e identificação de notícias falsas (fake news); introdução ao conceito de frações unitárias; sistema de numeração decimal até dezenas de milhar; classificação de sólidos (prismas e pirâmides).
                - **Pontos de Dificuldade comuns (Struggle Points)**: Dificuldade em manusear dicionários de forma eficiente; dificuldade em diferenciar fatos de opiniões ou identificar sensacionalismo em mídias digitais.
                - **Estratégias de Intervenção/Dinâmicas**: Laboratório de mídias (análise de manchetes reais); uso de planificações de sólidos geométricos dobráveis; resolução de situações-problema utilizando as quatro operações fundamentais.
                """;
        }
        if (normalized.contains("5") || normalized.contains("quinto")) {
            return """
                
                **Diretrizes Específicas do 5º Ano (Baseadas no comportamento real do ano escolar):**
                - **Foco Pedagógico**: Interpretação e produção de crônicas e artigos de divulgação científica; leitura crítica e ampliação de vocabulário; operações com números racionais (frações e números decimais); problemas de proporcionalidade direta e indireta; anatomia e integração dos sistemas do corpo humano (digestório, respiratório, circulatório e urinário); conscientização ecológica (reutilização e reciclagem).
                - **Pontos de Dificuldade comuns (Struggle Points)**: Barreiras de vocabulário ao ler textos literários (crônicas) ou científicos com termos rebuscados; confusão entre conceitos de fração e divisão tradicional.
                - **Estratégias de Intervenção/Dinâmicas**: Criação de glossários colaborativos da turma; atividades de rotação por estações ou laboratórios práticos (ex: maquetes dos sistemas do corpo); investigação de embalagens reais para analisar materiais recicláveis.
                """;
        }
        if (normalized.contains("6") || normalized.contains("sexto")) {
            return """
                
                **Diretrizes Específicas do 6º Ano (Baseadas no comportamento real do ano escolar):**
                - **Foco Pedagógico**: Compreensão das fontes históricas e noções de tempo; estudo da Pré-História e Antiguidade Clássica; introdução à biologia celular (organelas, tipos celulares); camadas da Terra e dinâmica da atmosfera; representações de probabilidade; flexão de substantivos para coesão textual.
                - **Pontos de Dificuldade comuns (Struggle Points)**: Dificuldade em fazer conexões entre mídias audiovisuais (vídeos, telejornais) e o texto escrito; complexidade na visualização tridimensional de estruturas invisíveis a olho nu (células e organelas).
                - **Estratégias de Intervenção/Dinâmicas**: Roda de notícias semanal; uso de microscopia ou simulações digitais de células; confecção de modelos tridimensionais das camadas terrestres com massinha.
                """;
        }
        if (normalized.contains("7") || normalized.contains("setimo")) {
            return """
                
                **Diretrizes Específicas do 7º Ano (Baseadas no comportamento real do ano escolar):**
                - **Foco Pedagógico**: Estudo da transição feudal-capitalista, Renascimento e a colonização da América Espanhola; estudo das culturas africanas e indígenas antes da chegada europeia; equações de 1º grau; plano cartesiano e transformações geométricas (simetria, rotação); gêneros literários regionais (literatura de cordel, autobiografia).
                - **Pontos de Dificuldade comuns (Struggle Points)**: Dificuldades em transpor problemas da linguagem natural para a linguagem algébrica (equações); compreensão de perspectivas históricas não eurocêntricas.
                - **Estratégias de Intervenção/Dinâmicas**: Oficinas de xilogravura/cordel; representação espacial de polígonos em malha quadriculada ou softwares de geometria dinâmica; debates históricos estruturados.
                """;
        }
        if (normalized.contains("8") || normalized.contains("oitavo")) {
            return """
                
                **Diretrizes Específicas do 8º Ano (Baseadas no comportamento real do ano escolar):**
                - **Foco Pedagógico**: Análise de processos revolucionários e a formação da República brasileira; conceitos físicos de eletricidade (circuitos elétricos, consumo de energia); reprodução humana, puberdade e gravidez na adolescência; análise sintática (termos essenciais e integrantes da oração) e vozes verbais (ativa e passiva); produção de artigos de opinião e debates.
                - **Pontos de Dificuldade comuns (Struggle Points)**: Desinteresse ou timidez dos adolescentes ao abordar temas de sexualidade ou reprodução; dificuldade em reconhecer e aplicar as nuances de persuasão do artigo de opinião.
                - **Estratégias de Intervenção/Dinâmicas**: Júris simulados e debates formais sobre temas polêmicos da comunidade; montagem prática de circuitos elétricos simples em sala; estudos de caso reais de consumo de energia de eletrodomésticos.
                """;
        }
        if (normalized.contains("9") || normalized.contains("nono")) {
            return """
                
                **Diretrizes Específicas do 9º Ano (Baseadas no comportamento real do ano escolar):**
                - **Foco Pedagógico**: Análise crítica do século XX (Primeira e Segunda Guerra Mundial, Era Vargas, Nazismo e Holocausto); geometria métrica (Teorema de Tales e semelhança de triângulos); grandezas proporcionais e estatística (medidas de tendência central: média, moda e mediana); gêneros persuasivos (propaganda, resenha); variação linguística e combate ao preconceito linguístico.
                - **Pontos de Dificuldade comuns (Struggle Points)**: Dificuldade em diferenciar estratégias comerciais de publicidade (venda de produto) de propaganda ideológica (venda de ideia); barreiras conceituais no tratamento e interpretação crítica de dados estatísticos complexos.
                - **Estratégias de Intervenção/Dinâmicas**: Análise semiótica de anúncios históricos e peças de propaganda de guerra; pesquisas estatísticas reais na escola seguidas de análise de dados; produção de resenhas críticas de obras literárias ou cinematográficas relevantes.
                """;
        }
        return "";
    }

    public String getPromptByKey(String key) {
        return loadPrompt(key);
    }
}
