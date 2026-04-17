require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Servir archivos estáticos del build de Vite en producción
app.use(express.static(path.join(__dirname, 'dist')));

// ──────────────────────────────────────────────────────────
// Conexión a PostgreSQL (Supabase)
// ──────────────────────────────────────────────────────────
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Es importante habilitar SSL para Render o Supabase
  ssl: process.env.DATABASE_URL && process.env.DATABASE_URL.includes('supabase')
    ? { rejectUnauthorized: false }
    : false
});

pool.connect((err, client, release) => {
  if (err) {
    console.error('⚠️ Error conectando a PostgreSQL (Supabase). Asegúrate de tener DATABASE_URL configurado:', err.message);
  } else {
    console.log('✅ Conectado exitosamente a la base de datos PostgreSQL (Supabase).');
    release(); // Liberar el cliente tras verificar la conexión
  }
});

// ──────────────────────────────────────────────────────────
// API: Registro de Clientes
// ──────────────────────────────────────────────────────────
app.post('/api/register', async (req, res) => {
  const { personal, address } = req.body;
  if (!personal || !address) {
    return res.status(400).json({ error: 'Faltan datos en el registro.' });
  }

  const client = await pool.connect();
  try {
    // Iniciar transacción (si falla uno, no se guarda nada)
    await client.query('BEGIN');

    // Mapeamos lo que enviaba SQLite con db.prepare a PostgreSQL ($1, $2...)
    const insertClienteParams = [personal.nombre, personal.email, personal.password, personal.telefono || null];
    const insertClienteSql = 'INSERT INTO clientes (nombre, email, password, telefono) VALUES ($1, $2, $3, $4) RETURNING id';
    
    const resultCliente = await client.query(insertClienteSql, insertClienteParams);
    const clienteId = resultCliente.rows[0].id;

    const insertDireccionParams = [clienteId, address.calle || '', address.ciudad || '', address.zip || '', address.provincia || ''];
    const insertDireccionSql = 'INSERT INTO direcciones (cliente_id, calle, ciudad, codigo_postal, provincia) VALUES ($1, $2, $3, $4, $5)';
    
    await client.query(insertDireccionSql, insertDireccionParams);

    // Confirmar transacción
    await client.query('COMMIT');
    res.json({ success: true, message: 'Cliente registrado con éxito.' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error al registrar:', err.message);
    if (err.code === '23505') { // 23505 es el error de unique constraint violation en PostgreSQL
      return res.status(409).json({ error: 'Este email ya está registrado.' });
    }
    res.status(500).json({ error: 'Error al guardar en la base de datos.' });
  } finally {
    client.release();
  }
});

// ──────────────────────────────────────────────────────────
// API: Login
// ──────────────────────────────────────────────────────────
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM clientes WHERE email = $1 AND password = $2', [email, password]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Credenciales inválidas.' });
    }
    res.json({ success: true, user: { nombre: result.rows[0].nombre, email: result.rows[0].email } });
  } catch (err) {
    console.error('Error en login:', err.message);
    res.status(500).json({ error: 'Error en el servidor.' });
  }
});

// ──────────────────────────────────────────────────────────
// API: Obtener Preguntas
// ──────────────────────────────────────────────────────────
app.get('/api/questions', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM questions');
    // Para adaptarlo fácil al frontend (que usaba JSON con opciones de array) 
    // mapeamos la respuesta de la BD:
    const formattedQuestions = result.rows.map(row => ({
       id: row.id,
       q: row.pregunta,
       options: [row.opcion1, row.opcion2],
       votes: [row.votos1, row.votos2]
    }));
    
    res.json({ questions: formattedQuestions });
  } catch (err) {
    console.error('Error al obtener preguntas:', err);
    res.status(500).json({ error: err.message });
  }
});

// ──────────────────────────────────────────────────────────
// Manejo de SPA: Redirigir todas las rutas no-API al index.html
// ──────────────────────────────────────────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en el puerto ${PORT}`);
});
