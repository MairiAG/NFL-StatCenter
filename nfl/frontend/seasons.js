// ==========================================
// CONFIGURACIÓN INICIAL
// ==========================================
const currentYear = window.location.pathname.split('/')[2] || '2025';

// Actualizar títulos de página
document.title = `Temporada NFL ${currentYear} | StatCenter`;
document.getElementById('season-title').textContent = `Temporada NFL ${currentYear}`;

// Datos de posiciones cargados (para el predictor)
let standingsData = [];

// ==========================================
// SELECTOR DE AÑOS (2026 → 2015)
// ==========================================
const seasonSelector = document.getElementById('season-selector');
if (seasonSelector) {
    for (let y = 2026; y >= 2015; y--) {
        const opt = document.createElement('option');
        opt.value = y;
        opt.textContent = y;
        if (y == currentYear) opt.selected = true;
        seasonSelector.appendChild(opt);
    }
    seasonSelector.addEventListener('change', () => {
        window.location.href = `/seasons/${seasonSelector.value}`;
    });
}

// Cambio de fase (Regular / Playoffs)
const phaseSelector = document.getElementById('phase-selector');
if (phaseSelector) {
    phaseSelector.addEventListener('change', loadWeeks);
}

// ==========================================
// TABS
// ==========================================
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(t => t.style.display = 'none');
        btn.classList.add('active');
        const content = document.getElementById(`tab-${tab}`);
        if (content) content.style.display = 'block';

        // Carga diferida: posiciones y predictor
        if (tab === 'posiciones' && standingsData.length === 0) loadStandings();
        if (tab === 'prediccion') {
            if (currentYear == '2026') {
                // Temporada 2026: proyecciones automáticas de todos los partidos
                const manualForm = document.getElementById('predictor-manual-form');
                if (manualForm) manualForm.style.display = 'none';
                loadAllTimeStandings().then(loadFullSeasonPredictions);
            } else {
                // Temporadas pasadas: selector manual con históricos
                const manualForm = document.getElementById('predictor-manual-form');
                if (manualForm) manualForm.style.display = 'block';
                loadAllTimeStandings().then(populatePredictorSelects);
            }
        }
    });
});

// ==========================================
// RESUMEN (OVERVIEW)
// ==========================================
async function loadOverview() {
    try {
        const res = await fetch(`/seasons-api/${currentYear}/overview`);
        if (!res.ok) throw new Error('Error overview');
        const data = await res.json();

        document.getElementById('total-games').textContent = data.totalGames ?? '—';

        if (data.avgPoints) {
            document.getElementById('avg-total').textContent = data.avgPoints.avg_total ?? '—';

            const totalGames = data.totalGames || 1;
            const homeWins   = data.avgPoints.home_wins || 0;
            const pct = Math.round((homeWins / totalGames) * 100);
            document.getElementById('home-wins-pct').textContent = `${pct}%`;
        }

        if (data.highestGame) {
            const g = data.highestGame;
            document.getElementById('highest-scoring-game').textContent =
                `${g.away_team} ${g.away_score} – ${g.home_score} ${g.home_team}`;
            document.getElementById('highest-score-pts').textContent =
                `${g.total_points} puntos totales`;
        } else {
            document.getElementById('highest-scoring-game').textContent = 'Sin datos';
        }

    } catch (err) {
        console.error('loadOverview:', err);
    }
}

// Fases que NO tienen selector de semana — cargan juegos directo
const DIRECT_PHASES = ['WildCard', 'Division', 'ConfChamp', 'SuperBowl'];

// Nombres en español para cada fase
const PHASE_LABELS = {
    Regular:   'Temporada Regular',
    WildCard:  'Ronda de Comodines',
    Division:  'Rondas Divisionales',
    ConfChamp: 'Finales de Conferencia',
    SuperBowl: 'Super Bowl'
};

