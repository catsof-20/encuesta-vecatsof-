const express = require('express');
const cors = require('cors');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = process.env.PORT || 3000;
const DB_FILE = path.join(__dirname, 'database.sqlite');

const NUM_QUESTIONS_PER_SESSION = 10;

const initialQuestions = [
    {q: "Plan ideal para un sábado por la tarde:", options: ["Salir con amigos o buscar aventura", "Ir a un taller creativo o exposición", "Quedarme en casa leyendo/viendo series"]},
    {q: "¿Qué tipo de comida prefieres comer fuera?", options: ["Sitios nuevos, comida rápida y de moda", "Platos exóticos o internacionales", "Lugares acogedores, tradicionales caseros"]},
    {q: "¿Cuál es tu estación del año favorita?", options: ["Verano (Días largos, energía, playa)", "Primavera u Otoño (Colores, clima cálido)", "Invierno (Frío, lluvia, calor de hogar)"]},
    {q: "Cuando estás en grupo, sueles ser...", options: ["El centro de atención o quien habla más", "El que observa y aporta ideas creativas", "Quien mantiene el equilibrio y la calma"]},
    {q: "¿Qué tipo de mascota elegirías?", options: ["Un perro con mucha vitalidad", "Un animal exótico o inusual", "Un gato tranquilo e independiente"]},
    {q: "Si tuvieras vacaciones sorpresa mañana, irías a...", options: ["Una gran ciudad cosmopolita vibrante", "Un retiro espiritual o ruta exótica", "Una cabaña aislada en la montaña o bosque"]},
    {q: "Cuando te surge un problema importante...", options: ["Lo hablo inmediatamente para buscar acción", "Lo escribo o reflexiono creativamente", "Lo analizo minuciosamente yo mismo en silencio"]},
    {q: "Tu género de película ideal es...", options: ["Acción, aventuras o comedia animada", "Cine de autor, musicales o fantasía profunda", "Documental histórico o ciencia ficción dura"]},
    {q: "Tu bebida perfecta para una reunión:", options: ["Cervezas o cócteles muy coloridos", "Maté especial, café barista o vino selecto", "Agua, té tradicional o un café solo suave"]},
    {q: "Si mañana ganaras la lotería, lo primero que harías es...", options: ["Celebrarlo montando la mejor fiesta", "Invertir en mis pasiones y arte personal", "Ocultarlo y ahorrar e invertir inteligentemente"]},
    {q: "Si pudieras aprender una habilidad nueva ahora mismo, sería...", options: ["Deportes extremos (Surf, escalada)", "Arte, pintura o tocar un instrumento", "Ajedrez, filosofía o programación"]},
    {q: "El ambiente de trabajo de tus sueños es...", options: ["En constante movimiento y viajes", "Un estudio creativo abierto y colorido", "Una oficina tranquila, ordenada y silenciosa"]},
    {q: "¿Qué tipo de música te anima más?", options: ["Música electrónica o pop con mucho ritmo", "Indie alternativo o música instrumental", "Música clásica, lofi o sonidos relajantes"]},
    {q: "Cuando visitas una ciudad nueva, lo primero que buscas es...", options: ["La vida nocturna o actividades al aire libre", "Museos y barrios bohemios de artistas", "Cafeterías acogedoras, librerías o parques"]},
    {q: "¿Qué tipo de ropa suele dominar en tu armario?", options: ["Ropa deportiva, cómoda y muy colorida", "Ropa vintage, única o con estilos diferentes", "Prendas clásicas en colores neutros y sobrios"]},
    {q: "Para desconectar después de un día duro prefieres...", options: ["Ir al gimnasio, salir a correr o bailar", "Dibujar, escribir o algo manual", "Tomar un baño caliente, leer y meditar"]},
    {q: "¿Qué estilo de decoración te gusta para tu casa?", options: ["Moderna, llamativa y funcional", "Ecléctica, con muchas plantas y arte", "Minimalista, limpia y muy ordenada"]},
    {q: "Si tuvieras que escribir un libro, sería de...", options: ["Aventuras épicas o ciencia ficción de acción", "Poesía o novela de gran profundidad emocional", "Ensayo histórico o misterio psicológico"]},
    {q: "Al planificar un viaje, tú...", options: ["No planeas mucho, improvisas sobre la marcha", "Creas una lista de lugares únicos por visitar", "Tienes cada día y hora organizados matemáticamente"]},
    {q: "¿Cómo celebras tu cumpleaños ideal?", options: ["Una gran fiesta con multitudes de amigos", "Una cena temática con amigos cercanos", "Algo íntimo, tranquilo y personal"]}
];

