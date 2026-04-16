-- Crear la base de datos
CREATE DATABASE IF NOT EXISTS vecatsof_db;
USE vecatsof_db;

-- Tabla de Clientes
CREATE TABLE IF NOT EXISTS clientes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    telefono VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Direcciones
CREATE TABLE IF NOT EXISTS direcciones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cliente_id INT NOT NULL,
    calle VARCHAR(255) NOT NULL,
    ciudad VARCHAR(100) NOT NULL,
    codigo_postal VARCHAR(10) NOT NULL,
    provincia VARCHAR(100) NOT NULL,
    FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE
);

-- Tabla de Preguntas (opcional, integrada)
CREATE TABLE IF NOT EXISTS questions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    pregunta TEXT NOT NULL,
    opcion1 VARCHAR(255) NOT NULL,
    opcion2 VARCHAR(255) NOT NULL,
    votos1 INT DEFAULT 0,
    votos2 INT DEFAULT 0
);

-- Insertar algunas preguntas iniciales
INSERT INTO questions (pregunta, opcion1, opcion2) VALUES 
('¿Prefieres trabajar desde casa o en la oficina?', 'Casa', 'Oficina'),
('¿Qué prefieres: Té o Café?', 'Té', 'Café'),
('¿JavaScript o TypeScript?', 'JavaScript', 'TypeScript');
