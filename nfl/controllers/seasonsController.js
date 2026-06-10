const db = require('../config/db'); 

// RESUMEN DE TEMPORADA
const getSeasonOverview = async (req, res) => {
    const { year } = req.params;

    try {
        const [gamesCount] = await db.query(`
            SELECT COUNT(*) AS total_games
            FROM games g
            JOIN seasons s ON s.season_id = g.season_id
            WHERE s.year = ?
        `, [year]);

        const [highestGame] = await db.query(`
            SELECT
                ht.abbreviation AS home_team,
                at.abbreviation AS away_team,
                g.home_score,
                g.away_score,
                (g.home_score + g.away_score) AS total_points
            FROM games g
            JOIN seasons s ON s.season_id = g.season_id
            JOIN teams ht ON ht.team_id = g.home_team_id
            JOIN teams at ON at.team_id = g.away_team_id
            WHERE s.year = ?
            ORDER BY total_points DESC
            LIMIT 1
        `, [year]);

        // Promedio de puntos por partido en esa temporada
        const [avgPoints] = await db.query(`
            SELECT
                ROUND(AVG(g.home_score + g.away_score), 1) AS avg_total,
                ROUND(AVG(g.home_score), 1) AS avg_home,
                ROUND(AVG(g.away_score), 1) AS avg_away,
                SUM(CASE WHEN g.home_score > g.away_score THEN 1 ELSE 0 END) AS home_wins,
                SUM(CASE WHEN g.away_score > g.home_score THEN 1 ELSE 0 END) AS away_wins,
                SUM(CASE WHEN g.home_score = g.away_score THEN 1 ELSE 0 END) AS ties
            FROM games g
            JOIN seasons s ON s.season_id = g.season_id
            WHERE s.year = ?
        `, [year]);

        // Top 5 equipos más dominantes (más victorias) en esa temporada
        const [topTeams] = await db.query(`
            SELECT
                t.team_name,
                t.abbreviation,
                COUNT(g.game_id) AS played,
                SUM(CASE WHEN g.winner_team_id = t.team_id THEN 1 ELSE 0 END) AS wins,
                SUM(CASE WHEN g.winner_team_id IS NOT NULL AND g.winner_team_id != t.team_id THEN 1 ELSE 0 END) AS losses,
                ROUND(SUM(CASE WHEN g.winner_team_id = t.team_id THEN 1 ELSE 0 END) / COUNT(g.game_id) * 100, 1) AS win_pct
            FROM teams t
            JOIN games g ON (t.team_id = g.home_team_id OR t.team_id = g.away_team_id)
            JOIN seasons s ON g.season_id = s.season_id
            WHERE s.year = ?
            GROUP BY t.team_id, t.team_name, t.abbreviation
            ORDER BY wins DESC
            LIMIT 5
        `, [year]);

        res.json({
            totalGames: gamesCount[0].total_games,
            highestGame: highestGame[0] || null,
            avgPoints: avgPoints[0] || null,
            topTeams: topTeams
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

// SEMANAS DE LA TEMPORADA (con filtro de fase)
const getSeasonWeeks = async (req, res) => {
    const { year } = req.params;
    const phase = req.query.phase || 'Regular';

    try {
        const [weeks] = await db.query(`
            SELECT
                w.week_id,
                w.week_number,
                w.week_type
            FROM weeks w
            JOIN seasons s ON s.season_id = w.season_id
            WHERE s.year = ? AND w.week_type = ?
            ORDER BY CAST(w.week_number AS UNSIGNED) ASC, w.week_id ASC
        `, [year, phase]);

        res.json(weeks);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

// PARTIDOS DE UNA SEMANA
const getGamesByWeek = async (req, res) => {
    const { weekId } = req.params;

    try {
        const [games] = await db.query(`
            SELECT
                g.game_id,
                DATE_FORMAT(g.game_date, '%Y-%m-%d') AS game_date,
                TIME_FORMAT(g.game_time, '%H:%i') AS game_time,
                g.home_score,
                g.away_score,
                g.stadium,
                g.winner_team_id,
                ht.team_name AS home_team,
                ht.abbreviation AS home_abbr,
                ht.team_id AS home_team_id,
                at.team_name AS away_team,
                at.abbreviation AS away_abbr,
                at.team_id AS away_team_id,
                (g.home_score + g.away_score) AS total_points
            FROM games g
            JOIN teams ht ON ht.team_id = g.home_team_id
            JOIN teams at ON at.team_id = g.away_team_id
            WHERE g.week_id = ?
            ORDER BY g.game_date ASC, g.game_time ASC
        `, [weekId]);

        res.json(games);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

// TABLA DE POSICIONES POR TEMPORADA
const getSeasonStandings = async (req, res) => {
    const { year } = req.params;

    try {
        const [rows] = await db.query(`
            SELECT
                t.team_id,
                t.team_name,
                t.abbreviation,
                t.conference,
                t.division,
                COUNT(g.game_id) AS played,
                SUM(CASE WHEN g.winner_team_id = t.team_id THEN 1 ELSE 0 END) AS wins,
                SUM(CASE WHEN g.winner_team_id IS NOT NULL AND g.winner_team_id != t.team_id THEN 1 ELSE 0 END) AS losses,
                SUM(CASE WHEN g.winner_team_id IS NULL THEN 1 ELSE 0 END) AS ties,
                ROUND(
                    SUM(CASE WHEN g.winner_team_id = t.team_id THEN 1 ELSE 0 END)
                    / COUNT(g.game_id) * 100, 1
                ) AS win_pct,
                -- Puntos anotados y recibidos
                SUM(CASE WHEN g.home_team_id = t.team_id THEN g.home_score ELSE g.away_score END) AS pts_for,
                SUM(CASE WHEN g.home_team_id = t.team_id THEN g.away_score ELSE g.home_score END) AS pts_against,
                ROUND(AVG(CASE WHEN g.home_team_id = t.team_id THEN g.home_score ELSE g.away_score END), 1) AS avg_scored,
                ROUND(AVG(CASE WHEN g.home_team_id = t.team_id THEN g.away_score ELSE g.home_score END), 1) AS avg_allowed
            FROM teams t
            JOIN games g ON (t.team_id = g.home_team_id OR t.team_id = g.away_team_id)
            JOIN seasons s ON g.season_id = s.season_id
            WHERE s.year = ?
            GROUP BY t.team_id, t.team_name, t.abbreviation, t.conference, t.division
            ORDER BY wins DESC, win_pct DESC
        `, [year]);

        res.json(rows);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

// PARTIDOS DIRECTOS POR FASE (Playoffs)
const getGamesByPhase = async (req, res) => {
    const { year, phase } = req.params;

    try {
        const [games] = await db.query(`
            SELECT
                g.game_id,
                DATE_FORMAT(g.game_date, '%Y-%m-%d') AS game_date,
                TIME_FORMAT(g.game_time, '%H:%i') AS game_time,
                g.home_score,
                g.away_score,
                g.stadium,
                g.winner_team_id,
                ht.team_name AS home_team,
                ht.abbreviation AS home_abbr,
                ht.team_id AS home_team_id,
                at.team_name AS away_team,
                at.abbreviation AS away_abbr,
                at.team_id AS away_team_id,
                (g.home_score + g.away_score) AS total_points
            FROM games g
            JOIN seasons s ON s.season_id = g.season_id
            JOIN weeks w ON w.week_id = g.week_id
            JOIN teams ht ON ht.team_id = g.home_team_id
            JOIN teams at ON at.team_id = g.away_team_id
            WHERE s.year = ? AND w.week_type = ?
            ORDER BY g.game_date ASC, g.game_time ASC
        `, [year, phase]);

        res.json(games);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

// PROMEDIOS HISTÓRICOS (todos los años)
const getAllTimeStandings = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT
                t.team_id,
                t.team_name,
                t.abbreviation,
                t.conference,
                t.division,
                COUNT(g.game_id) AS played,
                SUM(CASE WHEN g.winner_team_id = t.team_id THEN 1 ELSE 0 END) AS wins,
                SUM(CASE WHEN g.winner_team_id IS NOT NULL AND g.winner_team_id != t.team_id THEN 1 ELSE 0 END) AS losses,
                SUM(CASE WHEN g.winner_team_id IS NULL THEN 1 ELSE 0 END) AS ties,
                ROUND(
                    SUM(CASE WHEN g.winner_team_id = t.team_id THEN 1 ELSE 0 END)
                    / NULLIF(COUNT(CASE WHEN g.home_score IS NOT NULL THEN 1 END), 0) * 100, 1
                ) AS win_pct,
                ROUND(AVG(CASE WHEN g.home_team_id = t.team_id AND g.home_score IS NOT NULL THEN g.home_score
                               WHEN g.away_team_id = t.team_id AND g.away_score IS NOT NULL THEN g.away_score END), 1) AS avg_scored,
                ROUND(AVG(CASE WHEN g.home_team_id = t.team_id AND g.away_score IS NOT NULL THEN g.away_score
                               WHEN g.away_team_id = t.team_id AND g.home_score IS NOT NULL THEN g.home_score END), 1) AS avg_allowed,
                SUM(CASE WHEN g.home_team_id = t.team_id AND g.home_score IS NOT NULL THEN g.home_score
                         WHEN g.away_team_id = t.team_id AND g.away_score IS NOT NULL THEN g.away_score ELSE 0 END) AS pts_for,
                SUM(CASE WHEN g.home_team_id = t.team_id AND g.away_score IS NOT NULL THEN g.away_score
                         WHEN g.away_team_id = t.team_id AND g.home_score IS NOT NULL THEN g.home_score ELSE 0 END) AS pts_against
            FROM teams t
            JOIN games g ON (t.team_id = g.home_team_id OR t.team_id = g.away_team_id)
            WHERE g.home_score IS NOT NULL
            GROUP BY t.team_id, t.team_name, t.abbreviation, t.conference, t.division
            ORDER BY wins DESC
        `);
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    getSeasonOverview,
    getSeasonWeeks,
    getGamesByWeek,
    getSeasonStandings,
    getGamesByPhase,
    getAllTimeStandings
};
