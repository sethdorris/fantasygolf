var express = require("express");
var app = express();
var session = require("express-session");
var path = require("path");
var bodyParser = require("body-parser");
var open = require("open");
var Knex = require("knex");
var KnexSessionStore = require("connect-session-knex")(session);
var env = require("./environment.config");
var authDataAccess = require("./datalayer/auth");
var playersDataAccess = require("./datalayer/players");
var teamDataAccess = require ("./datalayer/team");
var fetch = require("node-fetch");
var dbenvironment = env.production;

//******Middleware Setup Section ******
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

console.log("DB Connection", dbenvironment)
//sets the ability to serve and use static assets js/css in our public build folder
app.use(express.static(path.join(__dirname, '..', 'build')));

//sets session store as postgres database
var knex = Knex({
    client: 'pg',
    connection: dbenvironment
});

var store = new KnexSessionStore({
    knex: knex
});

app.use(session({
    store: store,
    secret: "fakesecret",
    cookie: { maxAge: 30 * 24 * 60 * 60 * 1000, secure: false },
    resave: false,
    saveUninitialized: false
}));

app.get("/", (req, res, next) => {
    console.log("Session Id", req.session.userId);
    console.log("what")
    if (req.session.userId) {
        console.log("req", req.session.userId)
        return res.sendFile(path.join(__dirname, "../build", "index.html"))
    } else {
        console.log("no userid")
        return res.sendFile(path.join(__dirname, "../build", "unauth.html"))
    }
})

app.get("/createteam", (req, res, next) => {
    console.log("req session", req.session)
    if (req.session.userId) {
        return res.sendFile(path.join(__dirname, "../build", "createteam.html"))
    } else {
        return res.sendFile(__dirname, "../build", "servererror.html")
    }
})

app.post("/saveteam", async (req, res, next) => {
    var cutOff = new Date("2019", "03", "10", "00");
    if (Date.now > cutOff) {
        return res.json({ success: false, message: "Missed cutoff time" })
    }
    var currentTeam = await teamDataAccess.getTeam(req.session.userId);
    if (currentTeam.length > 0) {
        var removeTeam = await teamDataAccess.deleteTeam(req.session.userId, 1);
    }
    console.log(req.body);
    console.log(req.session)
    if (req.session.userId == null) {
        console.log("null")
    }
    if (req.session.userId == 'undefined') {
        console.log("undefined")
    }
    var savedTeam = await teamDataAccess.saveTeam(req.session.userId, req.body)
    console.log("save team request body", req.body);
    return res.json({ success: true })
})

app.get("/viewcurrent", (req, res, next) => {
    res.sendFile(path.join(__dirname, "../build", "viewcurrent.html"));
})

app.get("/api/owgr", async (req, res, next) => {
    var players = await playersDataAccess.getOgwr();
    var currentTeam = await teamDataAccess.getTeam(req.session.userId);
    return res.json({ players: players, selected: currentTeam });
})

app.get("/api/viewcurrentteam", async (req, res, next) => {
    var currentTeam = await teamDataAccess.getTeam(req.session.userId);

    return res.json({ team: currentTeam });
})

app.get("/api/getleaderboard", async (req, res, next) => {
    var teams = await teamDataAccess.getTeams();
    var leaderboard = await fetch("https://lbdata.pgatour.com/2019/r/014/leaderboard.json").then(res => { return res.json() });
    
    teams.forEach(user => {
        var fieldRoundScores = leaderboard.rows.map(o => {
            if (o.round == "--") {
                o.round = 0;
            }
            return o.round;
        });
        var lowestScore = Math.min(...fieldRoundScores);
        user.team.forEach(golfer => {
            var actualGolfer = leaderboard.rows.filter(actual => {
                return actual.playerNames.firstName == golfer.player.split(" ")[0] &&
                    actual.playerNames.lastName == golfer.player.split(" ")[1];
            })
            console.log("Actual Golfer", actualGolfer);
            if (actualGolfer.length > 0) {
                golfer.currentTotal = actualGolfer[0].total;
                golfer.thru = actualGolfer[0].thru;
                golfer.currentRoundScore = actualGolfer[0].round == "--" ? 0 : actualGolfer[0].round;
                golfer.r1Score = actualGolfer[0].rounds[0].strokes;
                golfer.r2Score = actualGolfer[0].rounds[1].strokes;
                golfer.r3Score = actualGolfer[0].rounds[2].strokes;
                golfer.r4Score = actualGolfer[0].rounds[3].strokes;
                var projectedScore = (20 - ((golfer.currentRoundScore - lowestScore) * 2));
                if (projectedScore < 0) {
                    projectedScore = 0;
                }
                golfer.projectedScore = projectedScore;
            }
        })
        console.log("lowestScore", lowestScore);
        user.currentRound =leaderboard.tournamentRoundId;
    })

    return res.json({ teams: teams })
})


app.get("/login", (req, res, next) => {
    res.sendFile(path.join(__dirname, "../build", "login.html"))
})

app.post("/register", async (req, res, next) => {
    console.log(req.body)
    try {
        var registered = await authDataAccess.registerUser(req.body.username,
            req.body.email,
            req.body.firstname,
            req.body.lastname,
            req.body.password);
    } catch (e) {
        return next(e);
    }
    return res.redirect("/login");
});

app.post("/login", async (req, res, next) => {
    console.log("session", req.session.userId)
    try {
        var loggedIn = await authDataAccess.loginUser(req.body.username, req.body.password);
    } catch (e) {
        console.log("error posting login", e);
        return res.sendFile(path.join(__dirname, "../build", "login.html"))
    }
    req.session.userId = loggedIn.id;
    return res.sendFile(path.join(__dirname, "../build", "index.html"))
});


app.use((err, req, res, next) => {
    //log the error
    console.log("Error", err)
    return res.status(500).json({ error: err.message })
})

app.listen(process.env.PORT || 3000, () => {
    console.log("App is running on port 3000");
    open("http://localhost:3000");
});