// ==========================================
// SEMANAS
// ==========================================
async function loadWeeks() {
    const weeksNav       = document.getElementById('weeks-nav');
    const gamesContainer = document.getElementById('games-container');
    if (!weeksNav) return;

    const phase = phaseSelector?.value || 'Regular';

    // Si es fase de playoffs → cargar juegos directo, sin botones de semana
    if (DIRECT_PHASES.includes(phase)) {
        weeksNav.innerHTML = '';
        document.getElementById('week-title').textContent = PHASE_LABELS[phase] || phase;
        await loadGamesByPhase(phase);
        return;
    }

    // Temporada Regular → mostrar botones de semana
    try {
        const res = await fetch(`/seasons-api/${currentYear}/weeks?phase=${phase}`);
        if (!res.ok) throw new Error('Error weeks');
        const weeks = await res.json();

        weeksNav.innerHTML = '';
        gamesContainer.innerHTML = '<div class="loading-text">Elige una semana</div>';
        document.getElementById('week-title').textContent = 'Selecciona una semana';

        if (weeks.length === 0) {
            weeksNav.innerHTML = `<p style="color:var(--text-muted); grid-column:1/-1; padding:10px;">
                No hay semanas registradas para esta fase.</p>`;
            return;
        }

        weeks.forEach(week => {
            const btn = document.createElement('button');
            btn.className = 'week-btn';
            btn.textContent = week.week_number;
            btn.addEventListener('click', () => {
                document.querySelectorAll('.week-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                loadGames(week.week_id, week.week_number);
            });
            weeksNav.appendChild(btn);
        });

    } catch (err) {
        console.error('loadWeeks:', err);
        weeksNav.innerHTML = `<p style="color:red; grid-column:1/-1;">Error al cargar semanas.</p>`;
    }
}

// ==========================================
// PARTIDOS DE UNA SEMANA
// ==========================================
async function loadGames(weekId, weekNumber) {
    const gamesContainer = document.getElementById('games-container');
    if (!gamesContainer) return;

    gamesContainer.innerHTML = '<div class="loading-text"><i class="fas fa-spinner fa-spin"></i> Cargando partidos...</div>';
    document.getElementById('week-title').textContent = `Semana ${weekNumber}`;

    try {
        const res = await fetch(`/seasons-api/${currentYear}/week/${weekId}`);
        if (!res.ok) throw new Error('Error games');
        const games = await res.json();

        if (games.length === 0) {
            gamesContainer.innerHTML = '<div class="loading-text">Sin partidos en esta semana.</div>';
            return;
        }

        gamesContainer.innerHTML = '';

        // Estadísticas rápidas de la semana
        const totalPts  = games.reduce((s, g) => s + (g.total_points || 0), 0);
        const avgPts    = games.length ? (totalPts / games.length).toFixed(1) : 0;
        const overGames = games.filter(g => (g.total_points || 0) > 45).length;

        const weekSummary = document.createElement('div');
        weekSummary.className = 'week-summary';
        weekSummary.innerHTML = `
            <div class="week-stat"><span>${games.length}</span><small>partidos</small></div>
            <div class="week-stat"><span>${avgPts}</span><small>pts. promedio</small></div>
            <div class="week-stat"><span>${overGames}</span><small>OVER 45 pts</small></div>
            <div class="week-stat"><span>${games.length - overGames}</span><small>UNDER 45 pts</small></div>
        `;
        gamesContainer.appendChild(weekSummary);

        games.forEach(game => {
            const homeWon = game.winner_team_id === game.home_team_id;
            const awayWon = game.winner_team_id === game.away_team_id;
            const tied    = game.winner_team_id === null;
            const isOver  = game.total_points > 45;

            const card = document.createElement('div');
            card.className = 'game-card';
            card.innerHTML = `
                <div class="game-card-meta">
                    <span><i class="fas fa-calendar-alt"></i> ${game.game_date}</span>
                    <span style="color:${isOver ? 'var(--neon-green)' : 'var(--text-muted)'};">
                        ${isOver ? '🔥 OVER' : 'UNDER'} 45
                    </span>
                    <span><i class="fas fa-map-marker-alt"></i> ${game.stadium || 'N/A'}</span>
                </div>

                <div class="game-card-row ${awayWon ? 'winner' : ''} ${homeWon ? 'loser' : ''}">
                    <div class="game-team-info">
                        <img src="https://a.espncdn.com/i/teamlogos/nfl/500/${game.away_abbr.toLowerCase()}.png"
                             alt="${game.away_abbr}"
                             onerror="this.style.display='none'">
                        <span class="game-team-name">${game.away_abbr}</span>
                        <small style="color:var(--text-muted); font-size:0.75rem;">Visitante</small>
                    </div>
                    <span class="game-score">${game.away_score}</span>
                </div>

                <div class="game-card-row ${homeWon ? 'winner' : ''} ${awayWon ? 'loser' : ''}">
                    <div class="game-team-info">
                        <img src="https://a.espncdn.com/i/teamlogos/nfl/500/${game.home_abbr.toLowerCase()}.png"
                             alt="${game.home_abbr}"
                             onerror="this.style.display='none'">
                        <span class="game-team-name">${game.home_abbr}</span>
                        <small style="color:var(--text-muted); font-size:0.75rem;">Local</small>
                    </div>
                    <span class="game-score">${game.home_score}</span>
                </div>

                <div class="game-card-footer">
                    <small style="color:var(--text-muted);">
                        Total: <strong style="color:var(--white);">${game.total_points} pts</strong>
                    </small>
                    <small style="color:${tied ? '#ffcc00' : (homeWon ? 'var(--neon-blue)' : 'var(--accent)')};">
                        ${tied ? 'EMPATE' : (homeWon ? `✓ ${game.home_abbr}` : `✓ ${game.away_abbr}`)}
                    </small>
                </div>
            `;
            gamesContainer.appendChild(card);
        });

    } catch (err) {
        console.error('loadGames:', err);
        gamesContainer.innerHTML = '<div class="loading-text" style="color:red;">Error al cargar los partidos.</div>';
    }
}

// ==========================================
// PARTIDOS DIRECTOS POR FASE (Playoffs)
// ==========================================
async function loadGamesByPhase(phase) {
    const gamesContainer = document.getElementById('games-container');
    if (!gamesContainer) return;

    gamesContainer.innerHTML = '<div class="loading-text"><i class="fas fa-spinner fa-spin"></i> Cargando partidos...</div>';

    try {
        const res = await fetch(`/seasons-api/${currentYear}/phase/${phase}`);
        if (!res.ok) throw new Error('Error phase games');
        const games = await res.json();

        if (games.length === 0) {
            gamesContainer.innerHTML = '<div class="loading-text">Sin partidos registrados para esta fase.</div>';
            return;
        }

        gamesContainer.innerHTML = '';

        // Resumen rápido de la fase
        const totalPts  = games.reduce((s, g) => s + (g.total_points || 0), 0);
        const avgPts    = (totalPts / games.length).toFixed(1);

        const weekSummary = document.createElement('div');
        weekSummary.className = 'week-summary';
        weekSummary.innerHTML = `
            <div class="week-stat"><span>${games.length}</span><small>partidos</small></div>
            <div class="week-stat"><span>${avgPts}</span><small>pts. promedio</small></div>
            <div class="week-stat"><span>${games.filter(g => (g.total_points||0) > 45).length}</span><small>OVER 45 pts</small></div>
        `;
        gamesContainer.appendChild(weekSummary);

        games.forEach(game => {
            const homeWon = game.winner_team_id === game.home_team_id;
            const awayWon = game.winner_team_id === game.away_team_id;
            const tied    = game.winner_team_id === null;
            const isOver  = game.total_points > 45;

            const card = document.createElement('div');
            card.className = 'game-card';
            card.innerHTML = `
                <div class="game-card-meta">
                    <span><i class="fas fa-calendar-alt"></i> ${game.game_date}</span>
                    <span style="color:${isOver ? 'var(--neon-green)' : 'var(--text-muted)'};">
                        ${isOver ? '🔥 OVER' : 'UNDER'} 45
                    </span>
                    <span><i class="fas fa-map-marker-alt"></i> ${game.stadium || 'N/A'}</span>
                </div>
                <div class="game-card-row ${awayWon ? 'winner' : ''} ${homeWon ? 'loser' : ''}">
                    <div class="game-team-info">
                        <img src="https://a.espncdn.com/i/teamlogos/nfl/500/${game.away_abbr.toLowerCase()}.png"
                             alt="${game.away_abbr}" onerror="this.style.display='none'">
                        <span class="game-team-name">${game.away_abbr}</span>
                        <small style="color:var(--text-muted); font-size:0.75rem;">Visitante</small>
                    </div>
                    <span class="game-score">${game.away_score}</span>
                </div>
                <div class="game-card-row ${homeWon ? 'winner' : ''} ${awayWon ? 'loser' : ''}">
                    <div class="game-team-info">
                        <img src="https://a.espncdn.com/i/teamlogos/nfl/500/${game.home_abbr.toLowerCase()}.png"
                             alt="${game.home_abbr}" onerror="this.style.display='none'">
                        <span class="game-team-name">${game.home_abbr}</span>
                        <small style="color:var(--text-muted); font-size:0.75rem;">Local</small>
                    </div>
                    <span class="game-score">${game.home_score}</span>
                </div>
                <div class="game-card-footer">
                    <small style="color:var(--text-muted);">
                        Total: <strong style="color:var(--white);">${game.total_points} pts</strong>
                    </small>
                    <small style="color:${tied ? '#ffcc00' : (homeWon ? 'var(--neon-blue)' : 'var(--accent)')};">
                        ${tied ? 'EMPATE' : (homeWon ? `✓ ${game.home_abbr}` : `✓ ${game.away_abbr}`)}
                    </small>
                </div>
            `;
            gamesContainer.appendChild(card);
        });

    } catch (err) {
        console.error('loadGamesByPhase:', err);
        gamesContainer.innerHTML = '<div class="loading-text" style="color:red;">Error al cargar los partidos.</div>';
    }
}
async function loadStandings() {
    const tbody = document.getElementById('standings-body');
    if (!tbody) return;

    try {
        const res = await fetch(`/seasons-api/${currentYear}/standings`);
        if (!res.ok) throw new Error('Error standings');
        const data = await res.json();
        renderStandings(data);
        return data;
    } catch (err) {
        console.error('loadStandings:', err);
        if (tbody) tbody.innerHTML = `<tr><td colspan="12" style="color:red; text-align:center; padding:20px;">Error al cargar posiciones.</td></tr>`;
    }
}

async function loadAllTimeStandings() {
    try {
        const res = await fetch(`/seasons-api/all-time/standings`);
        if (!res.ok) throw new Error('Error all-time standings');
        standingsData = await res.json();
        return standingsData;
    } catch (err) {
        console.error('loadAllTimeStandings:', err);
    }
}

function renderStandings(data) {
    const tbody = document.getElementById('standings-body');
    if (!tbody) return;

    tbody.innerHTML = '';

    data.forEach((team, i) => {
        const diff   = (team.pts_for || 0) - (team.pts_against || 0);
        const diffColor = diff > 0 ? 'var(--neon-green)' : diff < 0 ? 'var(--accent)' : 'var(--text-muted)';
        const tr = document.createElement('tr');
        tr.dataset.conf = team.conference || '';
        tr.innerHTML = `
            <td style="color:var(--text-muted); font-weight:700;">${i + 1}</td>
            <td>
                <div style="display:flex; align-items:center; gap:0.6rem;">
                    <img src="https://a.espncdn.com/i/teamlogos/nfl/500/${team.abbreviation.toLowerCase()}.png"
                         style="width:28px; height:28px; object-fit:contain;"
                         onerror="this.style.display='none'">
                    <span style="font-weight:600;">${team.team_name}</span>
                </div>
            </td>
            <td><span class="div-badge">${team.division || '—'}</span></td>
            <td>${team.played}</td>
            <td style="font-weight:700; color:var(--neon-green);">${team.wins}</td>
            <td style="color:var(--accent);">${team.losses}</td>
            <td>${team.ties}</td>
            <td style="font-weight:600;">${team.win_pct}%</td>
            <td>${team.pts_for}</td>
            <td>${team.pts_against}</td>
            <td style="color:var(--neon-blue);">${team.avg_scored}</td>
            <td style="color:${diff > 0 ? 'var(--neon-green)' : 'var(--accent)'};">${team.avg_allowed}</td>
        `;
        tbody.appendChild(tr);
    });
}

// Filtro de conferencia
document.querySelectorAll('.conf-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.conf-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const conf = btn.dataset.conf;
        document.querySelectorAll('#standings-body tr').forEach(row => {
            row.style.display = (conf === 'all' || row.dataset.conf === conf) ? '' : 'none';
        });
    });
});

