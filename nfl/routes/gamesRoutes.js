const express = require('express');
const router = express.Router();

const {
    getGames,
    getHeadToHead
} = require('../controllers/gamesController');

router.get('/head-to-head', getHeadToHead);
router.get('/', getGames);

module.exports = router;