var env = require("../environment.config");
var dbenvironment = env.production;
var pg = require("pg");
var pool = pg.Pool(dbenvironment);

module.exports.getTeam = async (id) => {
    var sql = `SELECT * FROM users_tournaments_players WHERE user_id = $1`;
    var team = await pool.query(sql, [id]);
    return team.rows;
}

module.exports.getTeams = async () => {
    var sql = `WITH team_json AS (
        SELECT user_id, ARRAY_AGG(row_to_json(json_rows)) AS team
        FROM
        (SELECT users_tournaments_players.*, users.username, users.first_name, users.last_name
        FROM users_tournaments_players
        INNER JOIN users
        ON users_tournaments_players.user_id = users.id) AS json_rows
        GROUP BY user_id)
        SELECT wt.user_id, team_json.team::jsonb[]
        FROM users_tournaments_players AS wt
        INNER JOIN team_json
        ON team_json.user_id = wt.user_id
        GROUP BY wt.user_id, team_json.team::jsonb[]`;
    var teams = await pool.query(sql);
    teams.rows.forEach(row => {
        delete row.password;
    })
    return teams.rows;
}

module.exports.deleteTeam = async (user_id, tournament_id) => {
    var sql = `DELETE FROM users_tournaments_players WHERE user_id = $1 AND tournament_id = $2`;
    await pool.query(sql, [user_id, tournament_id]);
    return;
}

module.exports.saveTeam = async (user_id, team) => {
    var sql = `INSERT INTO  users_tournaments_players (user_id, tournament_id, player, player_ranking_at_event) VALUES ($1, 1, $2, $3);`
    await pool.query(sql, [user_id, team.tier1.playerName, team.tier1.playerRank]);
    await pool.query(sql, [user_id, team.tier2.playerName, team.tier2.playerRank]);
    await pool.query(sql, [user_id, team.tier3.playerName, team.tier3.playerRank]);
    await pool.query(sql, [user_id, team.tier4.playerName, team.tier4.playerRank]);
    return;
}