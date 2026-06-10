const db = require('../config/db');

const getAllTeams = async (req, res) => {
    try {
        const[rows] = await db.execute(
            `SELECT *
            FROM teams 
            ORDER BY team_name`
        );
        
        res.json(rows);

    } catch(err) {
        
        console.log(err);

        res.status(500).json({
            error: 'Error obteniendo equipos'
        });
    }
};

module.exports = {
    getAllTeams
};