// ==========================================
// PREDICTOR ESTADÍSTICO — Proyección completa temporada 2026
// ==========================================

// Carga todos los partidos programados de 2026 y genera predicción para cada uno
async function loadFullSeasonPredictions() {
    const container = document.getElementById('prediction-result');
    const manualForm = document.getElementById('predictor-manual-form');
    if (!container) return;

    container.innerHTML = '<div class="loading-text"><i class="fas fa-spinner fa-spin"></i> Generando proyecciones...</div>';
    container.style.display = 'block';

    try {
        // Usar promedios históricos 2015-2025 como base de proyección
        const allTimeRes = await fetch(`/seasons-api/all-time/standings`);
        standingsData = await allTimeRes.json();

        // Traer todos los partidos de 2026 semana por semana
        const weeksRes = await fetch(`/seasons-api/2026/weeks?phase=Regular`);
        const weeks = await weeksRes.json();

        let allGames = [];
        for (const week of weeks) {
            const gRes = await fetch(`/seasons-api/2026/week/${week.week_id}`);
            const games = await gRes.json();
            games.forEach(g => g.week_number = week.week_number);
            allGames = allGames.concat(games);
        }

        if (allGames.length === 0) {
            container.innerHTML = '<div class="loading-text">No hay partidos programados para 2026.</div>';
            return;
        }

        // Agrupar por semana
        const byWeek = {};
        allGames.forEach(g => {
            if (!byWeek[g.week_number]) byWeek[g.week_number] = [];
            byWeek[g.week_number].push(g);
        });

        let html = `<h3 style="text-align:center; margin-bottom:1.5rem; color:var(--white);">
            Proyecciones Completas — Temporada 2026 (${allGames.length} partidos)
        </h3>`;

        Object.keys(byWeek).sort((a,b) => +a - +b).forEach(weekNum => {
            html += `<div style="margin-bottom:2rem;">
                <h4 style="color:var(--neon-blue); border-bottom:1px solid rgba(255,255,255,0.07); padding-bottom:0.5rem; margin-bottom:1rem;">
                    Semana ${weekNum}
                </h4>
                <div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap:1rem;">`;

            byWeek[weekNum].forEach(game => {
                const home = standingsData.find(t => parseInt(t.team_id) === parseInt(game.home_team_id));
                const away = standingsData.find(t => parseInt(t.team_id) === parseInt(game.away_team_id));

                if (!home || !away) {
                    html += `<div class="pred-game-card">
                        <p style="color:var(--text-muted); font-size:0.8rem; text-align:center;">
                            ${game.home_abbr} vs ${game.away_abbr} — sin datos históricos
                        </p>
                    </div>`;
                    return;
                }

                const HOME_ADVANTAGE = 2.5;
                const projHome = parseFloat((home.avg_scored * 0.70 + away.avg_allowed * 0.30 + HOME_ADVANTAGE).toFixed(1));
                const projAway = parseFloat((away.avg_scored * 0.70 + home.avg_allowed * 0.30).toFixed(1));
                const projTotal = (projHome + projAway).toFixed(1);
                const overUnder = projTotal > 45 ? 'OVER' : 'UNDER';

                const hScore = home.win_pct * 1.0 + (projHome - projAway) * 2 + HOME_ADVANTAGE * 3;
                const aScore = away.win_pct * 1.0 + (projAway - projHome) * 2;
                const homeProb = Math.min(Math.max(Math.round((hScore / (hScore + aScore)) * 100), 5), 95);
                const awayProb = 100 - homeProb;
                const favAbbr = homeProb >= awayProb ? game.home_abbr : game.away_abbr;

                html += `<div class="pred-game-card">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.8rem;">
                        <small style="color:var(--text-muted);">${game.game_date} · ${game.game_time || ''}</small>
                        <span style="font-size:0.7rem; padding:2px 8px; border-radius:4px; font-weight:700;
                            background:${overUnder === 'OVER' ? 'rgba(57,255,20,0.1)' : 'rgba(213,10,10,0.1)'};
                            color:${overUnder === 'OVER' ? 'var(--neon-green)' : 'var(--accent)'};">
                            ${overUnder} 45
                        </span>
                    </div>
                    <div style="display:flex; align-items:center; justify-content:space-between; gap:0.5rem;">
                        <div style="text-align:center; flex:1;">
                            <img src="https://a.espncdn.com/i/teamlogos/nfl/500/${game.away_abbr.toLowerCase()}.png"
                                 style="width:36px;height:36px;object-fit:contain;" onerror="this.style.display='none'">
                            <p style="font-size:0.8rem; margin:0.2rem 0; color:${awayProb > homeProb ? 'var(--white)' : 'var(--text-muted)'}; font-weight:${awayProb > homeProb ? '700' : '400'};">${game.away_abbr}</p>
                            <small style="color:var(--text-muted); font-size:0.65rem;">Visitante</small>
                            <p style="font-size:1.4rem; font-family:'Krona One',sans-serif; color:var(--accent); margin:0;">${projAway}</p>
                            <small style="color:var(--text-muted);">${awayProb}%</small>
                        </div>
                        <div style="text-align:center; padding:0 0.5rem;">
                            <p style="font-size:0.7rem; color:var(--text-muted); margin:0;">Total</p>
                            <p style="font-size:1rem; font-weight:700; color:var(--white); margin:0;">${projTotal}</p>
                            <p style="font-size:0.65rem; color:var(--neon-green); margin:0.3rem 0 0;">⭐ ${favAbbr}</p>
                        </div>
                        <div style="text-align:center; flex:1;">
                            <img src="https://a.espncdn.com/i/teamlogos/nfl/500/${game.home_abbr.toLowerCase()}.png"
                                 style="width:36px;height:36px;object-fit:contain;" onerror="this.style.display='none'">
                            <p style="font-size:0.8rem; margin:0.2rem 0; color:${homeProb > awayProb ? 'var(--white)' : 'var(--text-muted)'}; font-weight:${homeProb > awayProb ? '700' : '400'};">${game.home_abbr}</p>
                            <small style="color:var(--text-muted); font-size:0.65rem;">Local</small>
                            <p style="font-size:1.4rem; font-family:'Krona One',sans-serif; color:var(--neon-blue); margin:0;">${projHome}</p>
                            <small style="color:var(--text-muted);">${homeProb}%</small>
                        </div>
                    </div>
                    <!-- Barra de probabilidad -->
                    <div style="margin-top:0.8rem; height:4px; background:rgba(255,255,255,0.06); border-radius:4px; overflow:hidden;">
                        <div style="height:100%; width:${homeProb}%; background:linear-gradient(90deg,var(--accent),var(--neon-blue)); border-radius:4px;"></div>
                    </div>
                </div>`;
            });

            html += '</div></div>';
        });

        container.innerHTML = html;

    } catch(err) {
        console.error('loadFullSeasonPredictions:', err);
        container.innerHTML = '<div class="loading-text" style="color:red;">Error al generar proyecciones.</div>';
    }
}

