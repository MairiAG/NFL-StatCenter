const fs = require('fs');
const csv = require('csv-parser');
const mysql = require('mysql2/promise');

// Mapeo de nombres históricos de equipos para consistencia en la BD
const teamMap = {
    'St. Louis Rams': 'Los Angeles Rams',
    'San Diego Chargers': 'Los Angeles Chargers',
    'Oakland Raiders': 'Las Vegas Raiders',
    'Los Angeles Raiders': 'Las Vegas Raiders',
    'Washington Redskins': 'Washington Commanders',
    'Washington Football Team': 'Washington Commanders',
    'Phoenix Cardinals': 'Arizona Cardinals'
};

function importSeason(connection, fileName, year) {
    return new Promise((resolve, reject) => {
        console.log(`\n========== IMPORTANDO ${year} ==========\n`);
        const rows = [];

        // Definimos nombres de columnas ÚNICOS e indexados para evitar los duplicados del CSV
        fs.createReadStream(fileName)
            .pipe(csv({
                headers: ['colWeek', 'colDay', 'colDate', 'colTime', 'colWinner', 'colAt', 'colLoser', 'colBoxscore', 'colPtsW', 'colPtsL', 'colYdsW', 'colTOW', 'colYdsL', 'colTOL'],
                skipLines: 1 // Saltamos la primera línea original del archivo (los títulos duplicados)
            }))
            .on('data', (data) => rows.push(data))
            .on('error', (err) => reject(err))
            .on('end', async () => {
                try {
                    // 1. Buscar season_id en la base de datos
                    const [seasonRows] = await connection.execute(
                        `SELECT season_id FROM seasons WHERE year = ?`,
                        [year]
                    );

                    if (!seasonRows.length) {
                        console.log(`Temporada ${year} no encontrada en la BD`);
                        resolve();
                        return;
                    }

                    const seasonId = seasonRows[0].season_id;

                    for (const game of rows) {
                        try {
                            let week = game['colWeek'];

                            // Si la fila está vacía o es un separador de sección en el CSV, saltar
                            if (!week || week.trim() === '' || week.toLowerCase().includes('week')) {
                                continue;
                            }

                            week = week.trim();

                            // Normalizar nombres de semanas de playoffs
                            if (week === 'Wild Card') week = 'WildCard';
                            if (week === 'Divisional') week = 'Division';
                            if (week === 'Conference Championship') week = 'ConfChamp';

                            // Determinar el tipo de semana
                            let weekType = isNaN(week) ? week : 'Regular';

                            // 2. Buscar si ya existe la semana o crearla
                            const [weekRows] = await connection.execute(
                                `SELECT week_id FROM weeks WHERE season_id = ? AND week_number = ?`,
                                [seasonId, week]
                            );

                            let weekId;
                            if (!weekRows.length) {
                                const [insertWeek] = await connection.execute(
                                    `INSERT INTO weeks (season_id, week_number, week_type) VALUES (?, ?, ?)`,
                                    [seasonId, week, weekType]
                                );
                                weekId = insertWeek.insertId;
                            } else {
                                weekId = weekRows[0].week_id;
                            }

                            const winner = game['colWinner'];
                            const loser = game['colLoser'];

                            // Validar que existan los nombres de los equipos
                            if (!winner || !loser || winner.trim() === '' || loser.trim() === '' || winner.toLowerCase().includes('playoffs')) {
                                continue;
                            }

                            // 3. Extraer marcadores usando las nuevas llaves limpias y únicas
                            const rawWinnerPts = game['colPtsW'];
                            const rawLoserPts = game['colPtsL'];

                            if (!rawWinnerPts || !rawLoserPts || rawWinnerPts.trim() === '' || rawLoserPts.trim() === '') {
                                continue;
                            }

                            const winnerPts = parseInt(rawWinnerPts.trim());
                            const loserPts = parseInt(rawLoserPts.trim());

                            if (isNaN(winnerPts) || isNaN(loserPts)) {
                                continue;
                            }

                            const normalizedWinner = teamMap[winner.trim()] || winner.trim();
                            const normalizedLoser = teamMap[loser.trim()] || loser.trim();

                            // 4. Procesar la hora (HH:mm:ss)
                            let gameTime = null;
                            if (game['colTime']) {
                                const rawTime = game['colTime'].trim();
                                const match = rawTime.match(/(\d+):(\d+)\s*(AM|PM)/i);

                                if (match) {
                                    let hours = parseInt(match[1]);
                                    const minutes = match[2];
                                    const period = match[3].toUpperCase();

                                    if (period === 'PM' && hours !== 12) hours += 12;
                                    if (period === 'AM' && hours === 12) hours = 0;

                                    gameTime = `${hours.toString().padStart(2, '0')}:${minutes}:00`;
                                }
                            }

                            // 5. Procesar la fecha (Directo del formato limpio YYYY-MM-DD del CSV)
                            const mysqlDate = game['colDate'] ? game['colDate'].trim() : null;

                            if (!mysqlDate || !/^\d{4}-\d{2}-\d{2}$/.test(mysqlDate)) {
                                console.log(`Fecha omitida por formato: ${game['colDate']}`);
                                continue;
                            }

                            // 6. Determinar Local (Home) y Visitante (Away)
                            let homeTeam, awayTeam, homeScore, awayScore;
                            const atSymbol = game['colAt'];

                            if (atSymbol && atSymbol.trim() === '@') {
                                awayTeam = normalizedWinner;
                                homeTeam = normalizedLoser;
                                awayScore = winnerPts;
                                homeScore = loserPts;
                            } else {
                                homeTeam = normalizedWinner;
                                awayTeam = normalizedLoser;
                                homeScore = winnerPts;
                                awayScore = loserPts;
                            }

                            // 7. Buscar los IDs de los equipos en la BD
                            const [homeRows] = await connection.execute(
                                `SELECT team_id FROM teams WHERE team_name = ?`,
                                [homeTeam]
                            );

                            const [awayRows] = await connection.execute(
                                `SELECT team_id FROM teams WHERE team_name = ?`,
                                [awayTeam]
                            );

                            if (!homeRows.length || !awayRows.length) {
                                console.log(`Equipo no registrado en la BD: Local="${homeTeam}" o Visitante="${awayTeam}"`);
                                continue;
                            }

                            const homeTeamId = homeRows[0].team_id;
                            const awayTeamId = awayRows[0].team_id;

                            // 8. Determinar ID del ganador o dejar en null si es Empate
                            let winnerTeamId = null;
                            if (homeScore > awayScore) {
                                winnerTeamId = homeTeamId;
                            } else if (awayScore > homeScore) {
                                winnerTeamId = awayTeamId;
                            }

                            // 9. Insertar el juego limpio en la tabla `games`
                            await connection.execute(
                                `INSERT INTO games (
                                    season_id,
                                    week_id,
                                    game_date,
                                    game_time,
                                    home_team_id,
                                    away_team_id,
                                    home_score,
                                    away_score,
                                    winner_team_id
                                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                                [
                                    seasonId,
                                    weekId,
                                    mysqlDate,
                                    gameTime,
                                    homeTeamId,
                                    awayTeamId,
                                    homeScore,
                                    awayScore,
                                    winnerTeamId
                                ]
                            );

                            console.log(`INSERTADO: ${homeTeam} (${homeScore}) vs ${awayTeam} (${awayScore})`);

                        } catch (err) {
                            console.log('\nERROR PROCESANDO UN JUEGO DE LA FILA:');
                            console.log(err.sqlMessage || err);
                        }
                    }

                    console.log(`\nTEMPORADA ${year} IMPORTADA CON ÉXITO`);
                    resolve();

                } catch (err) {
                    console.log('\nERROR GENERAL EN LA TEMPORADA:');
                    console.log(err);
                    reject(err);
                }
            });
    });
}

async function runImports() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: 'Ibrahimovich.1979',
        database: 'nfl_db'
    });

    try {
        // CORREGIDO: Ahora va desde el 2015 hasta el 2025 inclusive
        for (let year = 2015; year <= 2025; year++) {
            await importSeason(connection, `./${year}.csv`, year);
        }
        console.log('\nTODO IMPORTADO 😎🔥');
    } catch (error) {
        console.error("Error crítico en el proceso general:", error);
    } finally {
        await connection.end();
    }
}

runImports();