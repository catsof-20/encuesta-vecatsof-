require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

const newQuestions = [
    { q: '¿Qué tipo de viaje prefieres?', opts: ['Aventura extrema y adrenalina', 'Cultura, museos y arte local', 'Retiro espiritual en la naturaleza'], v: [0, 0, 0] },
    { q: '¿Cómo resuelves un problema difícil?', opts: ['Actúo rápido y decido sobre la marcha', 'Busco una solución creativa y original', 'Analizo todos los datos antes de decidir'], v: [0, 0, 0] },
    { q: '¿Qué tipo de música te recarga?', opts: ['Rock, pop o ritmos intensos', 'Indie, alternativa o electrónica', 'Clásica, ambiental o sonidos de la naturaleza'], v: [0, 0, 0] },
    { q: '¿Cómo es tu espacio de trabajo ideal?', opts: ['Dinámico, con gente y muchas pantallas', 'Inspirador, con arte y un toque caótico', 'Ordenado, minimalista y muy silencioso'], v: [0, 0, 0] },
    { q: '¿Qué buscas en un regalo para alguien especial?', opts: ['Una experiencia emocionante o sorpresa', 'Algo único, artesanal o simbólico', 'Algo práctico, duradero y de calidad'], v: [0, 0, 0] },
    { q: '¿Cuándo es tu reacción ante los imprevistos?', opts: ['Los veo como un reto y me activo', 'Me adapto con una idea ingeniosa', 'Mantengo la calma y busco la lógica'], v: [0, 0, 0] },
    { q: '¿Qué animal te representa mejor?', opts: ['León o Águila (Liderazgo y fuerza)', 'Delfín o Mariposa (Libertad y juego)', 'Búho o Lobo (Sabiduría y lealtad)'], v: [0, 0, 0] },
    { q: '¿Cómo prefieres ser recordado?', opts: ['Por mis grandes logros y valentía', 'Por mi originalidad y visión del mundo', 'Por mi integridad y sabios consejos'], v: [0, 0, 0] }
];

async function seed() {
    console.log('🌱 Expandiendo base de preguntas...');
    for (const q of newQuestions) {
        try {
            await pool.query('INSERT INTO questions (pregunta, options, votes) VALUES ($1, $2, $3)', [q.q, JSON.stringify(q.opts), JSON.stringify(q.v)]);
            console.log(`✅ Añadida: ${q.q}`);
        } catch (err) {
            console.error(`❌ Error al añadir "${q.q}":`, err.message);
        }
    }
    await pool.end();
}

seed();
