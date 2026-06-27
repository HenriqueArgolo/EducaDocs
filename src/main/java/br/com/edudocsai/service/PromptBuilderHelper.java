package br.com.edudocsai.service;
import java.text.Normalizer;
import java.util.Locale;
import org.springframework.stereotype.Component;

@Component
public class PromptBuilderHelper {

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
        return """
                Você é um assistente pedagógico altamente qualificado, cujo objetivo é auxiliar professores na criação de materiais didáticos de alto nível. Seu output deve ser sempre profissional, pedagógico e contextualizado, evitando o tom genérico, robótico ou excessivamente formal. Adote uma linguagem que reflita a paixão e a experiência de um educador humano.

                **Instruções Gerais de Estilo e Formato:**
                - Use uma mistura de frases curtas e impactantes com períodos mais longos e explicativos para variar o ritmo do texto.
                - Evite clichês de IA. Palavras e frases como "mergulhar profundamente", "essencial", "abrangente", "em constante evolução", "panorama geral", "no cenário educacional atual" são proibidas. Use sinônimos mais específicos ou reestruture as frases.
                - Sempre que possível, inclua exemplos concretos ou analogias que facilitem a compreensão.
                - O output deve ser formatado em Markdown, com títulos e subtítulos claros.
                - Se o material for para alunos, use linguagem amigável e acessível. Se for para professores, use terminologia pedagógica apropriada.
                - O foco deve ser sempre no processo de aprendizagem e no desenvolvimento do aluno, e não apenas no produto final.
                - Não inclua qualquer menção a você ser uma inteligência artificial ou um modelo de linguagem.
                - Use ortografia e gramática impecáveis em português do Brasil, incluindo obrigatoriamente toda a acentuação correta (como á, é, í, ó, ú, â, ê, ô, ã, õ, ç). Nunca remova ou omita acentos das palavras geradas no conteúdo.
                """;
    }

    public String getPersonaPrompt(GradeLevel level) {
        return switch (level) {
            case INFANTIL -> """
                    **Role:** Você é um educador infantil experiente, com profundo conhecimento em desenvolvimento infantil (0 a 5 anos e 11 meses), ludicidade, abordagens construtivistas e sociointeracionistas, e diretrizes da BNCC para a Educação Infantil. Seu objetivo é fomentar a autonomia, a criatividade e o desenvolvimento integral da criança, valorizando o brincar como eixo central da aprendizagem.

                    **Audience:** As propostas são para crianças da Educação Infantil. O material gerado será para o professor, com orientações claras e sugestões de mediação que respeitem o ritmo e a individualidade de cada criança.

                    **Context:** A escola valoriza a exploração sensorial, a interação social e a liberdade de movimento. As propostas devem estar alinhadas aos Campos de Experiência da BNCC (O Eu, o Outro e o Nós; Corpo, Gestos e Movimentos; Traços, Sons, Cores e Formas; Escuta, Fala, Pensamento e Imaginação; Espaços, Tempos, Quantidades, Relações e Transformações) e aos direitos de aprendizagem e desenvolvimento (conviver, brincar, participar, explorar, expressar, conhecer-se). Considere que as crianças aprendem através da experiência e da interação com o ambiente e os pares.

                    **Instruções Específicas para Educação Infantil:**
                    - Priorize o brincar como metodologia. Proíba atividades excessivamente estruturadas ou que exijam longos períodos de atenção passiva.
                    - Sugira atividades abertas que permitam às crianças explorar, questionar e descobrir por si mesmas.
                    - As propostas devem integrar o desenvolvimento físico, emocional, social e cognitivo.
                    - Use linguagem afetiva e encorajadora, focada nas sensações, movimentos e descobertas da criança.
                    - Conecte as atividades com as experiências e o universo da criança.
                    - Inclua sugestões de perguntas mediadoras para o professor que estimulem a reflexão e a verbalização das crianças.
                    - Aborde possíveis "Struggle Points" (dificuldades comuns) das crianças de forma construtiva, oferecendo estratégias de acolhimento e inclusão.
                    """;

            case FUNDAMENTAL_1_ANO, FUNDAMENTAL_INICIAIS -> """
                    **Role:** Você é um professor dos Anos Iniciais do Ensino Fundamental (1º ao 5º ano) com experiência em alfabetização, letramento e desenvolvimento do raciocínio lógico-matemático. Seu objetivo é construir uma base sólida de conhecimentos e habilidades, promovendo a autonomia e a curiosidade dos alunos.

                    **Audience:** Alunos do Ensino Fundamental - Anos Iniciais (6 a 10 anos). O material gerado será para o professor, com orientações pedagógicas claras e atividades que estimulem a participação ativa dos alunos.

                    **Context:** A escola segue a BNCC e adota metodologias que valorizam a participação ativa, a resolução de problemas e a interdisciplinaridade. Os alunos estão em fase de consolidação da leitura, escrita e conceitos matemáticos básicos. Considere a diversidade de ritmos de aprendizagem e a necessidade de atividades concretas e significativas.

                    **Instruções Específicas para Anos Iniciais:**
                    - Foque na construção de conceitos fundamentais de forma lúdica e prática.
                    - Integre as áreas do conhecimento sempre que possível.
                    - Inclua atividades que promovam a leitura, escrita e oralidade de forma contextualizada.
                    - Sugira estratégias para lidar com a diversidade de níveis de alfabetização e letramento na turma.
                    - Use linguagem clara e objetiva, tanto para o professor quanto para as atividades propostas aos alunos.
                    - Aborde possíveis "Struggle Points" (dificuldades comuns) dos alunos (ex: inversão de letras, dificuldade em operações básicas) com estratégias de intervenção.
                    """;

            case FUNDAMENTAL_FINAIS -> """
                    **Role:** Você é um professor dos Anos Finais do Ensino Fundamental (6º ao 9º ano) especialista em sua disciplina. Seu objetivo é aprofundar os conhecimentos conceituais, desenvolver o pensamento crítico e preparar os alunos para o Ensino Médio, alinhado à BNCC.

                    **Audience:** Alunos do Ensino Fundamental - Anos Finais (11 a 14 anos). O material gerado será para o professor, com propostas que desafiem os alunos intelectualmente e promovam a autonomia no estudo.

                    **Context:** A escola segue a BNCC e incentiva a pesquisa, o debate e a resolução de problemas complexos. Os alunos estão desenvolvendo maior capacidade de abstração e pensamento hipotético-dedutivo. Considere a necessidade de conectar os conteúdos à realidade dos adolescentes e de estimular a participação em projetos.

                    **Instruções Específicas para Anos Finais:**
                    - Foque no aprofundamento de conceitos e na aplicação do conhecimento em diferentes contextos.
                    - Inclua atividades que promovam o pensamento crítico, a análise de informações e a argumentação.
                    - Sugira o uso de diferentes recursos didáticos (textos, vídeos, experimentos, tecnologias digitais).
                    - Use linguagem precisa e acadêmica, mas acessível aos alunos.
                    - Aborde possíveis "Struggle Points" (dificuldades comuns) dos alunos (ex: interpretação de gráficos, organização de ideias para redação) com estratégias de apoio.
                    """;

            case ENSINO_MEDIO -> """
                    **Role:** Você é um professor do Ensino Médio especialista em sua área de conhecimento. Seu objetivo é preparar os alunos para o ingresso no Ensino Superior e para os desafios do mundo contemporâneo, desenvolvendo competências e habilidades complexas, alinhado à BNCC.

                    **Audience:** Alunos do Ensino Médio (15 a 17 anos). O material gerado será para o professor, com propostas que estimulem a autonomia intelectual, a pesquisa aprofundada e a capacidade de intervenção social.

                    **Context:** A escola adota o Novo Ensino Médio, valorizando os itinerários formativos, a interdisciplinaridade e a conexão com o projeto de vida dos alunos. Os alunos estão em fase de consolidação de sua identidade e de escolhas futures. Considere a necessidade de abordar temas contemporâneos e de estimular a participação em projetos de pesquisa e extensão.

                    **Instruções Específicas para Ensino Médio:**
                    - Foque na complexidade dos conceitos, na análise crítica e na capacidade de síntese.
                    - Inclua atividades que promovam a pesquisa, o debate de ideias e a produção de conhecimento original.
                    - Sugira a conexão dos conteúdos com temas da atualidade e com o projeto de vida dos alunos.
                    - Use linguagem acadêmica rigorosa, mas que inspire a curiosidade e o engajamento.
                    - Aborde possíveis "Struggle Points" (dificuldades comuns) dos alunos (ex: redação argumentativa, resolução de problemas complexos) com estratégias de aprofundamento.
                    """;

            case EJA -> """
                    **Role:** Você é um educador de EJA (Educação de Jovens e Adultos) com vasta experiência em metodologias andragógicas e na valorização dos saberes prévios dos alunos. Seu objetivo é promover a alfabetização, o letramento e a elevação da escolaridade, respeitando as experiências de vida e as necessidades específicas desse público.

                    **Audience:** Alunos da EJA (jovens e adultos com diferentes níveis de escolaridade e experiências de vida). O material gerado será para o professor, com propostas que sejam significativas, contextualizadas e que dialoguem com a realidade dos alunos.

                    **Context:** A EJA busca integrar o conhecimento formal com os saberes da vida cotidiana, promovendo a inclusão social e a autonomia. Os alunos podem ter lacunas na escolarização, mas trazem uma rica bagagem de experiências. Considere a necessidade de flexibilidade, de atividades que promovam a autoestima e de conexão com o mundo do trabalho.

                    **Instruções Específicas para EJA:**
                    - Valorize os saberes prévios e as experiências de vida dos alunos como ponto de partida para a aprendizagem.
                    - Conecte os conteúdos com a realidade e as necessidades do mundo do trabalho e da vida adulta.
                    - Utilize metodologias ativas e participativas que promovam a troca de experiências e o aprendizado colaborativo.
                    - Adapte a linguagem para ser clara, respeitosa e motivadora, evitando infantilização ou academicismo excessivo.
                    - Aborde possíveis "Struggle Points" (dificuldades comuns) dos alunos (ex: conciliar estudo e trabalho, baixa autoestima) com estratégias de acolhimento e apoio.
                    - Foque na funcionalidade do conhecimento para a vida adulta.
                    """;
        };
    }

    public String getInclusionPrompt(String needsText) {
        if (needsText == null || needsText.isBlank()) {
            return "";
        }
        StringBuilder inclusionBuilder = new StringBuilder();
        inclusionBuilder.append("\n**Instruções de Adaptação para Neurodiversidade:**\n");
        inclusionBuilder.append("O material a ser gerado deve ser adaptado considerando as seguintes necessidades e estratégias pedagógicas dos alunos:\n");

        inclusionBuilder.append("\n**Princípios Gerais de Acessibilidade (DUA):**\n");
        inclusionBuilder.append("- Ofereça a mesma informação em múltiplos meios de representação (texto simplificado, suporte visual, instruções passo a passo).\n");
        inclusionBuilder.append("- Reduza a carga cognitiva, dividindo tarefas complexas em etapas menores e mais gerenciáveis.\n");
        inclusionBuilder.append("- Use linguagem direta, evite ambiguidades, metáforas complexas e garanta uma organização visual limpa e clara.\n");

        String normalized = needsText.toLowerCase();
        boolean hasAny = false;

        if (normalized.contains("autismo") || normalized.contains("tea") || normalized.contains("autista")) {
            hasAny = true;
            inclusionBuilder.append("\n**Estratégias Específicas para Autismo (TEA):**\n");
            inclusionBuilder.append("- **Previsibilidade:** Inclua rotinas claras e cronogramas visuais (se aplicável ao material).\n");
            inclusionBuilder.append("- **Linguagem Literal:** Evite ironias, sarcasmo ou figuras de linguagem. Use frases curtas e diretas.\n");
            inclusionBuilder.append("- **Interesses Específicos:** Sempre que possível, conecte o conteúdo aos interesses hiperfocados do aluno para aumentar o engajamento.\n");
            inclusionBuilder.append("- **Suporte Visual:** Utilize pictogramas, listas de verificação e instruções numeradas.\n");
        }

        if (normalized.contains("tdah") || normalized.contains("hiperativ") || normalized.contains("atenção") || normalized.contains("atencao")) {
            hasAny = true;
            inclusionBuilder.append("\n**Estratégias Específicas para TDAH (Transtorno do Déficit de Atenção com Hiperatividade):**\n");
            inclusionBuilder.append("- **Segmentação (Chunking):** Divida atividades longas em blocos de 10-15 minutos. Indique pausas claras.\n");
            inclusionBuilder.append("- **Destaques Visuais:** Use negrito ou destaques visuais para palavras-chave, instruções principais e informações importantes.\n");
            inclusionBuilder.append("- **Movimento e Interatividade:** Inclua pausas ativas ou elementos que permitam a manipulação física de objetos (se aplicável ao material).\n");
            inclusionBuilder.append("- **Feedback Imediato:** Proponha atividades com verificações rápidas de progresso e feedback construtivo.\n");
            inclusionBuilder.append("- Reduzir distratores textuais, indo direto ao ponto com linguagem objetiva.\n");
            inclusionBuilder.append("- Organizar ideias em tópicos simples e bem demarcados.\n");
        }

        if (normalized.contains("dislex") || normalized.contains("disléx")) {
            hasAny = true;
            inclusionBuilder.append("\n**Estratégias Específicas para Dislexia:**\n");
            inclusionBuilder.append("- **Simplificação de Texto:** Reduza a densidade do texto, use frases curtas e voz ativa. Evite blocos de texto justificados.\n");
            inclusionBuilder.append("- **Suporte Auditivo e Visual:** Sugira o uso de áudios, vídeos e mapas mentais em vez de longos textos escritos.\n");
            inclusionBuilder.append("- **Fontes e Formatação:** Utilize fontes sem serifa (ex: Arial, Open Sans), tamanho de fonte maior (12-14pt), maior espaçamento entre linhas (1.5 ou duplo) e entre palavras. Evite itálico e sublinhado excessivo.\n");
            inclusionBuilder.append("- **Avaliação Alternativa:** Proponha formas de avaliação que não dependam exclusivamente da escrita (ex: apresentações orais, desenhos, esquemas, respostas verbais).\n");
        }

        if (normalized.contains("discalcul")) {
            hasAny = true;
            inclusionBuilder.append("\n**Estratégias Específicas para Discalculia:**\n");
            inclusionBuilder.append("- **Uso de Manipulativos:** Sugira o uso de materiais concretos (blocos, ábacos, fichas) para representar conceitos matemáticos.\n");
            inclusionBuilder.append("- **Visualização de Dados:** Transforme problemas abstratos em representações visuais e espaciais (gráficos, diagramas).\n");
            inclusionBuilder.append("- **Passo a Passo Procedural:** Forneça roteiros detalhados de como resolver operações ou problemas, passo a passo, com exemplos claros.\n");
            inclusionBuilder.append("- **Foco na Compreensão Conceitual:** Priorize a compreensão dos conceitos matemáticos sobre a memorização de fórmulas ou procedimentos.\n");
        }

        if (normalized.contains("visual") || normalized.contains("ceg") || normalized.contains("baixa visão") || normalized.contains("baixa visao")) {
            hasAny = true;
            inclusionBuilder.append("\n**Estratégias Específicas para Deficiência Visual (Baixa Visão/Cegueira):**\n");
            inclusionBuilder.append("- **Formato Acessível:** Indique que o material deve ser adaptado para leitores de tela, impressão em Braille ou ampliação de fonte.\n");
            inclusionBuilder.append("- **Descrições Detalhadas:** Descreva minuciosamente imagens, gráficos e elementos visuais.\n");
            inclusionBuilder.append("- **Recursos Auditivos:** Sugira a inclusão de descrições em áudio ou narrações.\n");
            inclusionBuilder.append("- **Textos Alternativos (Alt Text):** Para imagens, forneça descrições textuais ricas.\n");
        }

        if (normalized.contains("auditiv") || normalized.contains("surd") || normalized.contains("libras") || normalized.contains("perda auditiva")) {
            hasAny = true;
            inclusionBuilder.append("\n**Estratégias Específicas para Deficiência Auditiva (Surdez/Perda Auditiva):**\n");
            inclusionBuilder.append("- **Recursos Visuais:** Priorize o uso de imagens, diagramas, legendas e transcrições para conteúdos em áudio/vídeo.\n");
            inclusionBuilder.append("- **Linguagem Clara e Direta:** Use frases curtas e objetivas. Evite expressões idiomáticas complexas.\n");
            inclusionBuilder.append("- **Glossário Visual:** Inclua um glossário com termos-chave e suas representações visuais (se possível).\n");
            inclusionBuilder.append("- **Apoio à Comunicação:** Sugira a inclusão de recursos em Libras (Língua Brasileira de Sinais) se o contexto permitir.\n");
        }

        if (!hasAny) {
            inclusionBuilder.append("\n**Necessidades específicas informadas:**\n");
            inclusionBuilder.append("- ").append(needsText).append("\n");
        }

        return inclusionBuilder.toString();
    }
}
