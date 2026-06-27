# BNCC data sources

The production seed in `V4__expand_bncc_seed.sql` imports the core BNCC skills used by EduDocs AI.

Imported:
- Educacao Infantil and Ensino Fundamental from `bncc_habilidades.csv`.
- Ensino Medio from `bncc_em.csv`, with PDF extraction headers/footers removed before generating SQL.

Source:
- Official MEC BNCC text: https://basenacionalcomum.mec.gov.br/
- Structured CSV project used to transform the MEC text into tabular data: https://github.com/dfdb76/bncc-mcp

Not imported:
- Instituto Reuna "Mapa de Foco" enrichment columns, because the API only needs canonical BNCC code, description, subject/field and grade/range.
- BNCC Computacao complement, because the available structured transcription is marked CC BY-NC-SA. It can be added later only after confirming the commercial-use license strategy.
