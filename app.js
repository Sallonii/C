const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "cricketMatchDetails.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

//API 1: Returns a list of all the players in the player table
app.get("/players/", async (request, response) => {
  const getPlayersQuery = `
    SELECT player_id AS playerId, player_name AS playerName FROM player_details;`;
  const playerDetailsList = await db.all(getPlayersQuery);
  response.send(playerDetailsList);
});

//API 2: Returns a specific player based on the player ID
app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerFromIdQuery = `
    SELECT player_id AS playerId, player_name AS playerName
    FROM player_details
    WHERE player_id = ${playerId};`;
  const singlePlayer = await db.get(getPlayerFromIdQuery);
  response.send(singlePlayer);
});

//API 3: Updates the details of a specific player based on the player ID
app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;
  const updatePlayerQuery = `
    UPDATE player_details
    SET 
    player_name = '${playerName}'
    WHERE player_id = ${playerId};`;
  await db.run(updatePlayerQuery);
  response.send("Player Details Updated");
});

//API 4: Returns the match details of a specific match
app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchFromIdQuery = `
    SELECT match_id AS matchId, match, year
    FROM match_details
    WHERE match_id = ${matchId};`;
  const singleMatch = await db.get(getMatchFromIdQuery);
  response.send(singleMatch);
});

//API 5: Returns a list of all the matches of a player
app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const getMatchIdQuery = `
    SELECT match_id
    FROM player_match_score
    WHERE player_id = ${playerId};`;
  const getMatchIdResponse = await db.get(getMatchIdQuery);
  const getMatchesQuery = `
  SELECT match_id AS matchId, match, year
  FROM match_details
  WHERE match_id = ${getMatchIdResponse.match_id};`;
  const matchDetailsResponse = await db.all(getMatchesQuery);
  response.send(matchDetailsResponse);
});

//API 6: Returns a list of players of a specific match
app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getPlayerIdQuery = `
    SELECT player_id AS playerId, player_name AS playerName
    FROM player_match_score NATURAL JOIN player_details
    WHERE player_match_score.match_id = ${matchId};`;
  const playerDetailsResponse = await db.all(getPlayerIdQuery);
  response.send(playerDetailsResponse);
});

//API 7: Returns the statistics of the total score, fours, sixes of a specific player based on the player ID
app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const getStatsQuery = `
    SELECT
    player_details.player_id AS playerId,
    player_details.player_name AS playerName,
    SUM(player_match_score.score) AS totalScore,
    SUM(fours) AS totalFours,
    SUM(sixes) AS totalSixes FROM 
    player_details INNER JOIN player_match_score ON
    player_details.player_id = player_match_score.player_id
    WHERE player_details.player_id = ${playerId};`;
  const stats = await db.all(getStatsQuery);
  response.send(stats);
});

module.exports = app;
