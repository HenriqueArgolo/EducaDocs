package br.com.edudocsai.service;

import br.com.edudocsai.dto.inclusion.AdaptRequest;
import br.com.edudocsai.dto.inclusion.AdaptResponse;
import br.com.edudocsai.dto.inclusion.InclusionType;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class InclusionAdaptationService {

    private final AIService aiService;

    public AdaptResponse adaptContent(AdaptRequest request) {
        log.info("Adapting content for inclusion type={} targetType={} title='{}'", 
                request.type(), request.targetType(), request.title());

        String guidelines = getGuidelines(request.type());
        String prompt = buildPrompt(request, guidelines);
        
        String adaptedContent = aiService.generateJsonObject(prompt);
        String adaptedTitle = request.title() + " - Adaptado " + request.type();

        return new AdaptResponse(adaptedTitle, adaptedContent);
    }

    private String getGuidelines(InclusionType type) {
        return switch (type) {
            case TDAH -> """
                - **Segmentação (Chunking):** Divida atividades longas em blocos de 10-15 minutos. Indique pausas claras.
                - **Destaques Visuais:** Use negrito (ex: **termo**) ou cores para destacar palavras-chave, instruções principais e informações importantes.
                - **Movimento e Interatividade:** Inclua pausas ativas ou elementos que permitam a manipulação física de objetos (se aplicável).
                - **Feedback Imediato:** Proponha atividades com verificações rápidas de progresso e feedback construtivo.
                - Reduzir distratores textuais, indo direto ao ponto com linguagem objetiva.
                - Organizar ideias em tópicos simples e bem demarcados.
                """;
            case AUTISMO -> """
                - **Previsibilidade:** Inclua rotinas claras e cronogramas visuais (se aplicável).
                - **Linguagem Literal:** Utilize linguagem estritamente denotativa (literal), eliminando metáforas, ironias, figuras de linguagem, sarcasmo ou duplos sentidos. Use frases curtas e diretas.
                - **Interesses Específicos:** Conecte o conteúdo aos interesses hiperfocados do aluno para aumentar o engajamento sempre que possível.
                - **Suporte Visual:** Utilize pictogramas, listas de verificação e instruções numeradas.
                - Estruturar o conteúdo de forma sequencial clara, lógica e previsível.
                - Fornecer descrições concretas, diretas e explícitas para cada tarefa (passo a passo claro do que é esperado que o aluno faça).
                - Eliminar informações supérfluas e focar apenas no núcleo pedagógico.
                """;
            case DISLEXIA -> """
                - **Simplificação de Texto:** Reduza a densidade do texto, usando frases curtas e diretas na voz ativa, com vocabulário de alta frequência e parágrafos curtos.
                - **Suporte Auditivo e Visual:** Sugira o uso de áudios, vídeos e mapas mentais em vez de longos textos escritos.
                - **Fontes e Formatação:** Recomende fontes sem serifa, maior espaçamento entre linhas e evite blocos de texto justificados que criam distratores visuais.
                - **Avaliação Alternativa:** Proponha formas de avaliação que não dependam exclusivamente da escrita (ex: apresentações orais, desenhos, esquemas, respostas verbais).
                - Evitar termos foneticamente muito parecidos próximos uns dos outros para evitar confusão de decodificação.
                """;
        };
    }

    private String buildPrompt(AdaptRequest request, String guidelines) {
        return """
        Você é um psicopedagogo especialista em Educação Inclusiva e Atendimento Educacional Especializado (AEE).
        Sua tarefa é adaptar o seguinte recurso pedagógico para alunos com a seguinte necessidade específica: %s.
        
        Tipo do recurso original: %s.
        Título: %s.
        
        Conteúdo Original a ser Adaptado:
        %s
        
        ---
        Diretrizes de Adaptação Inclusiva para %s:
        %s
        
        ---
        Regras cruciais de retorno:
        1. Se o Conteúdo Original for um JSON estruturado válido, você DEVE retornar OBRIGATORIAMENTE um objeto JSON válido com a exata mesma estrutura (mantendo exatamente as mesmas chaves, arrays e hierarquia), modificando apenas os valores de texto internos (enunciados, descrições, explicações, alternativas, etc.) de modo a adaptá-los conforme as diretrizes de inclusão acima. Não adicione chaves extras nem remova chaves existentes.
        2. Se o Conteúdo Original for texto puro (não JSON), retorne apenas o texto puro adaptado de acordo com as diretrizes.
        3. Retorne apenas o resultado puro do JSON ou texto. Não inclua blocos markdown como ```json ou comentários explicativos antes ou depois.
        """.formatted(request.type(), request.targetType(), request.title(), request.content(), request.type(), guidelines);
    }
}
