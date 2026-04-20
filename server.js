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

// Servir la raíz del proyecto (index.html, app.js, style.css)
app.use(express.static(path.join(__dirname)));

// ──────────────────────────────────────────────────────────
// Selección de Base de Datos (PostgreSQL o SQLite)
// ──────────────────────────────────────────────────────────
let dbType = 'postgres';
let pool;
let localDb;

if (process.env.DATABASE_URL) {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes('supabase')
      ? { rejectUnauthorized: false }
      : false
  });
  console.log('✅ Conexión establecida con la nube (Supabase).');
} else {
  dbType = 'sqlite';
  const Database = require('better-sqlite3');
  localDb = new Database('database.sqlite');
  console.log('ℹ️ DATABASE_URL no encontrada. Usando base de datos local (SQLite).');
}

// Función universal para ejecutar queries
async function runQuery(sql, params = []) {
  if (dbType === 'postgres') {
    return await pool.query(sql, params);
  } else {
    const sqliteSql = sql.replace(/\$(\d+)/g, '?');
    const statement = localDb.prepare(sqliteSql);
    if (sqliteSql.trim().toUpperCase().startsWith('SELECT')) {
      const rows = statement.all(params);
      return { rows };
    } else {
      const result = statement.run(params);
      return { rows: [{ id: result.lastInsertRowid }], rowCount: result.changes };
    }
  }
}

