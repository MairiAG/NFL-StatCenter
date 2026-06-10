const db = require('../config/db');

const getGames = async (req, res) => {
    try {
        const [rows] = await db.execute(
            `SELECT
                g.game_id,
                g.game_date,
                TIME_FORMAT(g.game_time, '%H:%i') AS game_time,
                ht.team_name AS home_team,
                at.team_name AS away_team,
                g.home_score,
                g.away_score,
                w.week_type
            FROM games g
            JOIN teams ht ON g.home_team_id = ht.team_id
            JOIN teams at ON g.away_team_id = at.team_id
            LEFT JOIN weeks w ON g.week_id = w.week_id
            ORDER BY g.game_date DESC`
        );
        res.json(rows);
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'Error obteniendo juegos' });
    }
};

// Calcula el historial Head-to-Head (H2H)
const getHeadToHead = async (req, res) => {
    const { teamA, teamB } = req.query;

    if (!teamA || !teamB) {
        return res.status(400).json({ error: 'Faltan las abreviaciones de los dos equipos.' });
    }

    try {
        // 1. Obtener los IDs y nombres reales de ambos equipos usando sus abreviaciones (ej. 'NE', 'SEA')
        const [teams] = await db.execute(
            `SELECT team_id, team_name, abbreviation FROM teams WHERE abbreviation IN (?, ?)`,
            [teamA, teamB]
        );

        if (teams.length < 2) {
            return res.status(404).json({ error: 'Uno o ambos equipos no fueron encontrados en la base de datos.' });
        }

        const teamAData = teams.find(t => t.abbreviation === teamA);
        const teamBData = teams.find(t => t.abbreviation === teamB);

        // 2. Buscar todos los enfrentamientos pasados entre ellos (cuando A es local y B visita, O viceversa)
        const [games] = await db.execute(
            `SELECT
                g.game_id,
                s.year AS season_year,
                w.week_type,
                g.game_date,
                ht.team_name AS home_team,
                ht.abbreviation AS home_abbr,
                at.team_name AS away_team,
                at.abbreviation AS away_abbr,
                g.home_score,
                g.away_score,
                g.winner_team_id
            FROM games g
            JOIN seasons s ON g.season_id = s.season_id
            JOIN weeks w ON g.week_id = w.week_id
            JOIN teams ht ON g.home_team_id = ht.team_id
            JOIN teams at ON g.away_team_id = at.team_id
            WHERE (g.home_team_id = ? AND g.away_team_id = ?)
               OR (g.home_team_id = ? AND g.away_team_id = ?)
            ORDER BY g.game_date DESC`,
            [teamAData.team_id, teamBData.team_id, teamBData.team_id, teamAData.team_id]
        );

        // 3. Contabilizar victorias, derrotas y empates
        let winsA = 0;
        let winsB = 0;
        let ties = 0;

        games.forEach(game => {
            if (game.winner_team_id === teamAData.team_id) {
                winsA++;
            } else if (game.winner_team_id === teamBData.team_id) {
                winsB++;
            } else {
                ties++;
            }
        });

        // 4. Enviar la respuesta estructurada al frontend
        res.json({
            stats: {
                teamA: { team_id: teamAData.team_id, name: teamAData.team_name, abbreviation: teamA, wins: winsA },
                teamB: { team_id: teamBData.team_id, name: teamBData.team_name, abbreviation: teamB, wins: winsB },
                total_games: games.length,
                ties: ties
            },
            games: games
        });

    } catch (err) {
        console.error("Error en getHeadToHead SQL:", err);
        res.status(500).json({ error: 'Error interno en el servidor al calcular el H2H' });
    }
};

module.exports = {
    getGames,
    getHeadToHead // <-- Asegúrate de exportarla aquí también
};