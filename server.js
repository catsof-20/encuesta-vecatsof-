require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Servir archivos estáticos del build de Vite en producción
app.use(express.static(path.join(__dirname, 'dist')));

// Configuración de la conexión a MySQL (Usando variables de entorno)
const db = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'vecatsof_db',
    port: process.env.DB_PORT || 3306
});

// Conectar a la base de datos
db.connect((err) => {
    if (err) {
        console.error('Error conectando a MySQL:', err.message);
        return;
    }
    console.log('Conectado exitosamente a la base de datos MySQL.');
});

// API: Registro de Clientes
app.post('/api/register', (req, res) => {
    const { personal, address } = req.body;
    if (!personal || !address) {
        return res.status(400).json({ error: 'Faltan datos en el registro.' });
    }

    db.beginTransaction((err) => {
        if (err) throw err;
        const sqlClient = 'INSERT INTO clientes (nombre, email, password, telefono) VALUES (?, ?, ?, ?)';
        db.query(sqlClient, [personal.nombre, personal.email, personal.password, personal.telefono], (err, result) => {
            if (err) {
                return db.rollback(() => {
                    res.status(500).json({ error: 'Email ya registrado o error en DB.' });
                });
            }
            const clienteId = result.insertId;
            const sqlAddress = 'INSERT INTO direcciones (cliente_id, calle, ciudad, codigo_postal, provincia) VALUES (?, ?, ?, ?, ?)';
            db.query(sqlAddress, [clienteId, address.calle, address.ciudad, address.zip, address.provincia], (err) => {
                if (err) {
                    return db.rollback(() => {
                        res.status(500).json({ error: 'Error al guardar la dirección.' });
                    });
                }
                db.commit((err) => {
                    if (err) {
                        return db.rollback(() => {
                            res.status(500).json({ error: 'Error al finalizar el registro.' });
                        });
                    }
                    res.json({ success: true, message: 'Cliente registrado con éxito.' });
                });
            });
        });
    });
});

// API: Login
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    const sql = 'SELECT * FROM clientes WHERE email = ? AND password = ?';
    db.query(sql, [email, password], (err, results) => {
        if (err || results.length === 0) {
            return res.status(401).json({ error: 'Credenciales inválidas.' });
        }
        res.json({ success: true, user: { nombre: results[0].nombre, email: results[0].email } });
    });
});

// API: Obtener Preguntas
app.get('/api/questions', (req, res) => {
    db.query('SELECT * FROM questions', (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// Manejo de SPA: Redirigir todas las rutas no-API al index.html de Vite
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});