function populatePredictorSelects() {
    const homeSelect = document.getElementById('pred-home');
    const awaySelect = document.getElementById('pred-away');
    if (!homeSelect || !awaySelect || standingsData.length === 0) return;

    // Limpiar y poblar
    [homeSelect, awaySelect].forEach(sel => {
        sel.innerHTML = '<option value="">-- Selecciona equipo --</option>';
        standingsData.forEach(t => {
            const opt = document.createElement('option');
            opt.value = t.team_id;
            opt.textContent = `${t.team_name} (${t.wins}W - ${t.losses}L)`;
            sel.appendChild(opt);
        });
    });

    homeSelect.addEventListener('change', () => showMiniStats('home', homeSelect.value));
    awaySelect.addEventListener('change', () => showMiniStats('away', awaySelect.value));
}

function showMiniStats(side, teamId) {
    const container = document.getElementById(`pred-${side}-stats`);
    const team = standingsData.find(t => t.team_id == teamId);
    if (!container) return;
    if (!team) { container.innerHTML = ''; return; }

    container.innerHTML = `
        <div class="pred-stat-row"><span>Promedio anotado</span><strong style="color:var(--neon-green);">${team.avg_scored} pts</strong></div>
        <div class="pred-stat-row"><span>Promedio recibido</span><strong style="color:var(--accent);">${team.avg_allowed} pts</strong></div>
        <div class="pred-stat-row"><span>Efectividad</span><strong style="color:var(--neon-blue);">${team.win_pct}%</strong></div>
        <div class="pred-stat-row"><span>Dif. puntos</span><strong style="color:var(--white);">${(team.pts_for - team.pts_against) >= 0 ? '+' : ''}${team.pts_for - team.pts_against}</strong></div>
    `;
}

