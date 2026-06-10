CREATE DATABASE nfl_db;
USE nfl_db;

CREATE TABLE teams (
    team_id INT AUTO_INCREMENT PRIMARY KEY,
    team_name VARCHAR(100) UNIQUE NOT NULL,
    abbreviation VARCHAR(10),
    conference VARCHAR(10),
    division VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE seasons (
    season_id INT AUTO_INCREMENT PRIMARY KEY,
    year INT UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE weeks (
    week_id INT AUTO_INCREMENT PRIMARY KEY,
    season_id INT NOT NULL,
    week_number VARCHAR(20) NOT NULL,
    week_type VARCHAR(20),

    FOREIGN KEY (season_id)
        REFERENCES seasons(season_id)
        ON DELETE CASCADE
);

CREATE TABLE games (
    game_id INT AUTO_INCREMENT PRIMARY KEY,

    season_id INT NOT NULL,
    week_id INT NOT NULL,

    game_date DATE NOT NULL,
    game_time TIME,

    home_team_id INT NOT NULL,
    away_team_id INT NOT NULL,

    home_score INT DEFAULT 0,
    away_score INT DEFAULT 0,

    stadium VARCHAR(100),

    winner_team_id INT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (season_id)
        REFERENCES seasons(season_id)
        ON DELETE CASCADE,

    FOREIGN KEY (week_id)
        REFERENCES weeks(week_id)
        ON DELETE CASCADE,

    FOREIGN KEY (home_team_id)
        REFERENCES teams(team_id),

    FOREIGN KEY (away_team_id)
        REFERENCES teams(team_id),

    FOREIGN KEY (winner_team_id)
        REFERENCES teams(team_id)
);

INSERT INTO teams (team_name, abbreviation, conference, division)
VALUES
('Arizona Cardinals', 'ARI', 'NFC', 'West'),
('Atlanta Falcons', 'ATL', 'NFC', 'South'),
('Baltimore Ravens', 'BAL', 'AFC', 'North'),
('Buffalo Bills', 'BUF', 'AFC', 'East'),
('Carolina Panthers', 'CAR', 'NFC', 'South'),
('Chicago Bears', 'CHI', 'NFC', 'North'),
('Cincinnati Bengals', 'CIN', 'AFC', 'North'),
('Cleveland Browns', 'CLE', 'AFC', 'North'),
('Dallas Cowboys', 'DAL', 'NFC', 'East'),
('Denver Broncos', 'DEN', 'AFC', 'West'),
('Detroit Lions', 'DET', 'NFC', 'North'),
('Green Bay Packers', 'GB', 'NFC', 'North'),
('Houston Texans', 'HOU', 'AFC', 'South'),
('Indianapolis Colts', 'IND', 'AFC', 'South'),
('Jacksonville Jaguars', 'JAX', 'AFC', 'South'),
('Kansas City Chiefs', 'KC', 'AFC', 'West'),
('Las Vegas Raiders', 'LV', 'AFC', 'West'),
('Los Angeles Chargers', 'LAC', 'AFC', 'West'),
('Los Angeles Rams', 'LAR', 'NFC', 'West'),
('Miami Dolphins', 'MIA', 'AFC', 'East'),
('Minnesota Vikings', 'MIN', 'NFC', 'North'),
('New England Patriots', 'NE', 'AFC', 'East'),
('New Orleans Saints', 'NO', 'NFC', 'South'),
('New York Giants', 'NYG', 'NFC', 'East'),
('New York Jets', 'NYJ', 'AFC', 'East'),
('Philadelphia Eagles', 'PHI', 'NFC', 'East'),
('Pittsburgh Steelers', 'PIT', 'AFC', 'North'),
('San Francisco 49ers', 'SF', 'NFC', 'West'),
('Seattle Seahawks', 'SEA', 'NFC', 'West'),
('Tampa Bay Buccaneers', 'TB', 'NFC', 'South'),
('Tennessee Titans', 'TEN', 'AFC', 'South'),
('Washington Commanders', 'WAS', 'NFC', 'East');

INSERT INTO seasons (year)
VALUES
(2015),
(2016),
(2017),
(2018),
(2019),
(2020),
(2021),
(2022),
(2023),
(2024),
(2025);

INSERT INTO seasons (year)
VALUES (2026); 

DELETE FROM games;
DELETE FROM weeks;

TRUNCATE TABLE games;
TRUNCATE TABLE weeks;

SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE games;
TRUNCATE TABLE weeks;
SET FOREIGN_KEY_CHECKS = 1;

SELECT COUNT(*) FROM games;

SELECT * 
FROM seasons;

SELECT *
FROM weeks;

SELECT
    s.year,
    COUNT(*) AS total_games
FROM games g
JOIN seasons s
ON g.season_id = s.season_id
GROUP BY s.year
ORDER BY s.year;

SELECT *
FROM games
ORDER BY game_date DESC
LIMIT 20;

SELECT 
    team_id,
    team_name
FROM teams
ORDER BY team_name ASC;

DESCRIBE games;
DESCRIBE weeks;

SELECT COUNT(*) AS total_games
FROM games;

SELECT *
FROM games
LIMIT 10;

SELECT
    team_id,
    team_name,
    abbreviation
FROM teams
WHERE abbreviation IN ('SEA','NE');

SELECT
    g.game_id,
    g.game_date,
    ht.abbreviation AS home_team,
    at.abbreviation AS away_team,
    g.home_score,
    g.away_score
FROM games g
JOIN teams ht ON g.home_team_id = ht.team_id
JOIN teams at ON g.away_team_id = at.team_id
WHERE
(
    ht.abbreviation = 'SEA'
    AND at.abbreviation = 'NE'
)
OR
(
    ht.abbreviation = 'NE'
    AND at.abbreviation = 'SEA'
);

SELECT
    g.game_date,
    ht.abbreviation AS home_team,
    at.abbreviation AS away_team,
    g.home_score,
    g.away_score,
    (g.home_score + g.away_score) AS total_points
FROM games g
JOIN teams ht ON g.home_team_id = ht.team_id
JOIN teams at ON g.away_team_id = at.team_id
ORDER BY total_points DESC
LIMIT 10;

DESCRIBE seasons;
DESCRIBE weeks;
DESCRIBE games;
DESCRIBE teams;
SELECT COUNT(*) FROM games;

DESCRIBE teams;
SELECT * FROM teams LIMIT 10;

DESCRIBE weeks;
SELECT * FROM weeks LIMIT 10;

SELECT *
FROM weeks
WHERE season_id = 12;

SELECT week_id, week_number, week_type 
FROM weeks 
WHERE season_id = 12 
ORDER BY week_id;

INSERT INTO weeks (season_id, week_number, week_type)
SELECT s.season_id, n.week_number, 'Regular'
FROM seasons s
JOIN (
    SELECT 1 AS week_number UNION SELECT 2 UNION SELECT 3 UNION SELECT 4
    UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8
    UNION SELECT 9 UNION SELECT 10 UNION SELECT 11 UNION SELECT 12
    UNION SELECT 13 UNION SELECT 14 UNION SELECT 15 UNION SELECT 16
    UNION SELECT 17 UNION SELECT 18
) n ON 1=1
WHERE s.year = 2026;

SELECT COUNT(*) FROM weeks WHERE season_id = 12;

INSERT INTO games (season_id, week_id, game_date, game_time, home_team_id, away_team_id, home_score, away_score)
SELECT
    s.season_id,
    w.week_id,
    v.game_date,
    v.game_time,
    ht.team_id AS home_team_id,
    at.team_id AS away_team_id,
    NULL AS home_score,
    NULL AS away_score
FROM (VALUES
    ROW(1, '2026-09-09', '20:20:00', 'New England Patriots', 'Seattle Seahawks'),
    ROW(1, '2026-09-10', '20:35:00', 'San Francisco 49ers', 'Los Angeles Rams'),
    ROW(1, '2026-09-13', '13:00:00', 'Chicago Bears', 'Carolina Panthers'),
    ROW(1, '2026-09-13', '13:00:00', 'Tampa Bay Buccaneers', 'Cincinnati Bengals'),
    ROW(1, '2026-09-13', '13:00:00', 'Baltimore Ravens', 'Indianapolis Colts'),
    ROW(1, '2026-09-13', '13:00:00', 'New Orleans Saints', 'Detroit Lions'),
    ROW(1, '2026-09-13', '13:00:00', 'Buffalo Bills', 'Houston Texans'),
    ROW(1, '2026-09-13', '13:00:00', 'Cleveland Browns', 'Jacksonville Jaguars'),
    ROW(1, '2026-09-13', '13:00:00', 'New York Jets', 'Tennessee Titans'),
    ROW(1, '2026-09-13', '13:00:00', 'Atlanta Falcons', 'Pittsburgh Steelers'),
    ROW(1, '2026-09-13', '16:25:00', 'Green Bay Packers', 'Minnesota Vikings'),
    ROW(1, '2026-09-13', '16:25:00', 'Washington Commanders', 'Philadelphia Eagles'),
    ROW(1, '2026-09-13', '16:25:00', 'Miami Dolphins', 'Las Vegas Raiders'),
    ROW(1, '2026-09-13', '16:25:00', 'Arizona Cardinals', 'Los Angeles Chargers'),
    ROW(1, '2026-09-13', '20:20:00', 'Dallas Cowboys', 'New York Giants'),
    ROW(1, '2026-09-14', '20:15:00', 'Denver Broncos', 'Kansas City Chiefs'),
    ROW(2, '2026-09-17', '20:15:00', 'Detroit Lions', 'Buffalo Bills'),
    ROW(2, '2026-09-20', '13:00:00', 'Carolina Panthers', 'Atlanta Falcons'),
    ROW(2, '2026-09-20', '13:00:00', 'Minnesota Vikings', 'Chicago Bears'),
    ROW(2, '2026-09-20', '13:00:00', 'Cincinnati Bengals', 'Houston Texans'),
    ROW(2, '2026-09-20', '13:00:00', 'Pittsburgh Steelers', 'New England Patriots'),
    ROW(2, '2026-09-20', '13:00:00', 'Green Bay Packers', 'New York Jets'),
    ROW(2, '2026-09-20', '13:00:00', 'Philadelphia Eagles', 'Tennessee Titans'),
    ROW(2, '2026-09-20', '13:00:00', 'New Orleans Saints', 'Baltimore Ravens'),
    ROW(2, '2026-09-20', '13:00:00', 'Cleveland Browns', 'Tampa Bay Buccaneers'),
    ROW(2, '2026-09-20', '16:05:00', 'Jacksonville Jaguars', 'Denver Broncos'),
    ROW(2, '2026-09-20', '16:05:00', 'Las Vegas Raiders', 'Los Angeles Chargers'),
    ROW(2, '2026-09-20', '16:25:00', 'Seattle Seahawks', 'Arizona Cardinals'),
    ROW(2, '2026-09-20', '16:25:00', 'Washington Commanders', 'Dallas Cowboys'),
    ROW(2, '2026-09-20', '16:25:00', 'Miami Dolphins', 'San Francisco 49ers'),
    ROW(2, '2026-09-20', '20:20:00', 'Indianapolis Colts', 'Kansas City Chiefs'),
    ROW(2, '2026-09-21', '20:15:00', 'New York Giants', 'Los Angeles Rams'),
    ROW(3, '2026-09-24', '20:15:00', 'Atlanta Falcons', 'Green Bay Packers'),
    ROW(3, '2026-09-27', '13:00:00', 'Los Angeles Chargers', 'Buffalo Bills'),
    ROW(3, '2026-09-27', '13:00:00', 'Carolina Panthers', 'Cleveland Browns'),
    ROW(3, '2026-09-27', '13:00:00', 'Houston Texans', 'Indianapolis Colts'),
    ROW(3, '2026-09-27', '13:00:00', 'New York Jets', 'Detroit Lions'),
    ROW(3, '2026-09-27', '13:00:00', 'New England Patriots', 'Jacksonville Jaguars'),
    ROW(3, '2026-09-27', '13:00:00', 'Kansas City Chiefs', 'Miami Dolphins'),
    ROW(3, '2026-09-27', '13:00:00', 'Tennessee Titans', 'New York Giants'),
    ROW(3, '2026-09-27', '13:00:00', 'Cincinnati Bengals', 'Pittsburgh Steelers'),
    ROW(3, '2026-09-27', '13:00:00', 'Seattle Seahawks', 'Washington Commanders'),
    ROW(3, '2026-09-27', '16:05:00', 'Arizona Cardinals', 'San Francisco 49ers'),
    ROW(3, '2026-09-27', '16:05:00', 'Minnesota Vikings', 'Tampa Bay Buccaneers'),
    ROW(3, '2026-09-27', '16:25:00', 'Baltimore Ravens', 'Dallas Cowboys'),
    ROW(3, '2026-09-27', '16:25:00', 'Las Vegas Raiders', 'New Orleans Saints'),
    ROW(3, '2026-09-27', '20:20:00', 'Los Angeles Rams', 'Denver Broncos'),
    ROW(3, '2026-09-28', '20:15:00', 'Philadelphia Eagles', 'Chicago Bears'),
    ROW(4, '2026-10-01', '20:15:00', 'Pittsburgh Steelers', 'Cleveland Browns'),
    ROW(4, '2026-10-04', '09:30:00', 'Indianapolis Colts', 'Washington Commanders'),
    ROW(4, '2026-10-04', '13:00:00', 'New England Patriots', 'Buffalo Bills'),
    ROW(4, '2026-10-04', '13:00:00', 'New York Jets', 'Chicago Bears'),
    ROW(4, '2026-10-04', '13:00:00', 'Jacksonville Jaguars', 'Cincinnati Bengals'),
    ROW(4, '2026-10-04', '13:00:00', 'Dallas Cowboys', 'Houston Texans'),
    ROW(4, '2026-10-04', '13:00:00', 'Arizona Cardinals', 'New York Giants'),
    ROW(4, '2026-10-04', '13:00:00', 'Los Angeles Rams', 'Philadelphia Eagles'),
    ROW(4, '2026-10-04', '13:00:00', 'Tennessee Titans', 'Baltimore Ravens'),
    ROW(4, '2026-10-04', '13:00:00', 'Green Bay Packers', 'Tampa Bay Buccaneers'),
    ROW(4, '2026-10-04', '16:05:00', 'Miami Dolphins', 'Minnesota Vikings'),
    ROW(4, '2026-10-04', '16:25:00', 'Kansas City Chiefs', 'Las Vegas Raiders'),
    ROW(4, '2026-10-04', '16:25:00', 'Los Angeles Chargers', 'Seattle Seahawks'),
    ROW(4, '2026-10-04', '16:25:00', 'Denver Broncos', 'San Francisco 49ers'),
    ROW(4, '2026-10-04', '20:20:00', 'Detroit Lions', 'Carolina Panthers'),
    ROW(4, '2026-10-05', '20:15:00', 'Atlanta Falcons', 'New Orleans Saints'),
    ROW(5, '2026-10-08', '20:15:00', 'Tampa Bay Buccaneers', 'Dallas Cowboys'),
    ROW(5, '2026-10-11', '09:30:00', 'Philadelphia Eagles', 'Jacksonville Jaguars'),
    ROW(5, '2026-10-11', '13:00:00', 'Cincinnati Bengals', 'Miami Dolphins'),
    ROW(5, '2026-10-11', '13:00:00', 'Minnesota Vikings', 'New Orleans Saints'),
    ROW(5, '2026-10-11', '13:00:00', 'Las Vegas Raiders', 'New England Patriots'),
    ROW(5, '2026-10-11', '13:00:00', 'Cleveland Browns', 'New York Jets'),
    ROW(5, '2026-10-11', '13:00:00', 'Houston Texans', 'Tennessee Titans'),
    ROW(5, '2026-10-11', '13:00:00', 'Indianapolis Colts', 'Pittsburgh Steelers'),
    ROW(5, '2026-10-11', '13:00:00', 'New York Giants', 'Washington Commanders'),
    ROW(5, '2026-10-11', '16:05:00', 'Denver Broncos', 'Los Angeles Chargers'),
    ROW(5, '2026-10-11', '16:25:00', 'Detroit Lions', 'Arizona Cardinals'),
    ROW(5, '2026-10-11', '16:25:00', 'Chicago Bears', 'Green Bay Packers'),
    ROW(5, '2026-10-11', '16:25:00', 'San Francisco 49ers', 'Seattle Seahawks'),
    ROW(5, '2026-10-11', '20:20:00', 'Baltimore Ravens', 'Atlanta Falcons'),
    ROW(5, '2026-10-12', '20:15:00', 'Buffalo Bills', 'Los Angeles Rams'),
    ROW(6, '2026-10-15', '20:15:00', 'Seattle Seahawks', 'Denver Broncos'),
    ROW(6, '2026-10-18', '09:30:00', 'Houston Texans', 'Jacksonville Jaguars'),
    ROW(6, '2026-10-18', '13:00:00', 'Chicago Bears', 'Atlanta Falcons'),
    ROW(6, '2026-10-18', '13:00:00', 'Baltimore Ravens', 'Cleveland Browns'),
    ROW(6, '2026-10-18', '13:00:00', 'Tennessee Titans', 'Indianapolis Colts'),
    ROW(6, '2026-10-18', '13:00:00', 'New York Jets', 'New England Patriots'),
    ROW(6, '2026-10-18', '13:00:00', 'New Orleans Saints', 'New York Giants'),
    ROW(6, '2026-10-18', '13:00:00', 'Carolina Panthers', 'Philadelphia Eagles'),
    ROW(6, '2026-10-18', '13:00:00', 'Pittsburgh Steelers', 'Tampa Bay Buccaneers'),
    ROW(6, '2026-10-18', '16:05:00', 'Arizona Cardinals', 'Los Angeles Rams'),
    ROW(6, '2026-10-18', '16:25:00', 'Los Angeles Chargers', 'Kansas City Chiefs'),
    ROW(6, '2026-10-18', '16:25:00', 'Buffalo Bills', 'Las Vegas Raiders'),
    ROW(6, '2026-10-18', '20:20:00', 'Dallas Cowboys', 'Green Bay Packers'),
    ROW(6, '2026-10-19', '20:15:00', 'Washington Commanders', 'San Francisco 49ers'),
    ROW(7, '2026-10-22', '20:15:00', 'New England Patriots', 'Chicago Bears'),
    ROW(7, '2026-10-25', '09:30:00', 'Pittsburgh Steelers', 'New Orleans Saints'),
    ROW(7, '2026-10-25', '13:00:00', 'San Francisco 49ers', 'Atlanta Falcons'),
    ROW(7, '2026-10-25', '13:00:00', 'Tampa Bay Buccaneers', 'Carolina Panthers'),
    ROW(7, '2026-10-25', '13:00:00', 'New York Giants', 'Houston Texans'),
    ROW(7, '2026-10-25', '13:00:00', 'Indianapolis Colts', 'Minnesota Vikings'),
    ROW(7, '2026-10-25', '13:00:00', 'Miami Dolphins', 'New York Jets'),
    ROW(7, '2026-10-25', '13:00:00', 'Cleveland Browns', 'Tennessee Titans'),
    ROW(7, '2026-10-25', '13:00:00', 'Cincinnati Bengals', 'Baltimore Ravens'),
    ROW(7, '2026-10-25', '16:05:00', 'Denver Broncos', 'Arizona Cardinals'),
    ROW(7, '2026-10-25', '16:25:00', 'Green Bay Packers', 'Detroit Lions'),
    ROW(7, '2026-10-25', '16:25:00', 'Los Angeles Rams', 'Las Vegas Raiders'),
    ROW(7, '2026-10-25', '20:20:00', 'Kansas City Chiefs', 'Seattle Seahawks'),
    ROW(7, '2026-10-26', '20:15:00', 'Dallas Cowboys', 'Philadelphia Eagles'),
    ROW(8, '2026-10-29', '20:15:00', 'Carolina Panthers', 'Green Bay Packers'),
    ROW(8, '2026-11-01', '13:00:00', 'Baltimore Ravens', 'Buffalo Bills'),
    ROW(8, '2026-11-01', '13:00:00', 'Tennessee Titans', 'Cincinnati Bengals'),
    ROW(8, '2026-11-01', '13:00:00', 'Arizona Cardinals', 'Dallas Cowboys'),
    ROW(8, '2026-11-01', '13:00:00', 'Minnesota Vikings', 'Detroit Lions'),
    ROW(8, '2026-11-01', '13:00:00', 'Indianapolis Colts', 'Jacksonville Jaguars'),
    ROW(8, '2026-11-01', '13:00:00', 'Las Vegas Raiders', 'New York Jets'),
    ROW(8, '2026-11-01', '13:00:00', 'Cleveland Browns', 'Pittsburgh Steelers'),
    ROW(8, '2026-11-01', '13:00:00', 'Atlanta Falcons', 'Tampa Bay Buccaneers'),
    ROW(8, '2026-11-01', '16:05:00', 'Los Angeles Chargers', 'Los Angeles Rams'),
    ROW(8, '2026-11-01', '16:25:00', 'Kansas City Chiefs', 'Denver Broncos'),
    ROW(8, '2026-11-01', '16:25:00', 'New England Patriots', 'Miami Dolphins'),
    ROW(8, '2026-11-01', '20:20:00', 'Philadelphia Eagles', 'Washington Commanders'),
    ROW(8, '2026-11-02', '20:15:00', 'Chicago Bears', 'Seattle Seahawks'),
    ROW(9, '2026-11-05', '20:15:00', 'Jacksonville Jaguars', 'Baltimore Ravens'),
    ROW(9, '2026-11-08', '09:30:00', 'Cincinnati Bengals', 'Atlanta Falcons'),
    ROW(9, '2026-11-08', '13:00:00', 'Denver Broncos', 'Carolina Panthers'),
    ROW(9, '2026-11-08', '13:00:00', 'Dallas Cowboys', 'Indianapolis Colts'),
    ROW(9, '2026-11-08', '13:00:00', 'New York Jets', 'Kansas City Chiefs'),
    ROW(9, '2026-11-08', '13:00:00', 'Detroit Lions', 'Miami Dolphins'),
    ROW(9, '2026-11-08', '13:00:00', 'Cleveland Browns', 'New Orleans Saints'),
    ROW(9, '2026-11-08', '13:00:00', 'New York Giants', 'Philadelphia Eagles'),
    ROW(9, '2026-11-08', '13:00:00', 'Los Angeles Rams', 'Washington Commanders'),
    ROW(9, '2026-11-08', '16:05:00', 'Houston Texans', 'Los Angeles Chargers'),
    ROW(9, '2026-11-08', '16:05:00', 'Las Vegas Raiders', 'San Francisco 49ers'),
    ROW(9, '2026-11-08', '16:25:00', 'Green Bay Packers', 'New England Patriots'),
    ROW(9, '2026-11-08', '16:25:00', 'Arizona Cardinals', 'Seattle Seahawks'),
    ROW(9, '2026-11-08', '20:20:00', 'Tampa Bay Buccaneers', 'Chicago Bears'),
    ROW(9, '2026-11-09', '20:15:00', 'Buffalo Bills', 'Minnesota Vikings'),
    ROW(10, '2026-11-12', '20:15:00', 'Washington Commanders', 'New York Giants'),
    ROW(10, '2026-11-15', '09:30:00', 'New England Patriots', 'Detroit Lions'),
    ROW(10, '2026-11-15', '13:00:00', 'Kansas City Chiefs', 'Atlanta Falcons'),
    ROW(10, '2026-11-15', '13:00:00', 'Houston Texans', 'Cleveland Browns'),
    ROW(10, '2026-11-15', '13:00:00', 'Miami Dolphins', 'Indianapolis Colts'),
    ROW(10, '2026-11-15', '13:00:00', 'Minnesota Vikings', 'Green Bay Packers'),
    ROW(10, '2026-11-15', '13:00:00', 'Carolina Panthers', 'New Orleans Saints'),
    ROW(10, '2026-11-15', '13:00:00', 'Buffalo Bills', 'New York Jets'),
    ROW(10, '2026-11-15', '13:00:00', 'Jacksonville Jaguars', 'Tennessee Titans'),
    ROW(10, '2026-11-15', '16:05:00', 'Los Angeles Rams', 'Arizona Cardinals'),
    ROW(10, '2026-11-15', '16:05:00', 'Seattle Seahawks', 'Las Vegas Raiders'),
    ROW(10, '2026-11-15', '16:25:00', 'San Francisco 49ers', 'Dallas Cowboys'),
    ROW(10, '2026-11-15', '20:20:00', 'Pittsburgh Steelers', 'Cincinnati Bengals'),
    ROW(10, '2026-11-16', '20:15:00', 'Los Angeles Chargers', 'Baltimore Ravens'),
    ROW(11, '2026-11-19', '20:15:00', 'Indianapolis Colts', 'Houston Texans'),
    ROW(11, '2026-11-22', '13:00:00', 'Miami Dolphins', 'Buffalo Bills'),
    ROW(11, '2026-11-22', '13:00:00', 'Baltimore Ravens', 'Carolina Panthers'),
    ROW(11, '2026-11-22', '13:00:00', 'New Orleans Saints', 'Chicago Bears'),
    ROW(11, '2026-11-22', '13:00:00', 'Tennessee Titans', 'Dallas Cowboys'),
    ROW(11, '2026-11-22', '13:00:00', 'Tampa Bay Buccaneers', 'Detroit Lions'),
    ROW(11, '2026-11-22', '13:00:00', 'Arizona Cardinals', 'Kansas City Chiefs'),
    ROW(11, '2026-11-22', '13:00:00', 'Jacksonville Jaguars', 'New York Giants'),
    ROW(11, '2026-11-22', '16:05:00', 'New York Jets', 'Los Angeles Chargers'),
    ROW(11, '2026-11-22', '16:25:00', 'Las Vegas Raiders', 'Denver Broncos'),
    ROW(11, '2026-11-22', '16:25:00', 'Pittsburgh Steelers', 'Philadelphia Eagles'),
    ROW(11, '2026-11-22', '20:20:00', 'Minnesota Vikings', 'San Francisco 49ers'),
    ROW(11, '2026-11-23', '20:15:00', 'Cincinnati Bengals', 'Washington Commanders'),
    ROW(12, '2026-11-25', '20:00:00', 'Green Bay Packers', 'Los Angeles Rams'),
    ROW(12, '2026-11-26', '13:00:00', 'Chicago Bears', 'Detroit Lions'),
    ROW(12, '2026-11-26', '16:30:00', 'Philadelphia Eagles', 'Dallas Cowboys'),
    ROW(12, '2026-11-26', '20:20:00', 'Kansas City Chiefs', 'Buffalo Bills'),
    ROW(12, '2026-11-27', '15:00:00', 'Denver Broncos', 'Pittsburgh Steelers'),
    ROW(12, '2026-11-29', '13:00:00', 'New Orleans Saints', 'Cincinnati Bengals'),
    ROW(12, '2026-11-29', '13:00:00', 'Las Vegas Raiders', 'Cleveland Browns'),
    ROW(12, '2026-11-29', '13:00:00', 'New York Giants', 'Indianapolis Colts'),
    ROW(12, '2026-11-29', '13:00:00', 'Baltimore Ravens', 'Houston Texans'),
    ROW(12, '2026-11-29', '13:00:00', 'New York Jets', 'Miami Dolphins'),
    ROW(12, '2026-11-29', '13:00:00', 'Atlanta Falcons', 'Minnesota Vikings'),
    ROW(12, '2026-11-29', '16:05:00', 'Tennessee Titans', 'Jacksonville Jaguars'),
    ROW(12, '2026-11-29', '16:25:00', 'Washington Commanders', 'Arizona Cardinals'),
    ROW(12, '2026-11-29', '16:25:00', 'Seattle Seahawks', 'San Francisco 49ers'),
    ROW(12, '2026-11-29', '20:20:00', 'New England Patriots', 'Los Angeles Chargers'),
    ROW(12, '2026-11-30', '20:15:00', 'Carolina Panthers', 'Tampa Bay Buccaneers'),
    ROW(13, '2026-12-03', '20:15:00', 'Kansas City Chiefs', 'Los Angeles Rams'),
    ROW(13, '2026-12-06', '13:00:00', 'Detroit Lions', 'Atlanta Falcons'),
    ROW(13, '2026-12-06', '13:00:00', 'Jacksonville Jaguars', 'Chicago Bears'),
    ROW(13, '2026-12-06', '13:00:00', 'Cincinnati Bengals', 'Cleveland Browns'),
    ROW(13, '2026-12-06', '13:00:00', 'Green Bay Packers', 'New Orleans Saints'),
    ROW(13, '2026-12-06', '13:00:00', 'San Francisco 49ers', 'New York Giants'),
    ROW(13, '2026-12-06', '13:00:00', 'Washington Commanders', 'Tennessee Titans'),
    ROW(13, '2026-12-06', '13:00:00', 'Los Angeles Chargers', 'Tampa Bay Buccaneers'),
    ROW(13, '2026-12-06', '16:05:00', 'Philadelphia Eagles', 'Arizona Cardinals'),
    ROW(13, '2026-12-06', '16:05:00', 'Miami Dolphins', 'Denver Broncos'),
    ROW(13, '2026-12-06', '16:25:00', 'Carolina Panthers', 'Minnesota Vikings'),
    ROW(13, '2026-12-06', '16:25:00', 'Buffalo Bills', 'New England Patriots'),
    ROW(13, '2026-12-06', '20:20:00', 'Houston Texans', 'Pittsburgh Steelers'),
    ROW(13, '2026-12-07', '20:15:00', 'Dallas Cowboys', 'Seattle Seahawks'),
    ROW(14, '2026-12-10', '20:15:00', 'Minnesota Vikings', 'New England Patriots'),
    ROW(14, '2026-12-13', '13:00:00', 'New Orleans Saints', 'Carolina Panthers'),
    ROW(14, '2026-12-13', '13:00:00', 'Atlanta Falcons', 'Cleveland Browns'),
    ROW(14, '2026-12-13', '13:00:00', 'Tennessee Titans', 'Detroit Lions'),
    ROW(14, '2026-12-13', '13:00:00', 'Chicago Bears', 'Miami Dolphins'),
    ROW(14, '2026-12-13', '13:00:00', 'Denver Broncos', 'New York Jets'),
    ROW(14, '2026-12-13', '13:00:00', 'Indianapolis Colts', 'Philadelphia Eagles'),
    ROW(14, '2026-12-13', '13:00:00', 'Tampa Bay Buccaneers', 'Baltimore Ravens'),
    ROW(14, '2026-12-13', '13:00:00', 'Houston Texans', 'Washington Commanders'),
    ROW(14, '2026-12-13', '16:05:00', 'Los Angeles Chargers', 'Las Vegas Raiders'),
    ROW(14, '2026-12-13', '16:25:00', 'Kansas City Chiefs', 'Cincinnati Bengals'),
    ROW(14, '2026-12-13', '16:25:00', 'New York Giants', 'Seattle Seahawks'),
    ROW(14, '2026-12-13', '16:25:00', 'Los Angeles Rams', 'San Francisco 49ers'),
    ROW(14, '2026-12-13', '20:20:00', 'Buffalo Bills', 'Green Bay Packers'),
    ROW(14, '2026-12-14', '20:15:00', 'Pittsburgh Steelers', 'Jacksonville Jaguars'),
    ROW(15, '2026-12-17', '20:15:00', 'San Francisco 49ers', 'Los Angeles Chargers'),
    ROW(15, '2026-12-19', '17:00:00', 'Seattle Seahawks', 'Philadelphia Eagles'),
    ROW(15, '2026-12-19', '20:20:00', 'Chicago Bears', 'Buffalo Bills'),
    ROW(15, '2026-12-20', '13:00:00', 'Cincinnati Bengals', 'Carolina Panthers'),
    ROW(15, '2026-12-20', '13:00:00', 'Miami Dolphins', 'Green Bay Packers'),
    ROW(15, '2026-12-20', '13:00:00', 'Jacksonville Jaguars', 'Houston Texans'),
    ROW(15, '2026-12-20', '13:00:00', 'Cleveland Browns', 'New York Giants'),
    ROW(15, '2026-12-20', '13:00:00', 'Indianapolis Colts', 'Tennessee Titans'),
    ROW(15, '2026-12-20', '13:00:00', 'Baltimore Ravens', 'Pittsburgh Steelers'),
    ROW(15, '2026-12-20', '13:00:00', 'New Orleans Saints', 'Tampa Bay Buccaneers'),
    ROW(15, '2026-12-20', '13:00:00', 'Atlanta Falcons', 'Washington Commanders'),
    ROW(15, '2026-12-20', '16:05:00', 'New York Jets', 'Arizona Cardinals'),
    ROW(15, '2026-12-20', '16:25:00', 'Denver Broncos', 'Las Vegas Raiders'),
    ROW(15, '2026-12-20', '16:25:00', 'Dallas Cowboys', 'Los Angeles Rams'),
    ROW(15, '2026-12-20', '20:20:00', 'Detroit Lions', 'Minnesota Vikings'),
    ROW(15, '2026-12-21', '20:15:00', 'New England Patriots', 'Kansas City Chiefs'),
    ROW(16, '2026-12-24', '20:15:00', 'Houston Texans', 'Philadelphia Eagles'),
    ROW(16, '2026-12-25', '13:00:00', 'Green Bay Packers', 'Chicago Bears'),
    ROW(16, '2026-12-25', '16:30:00', 'Buffalo Bills', 'Denver Broncos'),
    ROW(16, '2026-12-25', '20:15:00', 'Los Angeles Rams', 'Seattle Seahawks'),
    ROW(16, '2026-12-27', '13:00:00', 'Tampa Bay Buccaneers', 'Atlanta Falcons'),
    ROW(16, '2026-12-27', '13:00:00', 'Cincinnati Bengals', 'Indianapolis Colts'),
    ROW(16, '2026-12-27', '13:00:00', 'Los Angeles Chargers', 'Miami Dolphins'),
    ROW(16, '2026-12-27', '13:00:00', 'Washington Commanders', 'Minnesota Vikings'),
    ROW(16, '2026-12-27', '13:00:00', 'Arizona Cardinals', 'New Orleans Saints'),
    ROW(16, '2026-12-27', '13:00:00', 'New England Patriots', 'New York Jets'),
    ROW(16, '2026-12-27', '13:00:00', 'Carolina Panthers', 'Pittsburgh Steelers'),
    ROW(16, '2026-12-27', '13:00:00', 'Cleveland Browns', 'Baltimore Ravens'),
    ROW(16, '2026-12-27', '16:05:00', 'Tennessee Titans', 'Las Vegas Raiders'),
    ROW(16, '2026-12-27', '16:25:00', 'San Francisco 49ers', 'Kansas City Chiefs'),
    ROW(16, '2026-12-27', '20:20:00', 'Jacksonville Jaguars', 'Dallas Cowboys'),
    ROW(16, '2026-12-28', '20:15:00', 'New York Giants', 'Detroit Lions'),
    ROW(17, '2026-12-31', '20:15:00', 'Baltimore Ravens', 'Cincinnati Bengals'),
    ROW(17, '2027-01-03', '13:00:00', 'New Orleans Saints', 'Atlanta Falcons'),
    ROW(17, '2027-01-03', '13:00:00', 'Seattle Seahawks', 'Carolina Panthers'),
    ROW(17, '2027-01-03', '13:00:00', 'Indianapolis Colts', 'Cleveland Browns'),
    ROW(17, '2027-01-03', '13:00:00', 'New York Giants', 'Dallas Cowboys'),
    ROW(17, '2027-01-03', '13:00:00', 'Washington Commanders', 'Jacksonville Jaguars'),
    ROW(17, '2027-01-03', '13:00:00', 'Buffalo Bills', 'Miami Dolphins'),
    ROW(17, '2027-01-03', '13:00:00', 'Denver Broncos', 'New England Patriots'),
    ROW(17, '2027-01-03', '13:00:00', 'Minnesota Vikings', 'New York Jets'),
    ROW(17, '2027-01-03', '13:00:00', 'Pittsburgh Steelers', 'Tennessee Titans'),
    ROW(17, '2027-01-03', '13:00:00', 'Kansas City Chiefs', 'Los Angeles Chargers'),
    ROW(17, '2027-01-03', '13:00:00', 'Los Angeles Rams', 'Tampa Bay Buccaneers'),
    ROW(17, '2027-01-03', '16:05:00', 'Las Vegas Raiders', 'Arizona Cardinals'),
    ROW(17, '2027-01-03', '16:25:00', 'Detroit Lions', 'Chicago Bears'),
    ROW(17, '2027-01-03', '20:20:00', 'Philadelphia Eagles', 'San Francisco 49ers'),
    ROW(17, '2027-01-04', '20:15:00', 'Houston Texans', 'Green Bay Packers'),
    ROW(18, '2027-01-10', '13:00:00', 'New York Jets', 'Buffalo Bills'),
    ROW(18, '2027-01-10', '13:00:00', 'Atlanta Falcons', 'Carolina Panthers'),
    ROW(18, '2027-01-10', '13:00:00', 'Cleveland Browns', 'Cincinnati Bengals'),
    ROW(18, '2027-01-10', '13:00:00', 'Jacksonville Jaguars', 'Indianapolis Colts'),
    ROW(18, '2027-01-10', '13:00:00', 'San Francisco 49ers', 'Arizona Cardinals'),
    ROW(18, '2027-01-10', '13:00:00', 'Los Angeles Chargers', 'Denver Broncos'),
    ROW(18, '2027-01-10', '13:00:00', 'Detroit Lions', 'Green Bay Packers'),
    ROW(18, '2027-01-10', '13:00:00', 'Tennessee Titans', 'Houston Texans'),
    ROW(18, '2027-01-10', '13:00:00', 'Las Vegas Raiders', 'Kansas City Chiefs'),
    ROW(18, '2027-01-10', '13:00:00', 'Chicago Bears', 'Minnesota Vikings'),
    ROW(18, '2027-01-10', '13:00:00', 'Tampa Bay Buccaneers', 'New Orleans Saints'),
    ROW(18, '2027-01-10', '13:00:00', 'Miami Dolphins', 'New England Patriots'),
    ROW(18, '2027-01-10', '13:00:00', 'Philadelphia Eagles', 'New York Giants'),
    ROW(18, '2027-01-10', '13:00:00', 'Seattle Seahawks', 'Los Angeles Rams'),
    ROW(18, '2027-01-10', '13:00:00', 'Pittsburgh Steelers', 'Baltimore Ravens'),
    ROW(18, '2027-01-10', '13:00:00', 'Dallas Cowboys', 'Washington Commanders')
) AS v(week_num, game_date, game_time, away_name, home_name)
JOIN seasons s ON s.year = 2026
JOIN weeks w ON w.season_id = s.season_id
    AND w.week_number = v.week_num
    AND w.week_type = 'Regular'
JOIN teams ht ON ht.team_name = v.home_name
JOIN teams at ON at.team_name = v.away_name;

SELECT COUNT(*) AS partidos_insertados FROM games g
JOIN seasons s ON g.season_id = s.season_id
WHERE s.year = 2026;

SELECT game_date, home_team_id, away_team_id, COUNT(*) AS repeticiones
FROM games g
JOIN seasons s ON g.season_id = s.season_id
WHERE s.year = 2026
GROUP BY game_date, home_team_id, away_team_id
HAVING COUNT(*) > 1;

SELECT COUNT(*) FROM games g
JOIN seasons s ON g.season_id = s.season_id
WHERE s.year = 2026;

SELECT
    t.team_id,
    t.team_name,
    COUNT(g.game_id) AS played,
    ROUND(AVG(CASE WHEN g.home_team_id = t.team_id AND g.home_score IS NOT NULL THEN g.home_score
                   WHEN g.away_team_id = t.team_id AND g.away_score IS NOT NULL THEN g.away_score END), 1) AS avg_scored
FROM teams t
JOIN games g ON (t.team_id = g.home_team_id OR t.team_id = g.away_team_id)
WHERE g.home_score IS NOT NULL
GROUP BY t.team_id, t.team_name
LIMIT 5;