// Inicialización Universal de la Base de Datos
async function initDB() {
  const isPostgres = dbType === 'postgres';
  
  // SQL adaptado según motor
  const sqlTables = [
    `CREATE TABLE IF NOT EXISTS clientes (
      id ${isPostgres ? 'SERIAL' : 'INTEGER'} PRIMARY KEY ${isPostgres ? '' : 'AUTOINCREMENT'},
      nombre TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      telefono TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS direcciones (
      id ${isPostgres ? 'SERIAL' : 'INTEGER'} PRIMARY KEY ${isPostgres ? '' : 'AUTOINCREMENT'},
      cliente_id INTEGER NOT NULL,
      calle TEXT,
      ciudad TEXT,
      codigo_postal TEXT,
      provincia TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS questions (
      id ${isPostgres ? 'SERIAL' : 'INTEGER'} PRIMARY KEY ${isPostgres ? '' : 'AUTOINCREMENT'},
      pregunta TEXT NOT NULL,
      options TEXT NOT NULL,
      votes TEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS suggestions (
      id ${isPostgres ? 'SERIAL' : 'INTEGER'} PRIMARY KEY ${isPostgres ? '' : 'AUTOINCREMENT'},
      name TEXT NOT NULL,
      text TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`
  ];

  for (const sql of sqlTables) {
    await runQuery(sql);
  }

  // Verificar si hay preguntas e insertar si está vacío
  const countResult = await runQuery('SELECT COUNT(*) as count FROM questions');
  const count = parseInt(countResult.rows[0].count);

  if (count === 0) {
    console.log('📦 Inicializando preguntas por defecto...');
    const defaultQuestions = [
      { q: '¿Qué color te atrae más instintivamente?', opts: ['Rojo o Naranja (Energía y Acción)', 'Amarillo o Púrpura (Creatividad e Imaginación)', 'Azul o Verde (Paz y Análisis)'], v: [0, 0, 0] },
      { q: '¿Cómo prefieres pasar tus fines de semana?', opts: ['Explorando nuevos lugares y aventuras', 'Dedicando tiempo a un hobby creativo o arte', 'Disfrutando de la tranquilidad y el silencio'], v: [0, 0, 0] },
      { q: 'Si tu personalidad fuera una estación, ¿cuál sería?', opts: ['Verano (Intenso y brillante)', 'Primavera (Renacimiento y color)', 'Otoño o Invierno (Profundo y reflexivo)'], v: [0, 0, 0] },
      { q: '¿Con qué tipo de ambiente conectas mejor?', opts: ['Un concierto o evento social lleno de gente', 'Una galería de arte o café temático', 'Una biblioteca o un bosque en calma'], v: [0, 0, 0] },
      { q: '¿Qué buscas principalmente en un nuevo proyecto?', opts: ['Resultados rápidos e impacto inmediato', 'Originalidad y libertad de expresión', 'Estabilidad y un plan bien estructurado'], v: [0, 0, 0] },
      { q: '¿Cómo te expresas mejor ante los demás?', opts: ['A través de mis acciones y liderazgo', 'A través de mi estilo y mis ideas únicas', 'A través de mis palabras y mi escucha atenta'], v: [0, 0, 0] },
      { q: '¿Qué tipo de decoración prefieres en tu hogar?', opts: ['Vibrante, con muchos contrastes y energía', 'Ecléctica, con objetos con alma e historia', 'Minimalista, con tonos neutros y orden'], v: [0, 0, 0] },
      { q: '¿Cuál de estos elementos te define mejor?', opts: ['Fuego (Transformador y potente)', 'Aire (Libre y siempre en movimiento)', 'Tierra o Agua (Sólido y profundo)'], v: [0, 0, 0] },
      { q: '¿Qué tipo de viaje prefieres?', opts: ['Aventura extrema y adrenalina', 'Cultura, museos y arte local', 'Retiro espiritual en la naturaleza'], v: [0, 0, 0] },
      { q: '¿Cómo resuelves un problema difícil?', opts: ['Actúo rápido y decido sobre la marcha', 'Busco una solución creativa y original', 'Analizo todos los datos antes de decidir'], v: [0, 0, 0] },
      { q: '¿Qué tipo de música te recarga?', opts: ['Rock, pop o ritmos intensos', 'Indie, alternativa o electrónica', 'Clásica, ambiental o sonidos de la naturaleza'], v: [0, 0, 0] },
      { q: '¿Cómo es tu espacio de trabajo ideal?', opts: ['Dinámico, con gente y muchas pantallas', 'Inspirador, con arte y un toque caótico', 'Ordenado, minimalista y muy silencioso'], v: [0, 0, 0] },
      { q: '¿Qué buscas en un regalo para alguien especial?', opts: ['Una experiencia emocionante o sorpresa', 'Algo único, artesanal o simbólico', 'Algo práctico, duradero y de calidad'], v: [0, 0, 0] },
      { q: '¿Cuál es tu reacción ante los imprevistos?', opts: ['Los veo como un reto y me activo', 'Me adapto con una idea ingeniosa', 'Mantengo la calma y busco la lógica'], v: [0, 0, 0] },
      { q: '¿Qué animal te representa mejor?', opts: ['León o Águila (Liderazgo y fuerza)', 'Delfín o Mariposa (Libertad y juego)', 'Búho o Lobo (Sabiduría y lealtad)'], v: [0, 0, 0] },
      { q: '¿Cómo prefieres ser recordado?', opts: ['Por mis grandes logros y valentía', 'Por mi originalidad y visión del mundo', 'Por mi integridad y sabios consejos'], v: [0, 0, 0] }
    ];

    for (const q of defaultQuestions) {
      await runQuery('INSERT INTO questions (pregunta, options, votes) VALUES ($1, $2, $3)', [q.q, JSON.stringify(q.opts), JSON.stringify(q.v)]);
    }
  }
}

initDB().catch(err => console.error('❌ Error de inicialización:', err));

// ──────────────────────────────────────────────────────────
// API: Registro de Clientes
// ──────────────────────────────────────────────────────────
app.post('/api/register', async (req, res) => {
  const { personal, address } = req.body;
  if (!personal || !address) {
    return res.status(400).json({ error: 'Faltan datos en el registro.' });
  }
  try {
    // Usamos el cliente para transacciones si es Postgres, o la función universal si es SQLite
    if (dbType === 'postgres') {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const insertClienteSql = 'INSERT INTO clientes (nombre, email, password, telefono) VALUES ($1, $2, $3, $4) RETURNING id';
        const resultCliente = await client.query(insertClienteSql, [personal.nombre, personal.email, personal.password, personal.telefono || null]);
        const clienteId = resultCliente.rows[0].id;

        const insertDireccionSql = 'INSERT INTO direcciones (cliente_id, calle, ciudad, codigo_postal, provincia) VALUES ($1, $2, $3, $4, $5)';
        await client.query(insertDireccionSql, [clienteId, address.calle || '', address.ciudad || '', address.zip || '', address.provincia || '']);
        await client.query('COMMIT');
        res.json({ success: true, message: 'Cliente registrado con éxito.' });
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    } else {
      // Para SQLite (que no requiere manejo de cliente explícito aquí por ser simple)
      const resultCliente = await runQuery('INSERT INTO clientes (nombre, email, password, telefono) VALUES ($1, $2, $3, $4)', [personal.nombre, personal.email, personal.password, personal.telefono || null]);
      const clienteId = resultCliente.rows[0].id;
      await runQuery('INSERT INTO direcciones (cliente_id, calle, ciudad, codigo_postal, provincia) VALUES ($1, $2, $3, $4, $5)', [clienteId, address.calle || '', address.ciudad || '', address.zip || '', address.provincia || '']);
      res.json({ success: true, message: 'Cliente registrado con éxito.' });
    }
  } catch (err) {
    console.error('Error al registrar:', err.message);
    if (err.code === '23505' || err.message.includes('UNIQUE constraint failed')) {
      return res.status(409).json({ error: 'Este email ya está registrado.' });
    }
    res.status(500).json({ error: 'Error al guardar en la base de datos.' });
  }
});

