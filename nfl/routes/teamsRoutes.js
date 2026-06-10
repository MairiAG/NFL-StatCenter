const express = require('express');
const router = express.Router();

const {
    getAllTeams
} = require('../controllers/teamsController');

router.get('/', getAllTeams);

module.exports = router;
