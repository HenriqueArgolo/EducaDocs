INSERT INTO bncc_skills (code, description, subject, grade) VALUES
('EF05MA03', 'Identificar e representar frações, associando-as ao resultado de uma divisão ou à ideia de parte de um todo.', 'Matemática', '5º ano'),
('EF05LP01', 'Grafar palavras utilizando regras de correspondência fonema-grafema regulares, contextuais e morfológicas.', 'Língua Portuguesa', '5º ano'),
('EF04CI02', 'Testar e relatar transformações nos materiais do dia a dia quando expostos a diferentes condições.', 'Ciências', '4º ano'),
('EF06HI01', 'Identificar diferentes formas de compreensão da noção de tempo e periodização dos processos históricos.', 'História', '6º ano')
ON CONFLICT (code) DO NOTHING;
