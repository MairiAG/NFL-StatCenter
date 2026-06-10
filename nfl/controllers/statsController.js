const db = require('../config/db');

// 1. RENDIMIENTO GENERAL (Para saber quién es favorito y armar tablas de posiciones)
// Devuelve partidos jugados, ganados, perdidos, empatados y efectividad de victoria.
const getBettingStandings = async (req, res) => {
    try {
        const [rows] = await db.execute(
            `SELECT 
                t.team_id,
                t.team_name,
                t.abbreviation,
                COUNT(g.game_id) AS partidos_jugados,
                SUM(CASE WHEN g.winner_team_id = t.team_id THEN 1 ELSE 0 END) AS ganados,
                SUM(CASE WHEN g.winner_team_id IS NOT NULL AND g.winner_team_id != t.team_id THEN 1 ELSE 0 END) AS perdidos,
                SUM(CASE WHEN g.winner_team_id IS NULL THEN 1 ELSE 0 END) AS empatados,
                ROUND((SUM(CASE WHEN g.winner_team_id = t.team_id THEN 1 ELSE 0 END) / COUNT(g.game_id)) * 100, 2) AS efectividad_victoria
            FROM teams t
            JOIN games g ON t.team_id = g.home_team_id OR t.team_id = g.away_team_id
            GROUP BY t.team_id, t.team_name, t.abbreviation
            ORDER BY ganados DESC`
        );
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al obtener estadísticas de posiciones' });
    }
};

// 2. RENDIMIENTO LOCAL VS VISITANTE 
// Analiza si un equipo se hace fuerte en casa o si es buen visitante.
const getHomeVsAwayStats = async (req, res) => {
    try {
        const [rows] = await db.execute(
            `SELECT 
                t.team_name,
                -- Estadísticas de Local
                COUNT(CASE WHEN g.home_team_id = t.team_id THEN 1 END) AS juegos_local,
                SUM(CASE WHEN g.home_team_id = t.team_id AND g.winner_team_id = t.team_id THEN 1 ELSE 0 END) AS ganados_local,
                -- Estadísticas de Visitante
                COUNT(CASE WHEN g.away_team_id = t.team_id THEN 1 END) AS juegos_visitante,
                SUM(CASE WHEN g.away_team_id = t.team_id AND g.winner_team_id = t.team_id THEN 1 ELSE 0 END) AS ganados_visitante
            FROM teams t
            JOIN games g ON t.team_id = g.home_team_id OR t.team_id = g.away_team_id
            GROUP BY t.team_id, t.team_name
            ORDER BY t.team_name ASC`
        );
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al obtener estadísticas Local/Visitante' });
    }
};

// 3. PROMEDIO DE PUNTOS ANOTADOS Y RECIBIDOS 
const getPointsAnalysis = async (req, res) => {
    try {
        const [rows] = await db.execute(
            `SELECT 
                t.team_name,
                -- Puntos que anota el equipo en promedio por partido
                ROUND(AVG(CASE WHEN g.home_team_id = t.team_id THEN g.home_score ELSE g.away_score END), 1) AS avg_puntos_anotados,
                -- Puntos que le anotan al equipo (recibidos) en promedio
                ROUND(AVG(CASE WHEN g.home_team_id = t.team_id THEN g.away_score ELSE g.home_score END), 1) AS avg_puntos_recibidos,
                -- Promedio total de puntos en los que participa este equipo (Suma de ambos)
                ROUND(AVG(g.home_score + g.away_score), 1) AS avg_puntos_totales_juego
            FROM teams t
            JOIN games g ON t.team_id = g.home_team_id OR t.team_id = g.away_team_id
            GROUP BY t.team_id, t.team_name
            ORDER BY avg_puntos_anotados DESC`
        );
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al obtener análisis de puntos' });
    }
};

// 4. HISTORIAL CARA A CARA / HEAD-TO-HEAD 
// Envías los IDs de dos equipos y te dice cómo han quedado históricamente entre ellos.
const getHeadToHead = async (req, res) => {
    const { teamA, teamB } = req.query; // Se reciben por query string: ?teamA=1&teamB=2

    if (!teamA || !teamB) {
        return res.status(400).json({ error: 'Faltan los parámetros teamA y teamB' });
    }

    try {
        const [rows] = await db.execute(
            `SELECT 
                g.game_id,
                g.game_date,
                s.year AS season_year,
                ht.team_name AS home_team,
                at.team_name AS away_team,
                g.home_score,
                g.away_score,
                wt.team_name AS winner_team
            FROM games g
            JOIN seasons s ON g.season_id = s.season_id
            JOIN teams ht ON g.home_team_id = ht.team_id
            JOIN teams at ON g.away_team_id = at.team_id
            LEFT JOIN teams wt ON g.winner_team_id = wt.team_id
            WHERE (g.home_team_id = ? AND g.away_team_id = ?) 
               OR (g.home_team_id = ? AND g.away_team_id = ?)
            ORDER BY g.game_date DESC`,
            [teamA, teamB, teamB, teamA]
        );
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al obtener historial Cara a Cara' });
    }
};

// 5. PARTIDOS MÁS RECIENTES CON DETALLES DE APUESTA 
// Trae los últimos 50 partidos jugados listando fecha, hora limpia, marcador, y quién cumplió el Over/Under general de la NFL (ej. 45 puntos)
const getRecentGamesSummary = async (req, res) => {
    try {
        const [rows] = await db.execute(
            `SELECT 
                g.game_id,
                DATE_FORMAT(g.game_date, '%Y-%m-%d') AS date,
                TIME_FORMAT(g.game_time, '%H:%i') AS time,
                ht.team_name AS home_team,
                at.team_name AS away_team,
                g.home_score,
                g.away_score,
                (g.home_score + g.away_score) AS puntos_totales,
                CASE 
                    WHEN (g.home_score + g.away_score) > 45 THEN 'OVER (45)'
                    ELSE 'UNDER (45)'
                END AS over_under_45_meta
            FROM games g
            JOIN teams ht ON g.home_team_id = ht.team_id
            JOIN teams at ON g.away_team_id = at.team_id
            ORDER BY g.game_date DESC, g.game_time DESC
            LIMIT 50`
        );
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al obtener resumen de juegos' });
    }
};

module.exports = {
    getBettingStandings,
    getHomeVsAwayStats,
    getPointsAnalysis,
    getHeadToHead,
    getRecentGamesSummary
};