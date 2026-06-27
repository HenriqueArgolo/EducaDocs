import os
import shutil
import json
from pathlib import Path

src_dir = Path(r"C:\Users\joaoh\Downloads\2000.Desenhos.para.colorir.1000.Atividades.para.criancas")
dest_dir = Path(r"c:\Users\joaoh\OneDrive\Área de Trabalho\Documentos\eduDocs-frotend\edudocs-frontend\public\materials")
sql_file = Path(r"c:\Users\joaoh\OneDrive\Área de Trabalho\Documentos\gestor-aulas\src\main\resources\db\migration\V8__import_downloads.sql")

# Ensure destination directory exists
dest_dir.mkdir(parents=True, exist_ok=True)

# Find all PDFs
pdf_files = list(src_dir.rglob("*.pdf"))
print(f"Found {len(pdf_files)} PDF files.")

inserts = []

for idx, p in enumerate(pdf_files, 1):
    rel_path = p.relative_to(src_dir)
    rel_path_str = rel_path.as_posix() # Use forward slashes for URL paths
    
    # Target copy path
    target_path = dest_dir / rel_path
    target_path.parent.mkdir(parents=True, exist_ok=True)
    
    # Copy file
    shutil.copy2(p, target_path)
    
    # Title: filename without extension
    original_title = p.stem
    
    # Clean up name: remove _compressed, replace multiple spaces, etc.
    cleaned_title = original_title.replace("_compressed", "")
    cleaned_title = cleaned_title.replace("- 10 Páginas", "").replace("- 10 Pginas", "")
    cleaned_title = cleaned_title.replace(" - 10 Páginas", "").replace(" - 10 Pginas", "")
    cleaned_title = cleaned_title.replace(" - 100 Páginas", "").replace(" - 100 Pginas", "")
    cleaned_title = cleaned_title.replace(" - 12 Páginas", "").replace(" - 12 Pginas", "")
    cleaned_title = cleaned_title.replace(" - 14 Páginas", "").replace(" - 14 Pginas", "")
    cleaned_title = cleaned_title.replace(" - 20 Páginas", "").replace(" - 20 Pginas", "")
    cleaned_title = cleaned_title.replace(" - 26 Páginas", "").replace(" - 26 Pginas", "")
    cleaned_title = cleaned_title.replace(" - 78 Páginas", "").replace(" - 78 Pginas", "")
    cleaned_title = cleaned_title.replace(" - 30 Páginas", "").replace(" - 30 Pginas", "")
    cleaned_title = cleaned_title.replace(" - 231 Páginas", "").replace(" - 231 Pginas", "")
    cleaned_title = cleaned_title.replace(" - 52 Páginas", "").replace(" - 52 Pginas", "")
    
    # Fix corrupt encoding characters from filesystem read
    cleaned_title = cleaned_title.replace("Pginas", "Páginas").replace("Pginas", "Páginas")
    cleaned_title = cleaned_title.replace("Pedaggicas", "Pedagógicas").replace("Pedagogicas", "Pedagógicas")
    cleaned_title = cleaned_title.replace("Bnus", "Bônus").replace("Bonus", "Bônus")
    cleaned_title = cleaned_title.replace("Nmeros", "Números").replace("Nmeros", "Números")
    cleaned_title = cleaned_title.replace("Truma", "Turma")
    cleaned_title = cleaned_title.replace("Formao", "Formação").replace("Formao", "Formação").replace("Formacao", "Formação")
    cleaned_title = cleaned_title.replace("Basto", "Bastão").replace("Bastao", "Bastão")
    cleaned_title = cleaned_title.replace("Raciocnio", "Raciocínio").replace("Raciocinio", "Raciocínio")
    cleaned_title = cleaned_title.replace("Traar", "Traçar").replace("Tracar", "Traçar")
    cleaned_title = cleaned_title.replace("Bblicas", "Bíblicas").replace("Bblica", "Bíblica").replace("Biblicas", "Bíblicas")
    cleaned_title = cleaned_title.replace("Caa", "Caça").replace("Caca", "Caça")
    cleaned_title = cleaned_title.replace("Pssaros", "Pássaros").replace("Passaros", "Pássaros")
    cleaned_title = cleaned_title.replace("Pneis", "Pôneis").replace("Poneis", "Pôneis")
    cleaned_title = cleaned_title.replace("Unicrnios", "Unicórnios").replace("Unicornios", "Unicórnios")
    cleaned_title = cleaned_title.replace("Veculos", "Veículos").replace("Veiculos", "Veículos")
    cleaned_title = cleaned_title.replace("  ", " ").strip()
    
    # Heuristics for type
    rel_path_lower = rel_path_str.lower()
    
    material_type = "WORKSHEET"
    grade = "Educação Infantil"
    subject = "Português"
    
    # Type determination
    if "colorir" in rel_path_lower or "desenho" in rel_path_lower:
        material_type = "COLORING_BOOK"
    elif "jogo" in rel_path_lower or "jogos" in rel_path_lower or "labirinto" in rel_path_lower:
        material_type = "GAME"
    elif "flashcard" in rel_path_lower or "fichas de estudo" in rel_path_lower:
        material_type = "FLASHCARD"
    
    # Grade determination
    if "maternal" in rel_path_lower:
        grade = "Maternal"
    elif "1º ano" in rel_path_lower or "1 ano" in rel_path_lower or "1o ano" in rel_path_lower:
        grade = "1º Ano"
    elif "2º ano" in rel_path_lower or "2 ano" in rel_path_lower or "2o ano" in rel_path_lower:
        grade = "2º Ano"
    elif "3º ano" in rel_path_lower or "3 ano" in rel_path_lower or "3o ano" in rel_path_lower:
        grade = "3º Ano"
    elif "4º ano" in rel_path_lower or "4 ano" in rel_path_lower or "4o ano" in rel_path_lower:
        grade = "4º Ano"
    elif "5º ano" in rel_path_lower or "5 ano" in rel_path_lower or "5o ano" in rel_path_lower:
        grade = "5º Ano"
    elif "fundamental" in rel_path_lower:
        grade = "Ensino Fundamental"
    
    # Subject determination
    if "matemática" in rel_path_lower or "numeras" in rel_path_lower or "números" in rel_path_lower or "numerais" in rel_path_lower or "contar" in rel_path_lower or "raciocínio" in rel_path_lower or "somas" in rel_path_lower or "frações" in rel_path_lower:
        subject = "Matemática"
    elif "português" in rel_path_lower or "alfabetização" in rel_path_lower or "sílabas" in rel_path_lower or "leitura" in rel_path_lower or "letras" in rel_path_lower or "caligrafia" in rel_path_lower or "bastão" in rel_path_lower or "cursiva" in rel_path_lower or "caça palavras" in rel_path_lower or "traçar" in rel_path_lower:
        subject = "Português"
    elif "artes" in rel_path_lower or "desenhos" in rel_path_lower or "colorir" in rel_path_lower or "sem tela" in rel_path_lower or "recortar" in rel_path_lower:
        subject = "Artes"
    elif "inglês" in rel_path_lower or "english" in rel_path_lower:
        subject = "Inglês"
    elif "bíblicas" in rel_path_lower or "bíblica" in rel_path_lower:
        subject = "Ensino Religioso"
    elif "canções" in rel_path_lower or "música" in rel_path_lower:
        subject = "Música"
    elif "ciências" in rel_path_lower:
        subject = "Ciências"
    elif "história" in rel_path_lower:
        subject = "História"
    elif "geografia" in rel_path_lower:
        subject = "Geografia"
    else:
        # Check folder structure path parts
        if "ALFABETIZAÇÃO" in rel_path_str or "PORTUGUÊS" in rel_path_str or "SÍLABAS" in rel_path_str or "CALIGRAFIA" in rel_path_str:
            subject = "Português"
        elif "MATEMÁTICA" in rel_path_str or "NUMERAIS" in rel_path_str:
            subject = "Matemática"
        elif "ARTES" in rel_path_str or "DESENHOS PARA COLORIR" in rel_path_str or "ATIVIDADES SEM TELA" in rel_path_str or "COGNITIVAS" in rel_path_str:
            subject = "Artes"
        elif "INGLÊS" in rel_path_str:
            subject = "Inglês"
        elif "ATIVIDADES BÍBLICAS" in rel_path_str:
            subject = "Ensino Religioso"
        elif "CANÇÕES INFANTIS" in rel_path_str:
            subject = "Música"
        elif "CIÊNCIAS" in rel_path_str:
            subject = "Ciências"
        else:
            if material_type == "COLORING_BOOK":
                subject = "Artes"
            else:
                subject = "Português"

    # Description
    desc = f"Recurso didático digital em PDF contendo atividades de {subject} para a série {grade}. Arquivo importado da biblioteca local."
    
    # Content JSON
    content_obj = {
        "isPdf": True,
        "pdfUrl": f"/materials/{rel_path_str}"
    }
    content_json = json.dumps(content_obj, ensure_ascii=False)
    
    # Escape single quotes for SQL insertion
    title_sql = cleaned_title.replace("'", "''")
    desc_sql = desc.replace("'", "''")
    content_sql = content_json.replace("'", "''")
    
    sql_insert = (
        f"INSERT INTO activity_materials (title, description, type, grade, subject, content, thumbnail_url, is_public, created_at)\n"
        f"VALUES ('{title_sql}', '{desc_sql}', '{material_type}', '{grade}', '{subject}', '{content_sql}', NULL, TRUE, NOW());"
    )
    inserts.append(sql_insert)

# Write to V8__import_downloads.sql
sql_file.parent.mkdir(parents=True, exist_ok=True)
with open(sql_file, "w", encoding="utf-8") as f:
    f.write("-- Migração para importar 128 arquivos PDF da biblioteca local de desenhos e atividades\n\n")
    f.write("\n\n".join(inserts))
    f.write("\n")

print(f"Migration file successfully generated at: {sql_file}")
print("All files copied and registered successfully!")
