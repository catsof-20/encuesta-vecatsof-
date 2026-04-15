-- 1. Tabla de Encuestas (Título y descripción)
CREATE TABLE IF NOT EXISTS encuestas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    titulo TEXT NOT NULL,
    descripcion TEXT,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabla de Opciones (Las respuestas posibles para cada encuesta)
CREATE TABLE IF NOT EXISTS opciones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    encuesta_id INTEGER NOT NULL,
    texto_opcion TEXT NOT NULL,
    FOREIGN KEY (encuesta_id) REFERENCES encuestas (id) ON DELETE CASCADE
);

-- 3. Tabla de Votos (Registro de cada votación)
CREATE TABLE IF NOT EXISTS votos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    opcion_id INTEGER NOT NULL,
    ip_usuario TEXT NOT NULL, -- Para control de spam/duplicate con express-rate-limit
    fecha_voto DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (opcion_id) REFERENCES opciones (id) ON DELETE CASCADE
);

-- Ejemplo de inserción de datos para probar:
INSERT INTO encuestas (titulo, descripcion) VALUES ('¿Cuál es tu lenguaje favorito?', 'Encuesta de nivel para el curso');

INSERT INTO opciones (encuesta_id, texto_opcion) VALUES (1, 'JavaScript');
INSERT INTO opciones (encuesta_id, texto_opcion) VALUES (1, 'Python');
INSERT INTO opciones (encuesta_id, texto_opcion) VALUES (1, 'Java');