const db = new sqlite3.Database(DB_FILE, (err) => {
    if (err) {
        console.error('Error al abrir la base de datos:', err.message);
    } else {
        console.log('Conectado a la base de datos SQLite.');
        db.serialize(() => {
            db.run(`CREATE TABLE IF NOT EXISTS questions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                q TEXT,
                opt0 TEXT,
                opt1 TEXT,
                opt2 TEXT
            )`);

            db.get("SELECT COUNT(*) as count FROM questions", (err, row) => {
                if (row && row.count === 0) {
                    const stmt = db.prepare(`INSERT INTO questions (q, opt0, opt1, opt2) VALUES (?, ?, ?, ?)`);
                    initialQuestions.forEach(item => {
                        stmt.run(item.q, item.options[0], item.options[1], item.options[2]);
                    });
                    stmt.finalize();
                    console.log("Banco de preguntas inicializado en la base de datos.");
                }
            });

            db.run(`CREATE TABLE IF NOT EXISTS multi_votes (
                questionId INTEGER,
                optionIndex INTEGER,
                count INTEGER DEFAULT 0,
                PRIMARY KEY (questionId, optionIndex)
            )`);

            db.run(`CREATE TABLE IF NOT EXISTS suggestions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT,
                suggestion TEXT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
            )`);
        });
    }
});

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

app.get('/api/questions', (req, res) => {
    db.all(`SELECT id, q, opt0, opt1, opt2 FROM questions ORDER BY RANDOM() LIMIT ${NUM_QUESTIONS_PER_SESSION}`, [], (err, qRows) => {
        if (err) return res.status(500).json({ error: err.message });

        const questionIds = qRows.map(r => r.id);
        const placeholders = questionIds.map(() => '?').join(',');

        db.all(`SELECT questionId, optionIndex, count FROM multi_votes WHERE questionId IN (${placeholders})`, questionIds, (err, vRows) => {
            if (err) return res.status(500).json({ error: err.message });

            const result = qRows.map(qr => {
                const votes = [0, 0, 0];
                vRows.forEach(vr => {
                    if (vr.questionId === qr.id) {
                        votes[vr.optionIndex] = vr.count;
                    }
                });
                return {
                    id: qr.id,
                    q: qr.q,
                    options: [qr.opt0, qr.opt1, qr.opt2],
                    votes: votes
                };
            });

            res.json({ questions: result });
        });
    });
});

app.post('/api/vote', (req, res) => {
    const { answers } = req.body;
    if (!Array.isArray(answers)) {
        return res.status(400).json({ error: 'Datos inválidos' });
    }

    db.serialize(() => {
        db.run('BEGIN TRANSACTION');
        answers.forEach(ans => {
            if (ans.optionIndex >= 0 && ans.optionIndex < 3) {
                db.run(`INSERT INTO multi_votes (questionId, optionIndex, count) 
                        VALUES (?, ?, 1) 
                        ON CONFLICT(questionId, optionIndex) DO UPDATE SET count = count + 1`,
                        [ans.questionId, ans.optionIndex]);
            }
        });
        db.run('COMMIT', (err) => {
            if (err) return res.status(500).json({ error: err.message });

            const questionIds = answers.map(a => a.questionId);
            const placeholders = questionIds.map(() => '?').join(',');

            db.all(`SELECT questionId, optionIndex, count FROM multi_votes WHERE questionId IN (${placeholders})`, questionIds, (err, rows) => {
                if (err) return res.status(500).json({ error: err.message });

                const updatedVotes = {};
                questionIds.forEach(id => updatedVotes[id] = [0, 0, 0]);
                rows.forEach(r => {
                    if (updatedVotes[r.questionId]) {
                        updatedVotes[r.questionId][r.optionIndex] = r.count;
                    }
                });
                res.json({ success: true, updatedVotes: updatedVotes });
            });
        });
    });
});

app.post('/api/suggest', (req, res) => {
    const { name, text } = req.body;
    if (!name || !text) return res.status(400).json({ error: 'Faltan campos' });

    db.run(`INSERT INTO suggestions (name, suggestion) VALUES (?, ?)`, [name, text], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, id: this.lastID });
    });
});

app.listen(PORT, () => {
    console.log(`Servidor de encuestas y personalidad corriendo en http://localhost:${PORT}`);
});
