var env = require("../environment.config");
var crypto = require("crypto");
var dbenvironment = env.production;
var pg = require("pg");
var pool = pg.Pool(dbenvironment);

module.exports.registerUser = async (username, email, fn, ln, pw) => {
    var sql = "INSERT INTO users (username, email, first_name, last_name, password) VALUES ($1, $2, $3, $4, $5) RETURNING *";
    var salt = crypto.randomBytes(16).toString("hex");
    var hash = crypto.pbkdf2Sync(pw, salt, 1000, 64, 'sha512').toString('hex');
    var result = await pool.query(sql, [username, email, fn, ln, hash]);
    return result;
}

module.exports.loginUser = async (username, password) => {
    var grabUserSql = "SELECT * FROM users WHERE username = $1";
    var sqlResult = await pool.query(grabUserSql, [username]);
    console.log(sqlResult.rowCount == 0)
    if (sqlResult.rowCount == 0) {
        throw new Error("Username is incorrect. Please try another username. ");
    }
    var user = sqlResult.rows[0];
    var validLogin = validPassword(password, user.password);
    if (!validLogin) {
        throw new Error("Password did not match. Please try another password. ");
    }
    delete user.password;
    return user;
}

validPassword = (password, storedHash) => {
    var salt = crypto.randomBytes(16).toString("hex");
    var hashedPw = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
    return hashedPw === storedHash;

}