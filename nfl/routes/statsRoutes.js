const express = require('express');
const router = express.Router();

// Funciones que pusiste en el controlador
const {
    getBettingStandings,
    getHomeVsAwayStats,
    getPointsAnalysis,
    getHeadToHead,
    getRecentGamesSummary
} = require('../controllers/statsController');

// Endpoints para el Front
router.get('/betting-standings', getBettingStandings);
router.get('/home-away', getHomeVsAwayStats);
router.get('/points-analysis', getPointsAnalysis);
router.get('/head-to-head', getHeadToHead);
router.get('/recent-summary', getRecentGamesSummary);

module.exports = router;