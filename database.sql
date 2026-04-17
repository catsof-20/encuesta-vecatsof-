-- Archivo SQL para ejecutar en el Editor SQL de SUPABASE

-- Tabla de Clientes
CREATE TABLE IF NOT EXISTS clientes (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    telefono VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Direcciones
CREATE TABLE IF NOT EXISTS direcciones (
    id SERIAL PRIMARY KEY,
    cliente_id INTEGER NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
    calle VARCHAR(255),
    ciudad VARCHAR(100),
    codigo_postal VARCHAR(20),
    provincia VARCHAR(100)
);

-- Tabla de Preguntas
CREATE TABLE IF NOT EXISTS questions (
    id SERIAL PRIMARY KEY,
    pregunta TEXT NOT NULL,
    opcion1 VARCHAR(255) NOT NULL,
    opcion2 VARCHAR(255) NOT NULL,
    votos1 INTEGER DEFAULT 0,
    votos2 INTEGER DEFAULT 0
);

-- Insertar algunas preguntas iniciales de ejemplo
INSERT INTO questions (pregunta, opcion1, opcion2) VALUES 
('¿Prefieres trabajar desde casa o en la oficina?', 'Casa', 'Oficina'),
('¿Qué prefieres: Té o Café?', 'Té', 'Café'),
('¿JavaScript o TypeScript?', 'JavaScript', 'TypeScript');
