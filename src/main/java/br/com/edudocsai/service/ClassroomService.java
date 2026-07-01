package br.com.edudocsai.service;

import br.com.edudocsai.dto.classroom.ClassroomDto;
import br.com.edudocsai.dto.classroom.ClassroomStatsDto;
import br.com.edudocsai.dto.classroom.ClassroomTimelineItemDto;
import br.com.edudocsai.dto.classroom.CreateClassroomRequest;
import br.com.edudocsai.dto.classroom.CreateTimelineItemRequest;
import br.com.edudocsai.dto.classroom.GenerateRoadmapRequest;
import br.com.edudocsai.dto.classroom.ReorderTimelineItemsRequest;
import br.com.edudocsai.entity.ActivityMaterial;
import br.com.edudocsai.entity.BNCCSkill;
import br.com.edudocsai.entity.Classroom;
import br.com.edudocsai.entity.ClassroomTimelineItem;
import br.com.edudocsai.entity.Document;
import br.com.edudocsai.entity.Presentation;
import br.com.edudocsai.entity.TimelineItemStatus;
import br.com.edudocsai.entity.User;
import br.com.edudocsai.exception.NotFoundException;
import br.com.edudocsai.repository.ActivityMaterialRepository;
import br.com.edudocsai.repository.BNCCSkillRepository;
import br.com.edudocsai.repository.ClassroomRepository;
import br.com.edudocsai.repository.ClassroomTimelineItemRepository;
import br.com.edudocsai.repository.DocumentRepository;
import br.com.edudocsai.repository.LessonKitRepository;
import br.com.edudocsai.repository.PresentationRepository;
import br.com.edudocsai.repository.StudentRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.apache.poi.xwpf.usermodel.ParagraphAlignment;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.apache.poi.xwpf.usermodel.XWPFParagraph;
import org.apache.poi.xwpf.usermodel.XWPFRun;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ClassroomService {

    private final ClassroomRepository classroomRepository;
    private final ClassroomTimelineItemRepository timelineItemRepository;
    private final DocumentRepository documentRepository;
    private final LessonKitRepository lessonKitRepository;
    private final ActivityMaterialRepository activityMaterialRepository;
    private final PresentationRepository presentationRepository;
    private final BNCCSkillRepository bnccSkillRepository;
    private final CurrentUserService currentUserService;
    private final StudentRepository studentRepository;
    private final AIService aiService;
    private final ObjectMapper objectMapper;
    private final PromptModuleCatalog promptModuleCatalog;

    @Transactional
    public ClassroomDto createClassroom(CreateClassroomRequest request) {
        User user = currentUserService.getCurrentUser();
        Classroom classroom = Classroom.builder()
            .user(user)
            .name(request.name())
            .subject(request.subject())
            .grade(request.grade())
            .build();

        classroom = classroomRepository.save(classroom);
        return mapToDto(classroom);
    }

    @Transactional(readOnly = true)
    public List<ClassroomDto> getClassrooms() {
        User user = currentUserService.getCurrentUser();
        return classroomRepository.findByUserOrderByCreatedAtDesc(user)
            .stream()
            .map(this::mapToDto)
            .toList();
    }

    @Transactional(readOnly = true)
    public List<ClassroomTimelineItemDto> getClassroomRoadmap(Long classroomId) {
        User user = currentUserService.getCurrentUser();
        Classroom classroom = classroomRepository.findByIdAndUser(classroomId, user)
            .orElseThrow(() -> new NotFoundException("Turma não encontrada"));

        return classroom.getTimelineItems().stream()
            .map(this::mapToDto)
            .toList();
    }

    @Transactional
    public ClassroomTimelineItemDto addTimelineItem(Long classroomId, CreateTimelineItemRequest request) {
        User user = currentUserService.getCurrentUser();
        Classroom classroom = classroomRepository.findByIdAndUser(classroomId, user)
            .orElseThrow(() -> new NotFoundException("Turma não encontrada"));

        int orderIndex = classroom.getTimelineItems().size();

        Document document = null;
        if (request.documentId() != null) {
            document = documentRepository.findById(request.documentId())
                .orElseThrow(() -> new NotFoundException("Documento não encontrado"));
        }

        ActivityMaterial activity = null;
        if (request.activityId() != null) {
            activity = activityMaterialRepository.findById(request.activityId())
                .orElseThrow(() -> new NotFoundException("Atividade não encontrada"));
        }

        Presentation presentation = null;
        if (request.presentationId() != null) {
            presentation = presentationRepository.findById(request.presentationId())
                .orElseThrow(() -> new NotFoundException("Apresentação não encontrada"));
        }

        ClassroomTimelineItem item = ClassroomTimelineItem.builder()
            .classroom(classroom)
            .title(request.title())
            .description(request.description())
            .type(request.type())
            .status(TimelineItemStatus.PLANNED)
            .orderIndex(orderIndex)
            .document(document)
            .activity(activity)
            .presentation(presentation)
            .build();

        item = timelineItemRepository.save(item);
        return mapToDto(item);
    }

    @Transactional
    public void reorderTimelineItems(Long classroomId, ReorderTimelineItemsRequest request) {
        User user = currentUserService.getCurrentUser();
        Classroom classroom = classroomRepository.findByIdAndUser(classroomId, user)
            .orElseThrow(() -> new NotFoundException("Turma não encontrada"));

        List<ClassroomTimelineItem> items = classroom.getTimelineItems();

        for (int i = 0; i < request.orderedItemIds().size(); i++) {
            Long itemId = request.orderedItemIds().get(i);
            int finalI = i;
            items.stream()
                .filter(item -> item.getId().equals(itemId))
                .findFirst()
                .ifPresent(item -> item.setOrderIndex(finalI));
        }

        timelineItemRepository.saveAll(items);
    }

    @Transactional
    public ClassroomTimelineItemDto changeTimelineItemStatus(Long classroomId, Long itemId, TimelineItemStatus status) {
        User user = currentUserService.getCurrentUser();
        Classroom classroom = classroomRepository.findByIdAndUser(classroomId, user)
            .orElseThrow(() -> new NotFoundException("Turma não encontrada"));

        ClassroomTimelineItem item = timelineItemRepository.findById(itemId)
            .orElseThrow(() -> new NotFoundException("Item não encontrado"));

        if (!item.getClassroom().getId().equals(classroom.getId())) {
            throw new IllegalArgumentException("Item não pertence a esta turma");
        }

        item.setStatus(status);
        item = timelineItemRepository.save(item);
        return mapToDto(item);
    }

    @Transactional
    public ClassroomTimelineItemDto updateTimelineItemDate(Long classroomId, Long itemId, java.time.ZonedDateTime newDate) {
        User user = currentUserService.getCurrentUser();
        Classroom classroom = classroomRepository.findByIdAndUser(classroomId, user)
            .orElseThrow(() -> new NotFoundException("Turma não encontrada"));

        ClassroomTimelineItem item = timelineItemRepository.findById(itemId)
            .orElseThrow(() -> new NotFoundException("Item não encontrado"));

        if (!item.getClassroom().getId().equals(classroom.getId())) {
            throw new IllegalArgumentException("Item não pertence a esta turma");
        }

        item.setTargetDate(newDate);
        item = timelineItemRepository.save(item);
        return mapToDto(item);
    }

    @Transactional(readOnly = true)
    public ClassroomStatsDto getClassroomStats(Long classroomId) {
        User user = currentUserService.getCurrentUser();
        Classroom classroom = classroomRepository.findByIdAndUser(classroomId, user)
            .orElseThrow(() -> new NotFoundException("Turma não encontrada"));

        int totalResources = classroom.getTimelineItems().size();
        int completedResources = (int) classroom.getTimelineItems().stream()
            .filter(item -> item.getStatus() == TimelineItemStatus.COMPLETED)
            .count();

        List<Long> bnccSkillIds = classroom.getTimelineItems().stream()
            .filter(item -> item.getDocument() != null && item.getDocument().getGenerationRequest() != null)
            .map(item -> item.getDocument().getGenerationRequest().getBnccSkillIds())
            .filter(Objects::nonNull)
            .flatMap(Collection::stream)
            .distinct()
            .collect(Collectors.toList());

        List<String> bnccSkills = bnccSkillRepository.findAllById(bnccSkillIds).stream()
            .map(BNCCSkill::getCode)
            .distinct()
            .collect(Collectors.toList());

        return new ClassroomStatsDto(totalResources, completedResources, totalResources - completedResources, bnccSkills);
    }

    @Transactional
    public ClassroomTimelineItemDto updateTimelineItem(Long classroomId, Long itemId, CreateTimelineItemRequest request) {
        User user = currentUserService.getCurrentUser();
        Classroom classroom = classroomRepository.findByIdAndUser(classroomId, user)
            .orElseThrow(() -> new NotFoundException("Turma não encontrada"));

        ClassroomTimelineItem item = timelineItemRepository.findById(itemId)
            .orElseThrow(() -> new NotFoundException("Item não encontrado"));

        if (!item.getClassroom().getId().equals(classroom.getId())) {
            throw new IllegalArgumentException("Item não pertence a esta turma");
        }

        Document document = null;
        if (request.documentId() != null) {
            document = documentRepository.findById(request.documentId())
                .orElseThrow(() -> new NotFoundException("Documento não encontrado"));
        }

        ActivityMaterial activity = null;
        if (request.activityId() != null) {
            activity = activityMaterialRepository.findById(request.activityId())
                .orElseThrow(() -> new NotFoundException("Atividade não encontrada"));
        }

        Presentation presentation = null;
        if (request.presentationId() != null) {
            presentation = presentationRepository.findById(request.presentationId())
                .orElseThrow(() -> new NotFoundException("Apresentação não encontrada"));
        }

        item.setTitle(request.title());
        item.setDescription(request.description());
        item.setType(request.type());
        item.setDocument(document);
        item.setActivity(activity);
        item.setPresentation(presentation);

        if (document != null || activity != null || presentation != null) {
            item.setStatus(TimelineItemStatus.COMPLETED);
        } else {
            item.setStatus(TimelineItemStatus.PLANNED);
        }

        item = timelineItemRepository.save(item);
        return mapToDto(item);
    }

    @Transactional
    public List<ClassroomTimelineItemDto> generateRoadmap(Long classroomId, GenerateRoadmapRequest request) {
        User user = currentUserService.getCurrentUser();
        Classroom classroom = classroomRepository.findByIdAndUser(classroomId, user)
            .orElseThrow(() -> new NotFoundException("Turma não encontrada"));

        String template = promptModuleCatalog.getPromptByKey("classroom_timeline_roadmap_prompt");
        String prompt = template.formatted(
                classroom.getName(),
                classroom.getGrade(),
                classroom.getSubject(),
                request.theme(),
                request.numberOfLessons(),
                request.additionalInstructions() != null ? request.additionalInstructions() : "Nenhuma"
        );

        try {
            String jsonResponse = aiService.generateJsonObject(prompt);
            JsonNode root = objectMapper.readTree(jsonResponse);
            JsonNode aulasNode = root.path("aulas");

            int baseOrder = classroom.getTimelineItems().size();
            java.time.ZonedDateTime targetDate = java.time.ZonedDateTime.now();

            if (aulasNode.isArray()) {
                for (int i = 0; i < aulasNode.size(); i++) {
                    JsonNode aula = aulasNode.get(i);
                    String title = aula.path("titulo").asText("Aula gerada");
                    String desc = aula.path("descricao").asText("");
                    String typeStr = aula.path("tipo").asText("CUSTOM_EVENT");
                    
                    br.com.edudocsai.entity.TimelineItemType type;
                    try {
                        type = br.com.edudocsai.entity.TimelineItemType.valueOf(typeStr);
                    } catch (Exception e) {
                        type = br.com.edudocsai.entity.TimelineItemType.CUSTOM_EVENT;
                    }

                    java.time.ZonedDateTime itemDate = targetDate.plusDays(i);

                    ClassroomTimelineItem item = ClassroomTimelineItem.builder()
                        .classroom(classroom)
                        .title(title)
                        .description(desc)
                        .type(type)
                        .status(TimelineItemStatus.PLANNED)
                        .orderIndex(baseOrder + i)
                        .targetDate(itemDate)
                        .build();

                    timelineItemRepository.save(item);
                }
            }
        } catch (Exception exception) {
            throw new br.com.edudocsai.exception.BadRequestException("Não foi possível gerar a linha do tempo com a IA. Erro de parser: " + exception.getMessage());
        }

        return timelineItemRepository.saveAll(classroom.getTimelineItems()).stream()
            .map(this::mapToDto)
            .toList();
    }

    @Transactional(readOnly = true)
    public byte[] exportPortfolio(Long classroomId) {
        User user = currentUserService.getCurrentUser();
        Classroom classroom = classroomRepository.findByIdAndUser(classroomId, user)
            .orElseThrow(() -> new NotFoundException("Turma não encontrada"));

        try (XWPFDocument doc = new XWPFDocument();
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {

            XWPFParagraph titlePara = doc.createParagraph();
            titlePara.setAlignment(ParagraphAlignment.CENTER);
            XWPFRun titleRun = titlePara.createRun();
            titleRun.setText("PORTFÓLIO PEDAGÓGICO E DIÁRIO DE CLASSE");
            titleRun.setBold(true);
            titleRun.setFontSize(22);
            titleRun.setFontFamily("Arial");
            titleRun.addBreak();

            XWPFParagraph metaPara = doc.createParagraph();
            metaPara.setAlignment(ParagraphAlignment.CENTER);
            XWPFRun metaRun = metaPara.createRun();
            metaRun.setText("Turma: " + classroom.getName() + " | Ano: " + classroom.getGrade());
            metaRun.addBreak();
            metaRun.setText("Disciplina: " + classroom.getSubject());
            metaRun.addBreak();
            metaRun.setText("Professor(a): " + user.getName());
            metaRun.addBreak();
            metaRun.setText("Data de Exportação: " + java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy").format(java.time.LocalDate.now()));
            metaRun.setFontSize(12);
            metaRun.setFontFamily("Arial");
            metaRun.addBreak();
            metaRun.addBreak();

            XWPFParagraph studentHeading = doc.createParagraph();
            XWPFRun studentHeadRun = studentHeading.createRun();
            studentHeadRun.setText("1. Alunos e Adaptações de Inclusão (PDI)");
            studentHeadRun.setBold(true);
            studentHeadRun.setFontSize(14);
            studentHeadRun.setFontFamily("Arial");

            List<br.com.edudocsai.entity.Student> students = studentRepository.findByClassroomIdOrderByCreatedAtDesc(classroom.getId());
            if (students.isEmpty()) {
                XWPFParagraph emptyStuPara = doc.createParagraph();
                XWPFRun emptyStuRun = emptyStuPara.createRun();
                emptyStuRun.setText("Nenhum aluno cadastrado nesta turma.");
                emptyStuRun.setItalic(true);
                emptyStuRun.setFontFamily("Arial");
            } else {
                for (br.com.edudocsai.entity.Student student : students) {
                    XWPFParagraph stuPara = doc.createParagraph();
                    XWPFRun stuRun = stuPara.createRun();
                    stuRun.setText("• " + student.getName());
                    stuRun.setBold(true);
                    stuRun.setFontFamily("Arial");
                    
                    if (student.getNeeds() != null && !student.getNeeds().isBlank()) {
                        XWPFRun needsRun = stuPara.createRun();
                        needsRun.setText(" - Necessidades: " + student.getNeeds());
                        needsRun.setItalic(true);
                        needsRun.setFontFamily("Arial");
                    }
                }
            }
            doc.createParagraph().createRun().addBreak();

            XWPFParagraph timelineHeading = doc.createParagraph();
            XWPFRun timelineHeadRun = timelineHeading.createRun();
            timelineHeadRun.setText("2. Cronograma de Aulas e Atividades");
            timelineHeadRun.setBold(true);
            timelineHeadRun.setFontSize(14);
            timelineHeadRun.setFontFamily("Arial");

            List<ClassroomTimelineItem> items = classroom.getTimelineItems();
            if (items.isEmpty()) {
                XWPFParagraph emptyTimePara = doc.createParagraph();
                XWPFRun emptyTimeRun = emptyTimePara.createRun();
                emptyTimeRun.setText("Nenhum evento ou planejamento cadastrado na linha do tempo.");
                emptyTimeRun.setItalic(true);
                emptyTimeRun.setFontFamily("Arial");
            } else {
                for (ClassroomTimelineItem item : items) {
                    XWPFParagraph itemPara = doc.createParagraph();
                    XWPFRun itemRun = itemPara.createRun();
                    String statusLabel = item.getStatus() == TimelineItemStatus.COMPLETED ? "[Concluída]" : "[Planejada]";
                    String dateLabel = item.getTargetDate() != null ? java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy").format(item.getTargetDate()) : "";
                    
                    itemRun.setText(dateLabel + " - " + statusLabel + " " + item.getTitle());
                    itemRun.setBold(true);
                    itemRun.setFontFamily("Arial");

                    if (item.getDescription() != null && !item.getDescription().isBlank()) {
                        XWPFParagraph descPara = doc.createParagraph();
                        descPara.setIndentationLeft(360);
                        XWPFRun descRun = descPara.createRun();
                        descRun.setText("Descrição: " + item.getDescription());
                        descRun.setFontFamily("Arial");
                        descRun.setFontSize(10);
                        descRun.setColor("555555");
                    }
                }
            }
            doc.createParagraph().createRun().addBreak();

            XWPFParagraph materialsHeading = doc.createParagraph();
            XWPFRun materialsHeadRun = materialsHeading.createRun();
            materialsHeadRun.setText("3. Conteúdo dos Materiais e Planos Vinculados");
            materialsHeadRun.setBold(true);
            materialsHeadRun.setFontSize(14);
            materialsHeadRun.setFontFamily("Arial");

            boolean hasMaterials = false;
            for (ClassroomTimelineItem item : items) {
                if (item.getDocument() != null) {
                    hasMaterials = true;
                    appendDocumentToDocx(doc, item.getTitle(), item.getDocument());
                } else if (item.getActivity() != null) {
                    hasMaterials = true;
                    appendActivityToDocx(doc, item.getTitle(), item.getActivity());
                }
            }

            if (!hasMaterials) {
                XWPFParagraph emptyMatPara = doc.createParagraph();
                XWPFRun emptyMatRun = emptyMatPara.createRun();
                emptyMatRun.setText("Nenhum material de aula (Plano de Aula ou Atividade) vinculado a esta linha do tempo.");
                emptyMatRun.setItalic(true);
                emptyMatRun.setFontFamily("Arial");
            }

            doc.write(out);
            return out.toByteArray();
        } catch (IOException e) {
            throw new br.com.edudocsai.exception.BadRequestException("Erro ao gerar o documento do portfólio: " + e.getMessage());
        }
    }

    private void appendDocumentToDocx(XWPFDocument doc, String lessonTitle, Document document) {
        XWPFParagraph titlePara = doc.createParagraph();
        titlePara.createRun().addBreak();
        XWPFRun titleRun = titlePara.createRun();
        titleRun.setText("Material: " + lessonTitle + " (" + document.getType().name() + ")");
        titleRun.setBold(true);
        titleRun.setFontSize(12);
        titleRun.setFontFamily("Arial");

        try {
            JsonNode root = objectMapper.readTree(document.getContent());
            appendJsonContent(doc, root);
        } catch (Exception e) {
            XWPFParagraph errPara = doc.createParagraph();
            errPara.createRun().setText("Não foi possível ler o conteúdo do documento.");
        }
    }

    private void appendActivityToDocx(XWPFDocument doc, String lessonTitle, ActivityMaterial activity) {
        XWPFParagraph titlePara = doc.createParagraph();
        titlePara.createRun().addBreak();
        XWPFRun titleRun = titlePara.createRun();
        titleRun.setText("Atividade: " + lessonTitle + " (" + activity.getType().name() + ")");
        titleRun.setBold(true);
        titleRun.setFontSize(12);
        titleRun.setFontFamily("Arial");

        try {
            JsonNode root = objectMapper.readTree(activity.getContent());
            appendJsonContent(doc, root);
        } catch (Exception e) {
            XWPFParagraph errPara = doc.createParagraph();
            errPara.createRun().setText("Não foi possível ler o conteúdo da atividade.");
        }
    }

    private void appendJsonContent(XWPFDocument doc, JsonNode node) {
        if (node.isObject()) {
            java.util.Iterator<Map.Entry<String, JsonNode>> fields = node.fields();
            while (fields.hasNext()) {
                Map.Entry<String, JsonNode> field = fields.next();
                String key = field.getKey();
                JsonNode value = field.getValue();

                String displayKey = key.substring(0, 1).toUpperCase() + key.substring(1);
                
                XWPFParagraph keyPara = doc.createParagraph();
                XWPFRun keyRun = keyPara.createRun();
                keyRun.setText(displayKey + ": ");
                keyRun.setBold(true);
                keyRun.setFontFamily("Arial");

                if (value.isTextual()) {
                    XWPFRun valRun = keyPara.createRun();
                    valRun.setText(value.asText());
                    valRun.setFontFamily("Arial");
                } else if (value.isArray()) {
                    for (JsonNode val : value) {
                        XWPFParagraph arrPara = doc.createParagraph();
                        arrPara.setIndentationLeft(360);
                        XWPFRun arrRun = arrPara.createRun();
                        arrRun.setText("- " + val.asText());
                        arrRun.setFontFamily("Arial");
                    }
                } else if (value.isObject()) {
                    appendJsonContent(doc, value);
                }
            }
        }
    }

    @Transactional
    public void deleteTimelineItem(Long classroomId, Long itemId) {
        User user = currentUserService.getCurrentUser();
        Classroom classroom = classroomRepository.findByIdAndUser(classroomId, user)
            .orElseThrow(() -> new NotFoundException("Turma não encontrada"));

        ClassroomTimelineItem item = timelineItemRepository.findById(itemId)
            .orElseThrow(() -> new NotFoundException("Item não encontrado"));

        if (!item.getClassroom().getId().equals(classroom.getId())) {
            throw new IllegalArgumentException("Item não pertence a esta turma");
        }

        classroom.getTimelineItems().removeIf(i -> i.getId().equals(itemId));
        timelineItemRepository.delete(item);

        // Reorder remaining items to close any gaps in indices
        List<ClassroomTimelineItem> items = classroom.getTimelineItems();
        for (int i = 0; i < items.size(); i++) {
            items.get(i).setOrderIndex(i);
        }
        classroomRepository.save(classroom);
    }

    private ClassroomDto mapToDto(Classroom classroom) {
        return new ClassroomDto(
            classroom.getId(),
            classroom.getName(),
            classroom.getSubject(),
            classroom.getGrade(),
            classroom.getCreatedAt()
        );
    }

    private ClassroomTimelineItemDto mapToDto(ClassroomTimelineItem item) {
        return new ClassroomTimelineItemDto(
            item.getId(),
            item.getTitle(),
            item.getDescription(),
            item.getOrderIndex(),
            item.getStatus(),
            item.getType(),
            item.getDocument() != null ? item.getDocument().getId() : null,
            item.getDocument() == null ? null : lessonKitRepository.findBySourceDocumentId(item.getDocument().getId())
                    .map(kit -> kit.getId()).orElse(null),
            item.getActivity() != null ? item.getActivity().getId() : null,
            item.getPresentation() != null ? item.getPresentation().getId() : null,
            item.getCreatedAt(),
            item.getTargetDate() != null ? item.getTargetDate() : item.getCreatedAt()
        );
    }
}