document.getElementById('btn-predict')?.addEventListener('click', () => {
    const homeId = document.getElementById('pred-home').value;
    const awayId = document.getElementById('pred-away').value;

    if (!homeId || !awayId) {
        alert('Selecciona ambos equipos para generar la proyección.');
        return;
    }
    if (homeId === awayId) {
        alert('Selecciona dos equipos diferentes.');
        return;
    }

    const home = standingsData.find(t => t.team_id == homeId);
    const away = standingsData.find(t => t.team_id == awayId);
    if (!home || !away) return;

    // ── Algoritmo de predicción ──────────────────────────────────
    // Puntos proyectados = 70% del promedio ofensivo del equipo + 30% del promedio recibido del rival
    const HOME_ADVANTAGE = 2.5; // Ventaja estimada del local (puntos extra)

    const projHome = parseFloat(
        (home.avg_scored * 0.70 + away.avg_allowed * 0.30 + HOME_ADVANTAGE).toFixed(1)
    );
    const projAway = parseFloat(
        (away.avg_scored * 0.70 + home.avg_allowed * 0.30).toFixed(1)
    );
    const projTotal = (projHome + projAway).toFixed(1);
    const overUnderLine = 45;
    const overUnder = projTotal > overUnderLine ? 'OVER' : 'UNDER';

    // Probabilidad de victoria (basada en win% ponderado)
    const homeScore = home.win_pct * 1.0 + (projHome - projAway) * 2 + HOME_ADVANTAGE * 3;
    const awayScore = away.win_pct * 1.0 + (projAway - projHome) * 2;
    const total = homeScore + awayScore;
    const homeWinProb = Math.min(Math.max(Math.round((homeScore / total) * 100), 5), 95);
    const awayWinProb = 100 - homeWinProb;

    const favorite   = homeWinProb >= awayWinProb ? home : away;
    const underdog   = homeWinProb >= awayWinProb ? away : home;
    const favProb    = homeWinProb >= awayWinProb ? homeWinProb : awayWinProb;
    const undProb    = 100 - favProb;
    // ─────────────────────────────────────────────────────────────

    const resultContainer = document.getElementById('prediction-result');
    resultContainer.style.display = 'block';
    resultContainer.innerHTML = `
        <h3 style="text-align:center; margin-bottom:1.5rem; color:var(--white);">
            Proyección: ${home.abbreviation} vs ${away.abbreviation}
        </h3>

        <!-- Marcador proyectado -->
        <div style="display:flex; justify-content:space-around; align-items:center; text-align:center; margin-bottom:2rem; background:rgba(0,0,0,0.3); padding:1.5rem; border-radius:16px;">
            <div>
                <img src="https://a.espncdn.com/i/teamlogos/nfl/500/${home.abbreviation.toLowerCase()}.png"
                     style="width:52px; height:52px; object-fit:contain;" onerror="this.style.display='none'">
                <p style="font-size:0.85rem; color:var(--text-muted); margin-top:0.3rem;">${home.team_name}</p>
                <p style="font-family:'Krona One',sans-serif; font-size:2.8rem; color:var(--neon-blue);">${projHome}</p>
                <small style="color:var(--text-muted);">Local (proyectado)</small>
            </div>
            <div>
                <p style="font-family:'Krona One',sans-serif; font-size:1.5rem; color:#1e2d4a;">VS</p>
                <p style="font-size:0.75rem; color:var(--text-muted); margin-top:0.5rem;">Total proy.</p>
                <p style="font-size:1.4rem; font-weight:700; color:var(--white);">${projTotal} pts</p>
                <span style="padding:3px 10px; border-radius:6px; font-size:0.75rem; font-weight:700;
                    background:${overUnder === 'OVER' ? 'rgba(57,255,20,0.15)' : 'rgba(213,10,10,0.15)'};
                    color:${overUnder === 'OVER' ? 'var(--neon-green)' : 'var(--accent)'};">
                    ${overUnder} ${overUnderLine}
                </span>
            </div>
            <div>
                <img src="https://a.espncdn.com/i/teamlogos/nfl/500/${away.abbreviation.toLowerCase()}.png"
                     style="width:52px; height:52px; object-fit:contain;" onerror="this.style.display='none'">
                <p style="font-size:0.85rem; color:var(--text-muted); margin-top:0.3rem;">${away.team_name}</p>
                <p style="font-family:'Krona One',sans-serif; font-size:2.8rem; color:var(--accent);">${projAway}</p>
                <small style="color:var(--text-muted);">Visitante (proyectado)</small>
            </div>
        </div>

        <!-- Barra de probabilidad -->
        <div style="margin-bottom:1.5rem;">
            <div style="display:flex; justify-content:space-between; margin-bottom:0.4rem; font-size:0.85rem; font-weight:600;">
                <span style="color:var(--neon-blue);">${home.abbreviation} ${homeWinProb}%</span>
                <span style="color:var(--accent);">${away.abbreviation} ${awayWinProb}%</span>
            </div>
            <div style="height:10px; background:rgba(255,255,255,0.08); border-radius:10px; overflow:hidden;">
                <div style="height:100%; width:${homeWinProb}%; background:linear-gradient(90deg, var(--primary), var(--neon-blue)); border-radius:10px; transition:width 1s ease;"></div>
            </div>
            <p style="text-align:center; margin-top:0.7rem; color:var(--text-muted); font-size:0.85rem;">
                Probabilidad de victoria basada en efectividad y diferencial de puntos
            </p>
        </div>

        <!-- Recomendación -->
        <div style="background:rgba(57,255,20,0.07); border:1px solid rgba(57,255,20,0.15); border-radius:12px; padding:1.2rem; text-align:center;">
            <p style="font-size:0.8rem; text-transform:uppercase; letter-spacing:1px; color:var(--text-muted); margin-bottom:0.3rem;">Favorito proyectado</p>
            <p style="font-size:1.3rem; font-weight:700; color:var(--neon-green);">
                <i class="fas fa-star"></i> ${favorite.team_name} (${favProb}% probabilidad)
            </p>
        </div>
    `;

    resultContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
});

// ==========================================
// INIT
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    loadOverview();
    loadWeeks();
});