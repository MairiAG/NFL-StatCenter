const express = require('express');
const cors    = require('cors');
require('dotenv').config();
const path = require('path');
const db   = require('./config/db'); // Necesario para las rutas inline si las conservas

const app = express();

app.use(cors());
app.use(express.json());

// ==========================
// FRONTEND (archivos estáticos)
// ==========================
app.use(express.static(path.join(__dirname, 'frontend')));

// ==========================
// RUTAS API
// ==========================
app.use('/teams',        require('./routes/teamsRoutes'));
app.use('/games',        require('./routes/gamesRoutes'));
app.use('/stats',        require('./routes/statsRoutes'));
app.use('/seasons-api',  require('./routes/seasonsRoutes')); // ← DESCOMENTADO Y LIMPIO

// ==========================
// RUTAS DE PÁGINAS (SPA-style)
// ==========================

// Ruta para la página de temporada: /seasons/2025 → seasons.html
app.get('/seasons/:year', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'seasons.html'));
});

// Ruta para head-to-head directo desde URL
app.get('/h2h', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

// ==========================
// INICIAR SERVIDOR
// ==========================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`✅ NFL StatCenter corriendo en http://localhost:${PORT}`);
});