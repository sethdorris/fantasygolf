var env = require("../environment.config");
var dbenvironment = env.development;
var pg = require("pg");
var pool = pg.Pool(dbenvironment);

module.exports.getOgwr = async () => {
    var sql = "SELECT * FROM owgr;";
    var result = await pool.query(sql);
    return result.rows;
}