// ──────────────────────────────────────────────────────────
// API: Login
// ──────────────────────────────────────────────────────────
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await runQuery('SELECT * FROM clientes WHERE email = $1 AND password = $2', [email, password]);
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
    // Retornamos 10 preguntas al azar para que el test sea dinámico
    const randomSql = dbType === 'postgres' ? 'SELECT * FROM questions ORDER BY RANDOM() LIMIT 10' : 'SELECT * FROM questions ORDER BY RANDOM() LIMIT 10';
    const result = await runQuery(randomSql);
    const formattedQuestions = result.rows.map(row => ({
       id: row.id,
       q: row.pregunta,
       options: typeof row.options === 'string' ? JSON.parse(row.options) : row.options,
       votes: typeof row.votes === 'string' ? JSON.parse(row.votes) : row.votes
    }));
    
    res.json({ questions: formattedQuestions });
  } catch (err) {
    console.error('Error al obtener preguntas:', err);
    res.status(500).json({ error: err.message });
  }
});

// ──────────────────────────────────────────────────────────
// API: Registrar Votos
// ──────────────────────────────────────────────────────────
app.post('/api/vote', async (req, res) => {
  const { answers } = req.body;
  if (!answers || !Array.isArray(answers)) {
    return res.status(400).json({ error: 'Formato de respuestas inválido.' });
  }

  try {
    const updatedVotes = {};
    for (const ans of answers) {
      const { questionId, optionIndex } = ans;
      
      // Obtener votos actuales
      const result = await runQuery('SELECT votes FROM questions WHERE id = $1', [questionId]);
      if (result.rows.length > 0) {
        let votes = typeof result.rows[0].votes === 'string' ? JSON.parse(result.rows[0].votes) : result.rows[0].votes;
        
        // Incrementar el voto en el índice correspondiente
        if (votes[optionIndex] !== undefined) {
          votes[optionIndex]++;
          await runQuery('UPDATE questions SET votes = $1 WHERE id = $2', [JSON.stringify(votes), questionId]);
          updatedVotes[questionId] = votes;
        }
      }
    }
    res.json({ success: true, updatedVotes });
  } catch (err) {
    console.error('Error al votar:', err.message);
    res.status(500).json({ error: 'Error al procesar los votos.' });
  }
});

// ──────────────────────────────────────────────────────────
// API: Enviar Sugerencia
// ──────────────────────────────────────────────────────────
app.post('/api/suggest', async (req, res) => {
  const { name, text } = req.body;
  if (!name || !text) {
    return res.status(400).json({ error: 'Nombre y texto son requeridos.' });
  }

  try {
    await runQuery('INSERT INTO suggestions (name, text) VALUES ($1, $2)', [name, text]);
    res.json({ success: true, message: 'Sugerencia recibida con éxito.' });
  } catch (err) {
    console.error('Error al guardar sugerencia:', err.message);
    res.status(500).json({ error: 'Error al guardar la sugerencia.' });
  }
});

// ──────────────────────────────────────────────────────────
// Manejo de SPA: Redirigir todas las rutas no-API al index.html
// ──────────────────────────────────────────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en el puerto ${PORT}`);
});
