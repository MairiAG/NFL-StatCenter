document.addEventListener('DOMContentLoaded', () => {

    // 1. CUENTA REGRESIVA AL KICKOFF NFL 2026 
    const daysEl = document.getElementById('days');
    const hoursEl = document.getElementById('hours');
    const minutesEl = document.getElementById('minutes');
    const secondsEl = document.getElementById('seconds');

    // Solo se ejecuta si los elementos del reloj existen (Página de Inicio)
    if (daysEl && hoursEl && minutesEl && secondsEl) {
        const kickoffDate = new Date('September 9, 2026 18:20:00 GMT-0600').getTime();

        const updateCountdown = () => {
            const now = new Date().getTime();
            const difference = kickoffDate - now;

            if (difference < 0) {
                clearInterval(countdownInterval);
                const container = document.querySelector('.countdown-container');
                if (container) container.innerHTML = "<h3 style='color:#39ff14;'>¡La Temporada 2026 ya comenzó!</h3>";
                return;
            }

            const days = Math.floor(difference / (1000 * 60 * 60 * 24));
            const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((difference % (1000 * 60)) / 1000);

            daysEl.innerText = days < 10 ? '0' + days : days;
            hoursEl.innerText = hours < 10 ? '0' + hours : hours;
            minutesEl.innerText = minutes < 10 ? '0' + minutes : minutes;
            secondsEl.innerText = seconds < 10 ? '0' + seconds : seconds;
        };

        const countdownInterval = setInterval(updateCountdown, 1000);
        updateCountdown();
    }


    // 2. BOTÓN KICKOFF H2H (Apertura SEA vs NE) 
    const kickoffBtn = document.getElementById('btn-kickoff-h2h');
    if (kickoffBtn) {
        kickoffBtn.addEventListener('click', () => {
            // Pre-seleccionar SEA y NE y ejecutar la comparación
            const teamASelect = document.getElementById('team-a');
            const teamBSelect = document.getElementById('team-b');
            if (teamASelect && teamBSelect) {
                teamASelect.value = 'SEA';
                teamBSelect.value = 'NE';
                document.getElementById('btn-compare')?.click();
                // Scroll suave a la sección H2H
                document.querySelector('.h2h-section')?.scrollIntoView({ behavior: 'smooth' });
            }
        });
    }


   // 3. SUBMIT INTERACTIVO HEAD-TO-HEAD 
    const btnCompare = document.getElementById('btn-compare');
    const teamASelect = document.getElementById('team-a');
    const teamBSelect = document.getElementById('team-b');
    const h2hResultsContainer = document.getElementById('h2h-results');

    if (btnCompare && teamASelect && teamBSelect && h2hResultsContainer) {
        btnCompare.addEventListener('click', async () => {
            const teamA = teamASelect.value;
            const teamB = teamBSelect.value;

            if (!teamA || !teamB) {
                alert("Por favor, selecciona ambos equipos de los listados para proceder.");
                return;
            }

            if (teamA === teamB) {
                alert("No puedes comparar un equipo consigo mismo. Selecciona una rivalidad válida.");
                return;
            }

            try {
                // LLAMADA RELATIVA CORRECTA AL SERVIDOR
                const response = await fetch(`/games/head-to-head?teamA=${teamA}&teamB=${teamB}`);
                
                if (!response.ok) throw new Error('Error al conectar con la API');

                const data = await response.json();

                if (data.stats.total_games === 0) {
                    h2hResultsContainer.innerHTML = `
                        <div style="text-align: center; padding: 20px; background: rgba(255,255,255,0.05); border-radius: 8px;">
                            <p style="color: #ffcc00; font-weight: bold;">No se encontraron enfrentamientos registrados entre estos dos equipos.</p>
                        </div>
                    `;
                    h2hResultsContainer.style.display = 'block';
                    return;
                }

                let htmlContent = `
                    <div class="h2h-dashboard" style="background: rgba(0, 0, 0, 0.4); padding: 25px; border-radius: 12px; border: 1px solid #39ff14;">
                        <h3 style="text-align: center; margin-bottom: 20px; color: #fff;">Historial Total: ${data.stats.total_games} Partidos</h3>
                        
                        <div style="display: flex; justify-content: space-around; align-items: center; text-align: center; margin-bottom: 30px;">
                            <div>
                                <h1 style="font-size: 3rem; margin: 0; color: #fff;">${data.stats.teamA.wins}</h1>
                                <p style="font-weight: bold; color: #39ff14;">${data.stats.teamA.name}</p>
                                <small style="color: #aaa;">Victorias</small>
                            </div>
                            <div>
                                <h2 style="margin: 0; color: #ffcc00;">${data.stats.ties}</h2>
                                <p style="margin: 0; color: #aaa;">Empates</p>
                            </div>
                            <div>
                                <h1 style="font-size: 3rem; margin: 0; color: #fff;">${data.stats.teamB.wins}</h1>
                                <p style="font-weight: bold; color: #39ff14;">${data.stats.teamB.name}</p>
                                <small style="color: #aaa;">Victorias</small>
                            </div>
                        </div>

                        <h4 style="border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 10px; color: #fff;">Últimos Enfrentamientos Directos</h4>
                        <div style="max-height: 300px; overflow-y: auto;">
                            <table style="width: 100%; text-align: left; color: #ddd; border-collapse: collapse;">
                                <thead>
                                    <tr style="border-bottom: 2px solid rgba(255,255,255,0.1); color: #fff;">
                                        <th style="padding: 8px;">Fecha</th>
                                        <th style="padding: 8px;">Fase</th>
                                        <th style="padding: 8px; text-align: right;">Local</th>
                                        <th style="padding: 8px; text-align: center;">Marcador</th>
                                        <th style="padding: 8px; text-align: left;">Visitante</th>
                                    </tr>
                                </thead>
                                <tbody>
                `;

                data.games.forEach(game => {
                    const homeBold = game.winner_team_id === data.stats.teamA.team_id || (game.winner_team_id === data.stats.teamB.team_id && game.home_abbr === data.stats.teamB.abbreviation);
                    const awayBold = !homeBold && game.winner_team_id !== null;

                    htmlContent += `
                        <tr style="border-bottom: 1px solid rgba(255,255,255,0.05); height: 45px;">
                            <td style="padding: 8px;"><small>${game.game_date.split('T')[0]} (${game.season_year})</small></td>
                            <td style="padding: 8px;"><span class="badge" style="background: #222; padding: 2px 6px; border-radius: 4px;">${game.week_type || 'Regular'}</span></td>
                            <td style="padding: 8px; text-align: right; ${homeBold ? 'font-weight: bold; color: #fff;' : 'color: #aaa;'}">${game.home_team}</td>
                            <td style="padding: 8px; text-align: center; font-weight: bold; color: #fff;">${game.home_score} - ${game.away_score}</td>
                            <td style="padding: 8px; text-align: left; ${awayBold ? 'font-weight: bold; color: #fff;' : 'color: #aaa;'}">${game.away_team}</td>
                        </tr>
                    `;
                });

                htmlContent += `</tbody></table></div></div>`;
                h2hResultsContainer.innerHTML = htmlContent;
                h2hResultsContainer.style.display = 'block';
                h2hResultsContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

            } catch (error) {
                console.error(error);
                alert("Hubo un error al procesar la solicitud Head-to-Head. Verifica la consola.");
            }
        });
    }
    

  
});