const express = require('express');
const router = express.Router();

const {
    getSeasonOverview,
    getSeasonWeeks,
    getGamesByWeek,
    getSeasonStandings,
    getGamesByPhase,
    getAllTimeStandings
} = require('../controllers/seasonsController');

router.get('/all-time/standings',     getAllTimeStandings);

router.get('/:year/overview',         getSeasonOverview);
router.get('/:year/weeks',            getSeasonWeeks);
router.get('/:year/week/:weekId',     getGamesByWeek);
router.get('/:year/standings',        getSeasonStandings);
router.get('/:year/phase/:phase',     getGamesByPhase);

module.exports = router;
